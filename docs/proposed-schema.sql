-- Visaed Scholarships — draft database contract
-- Target: Supabase Postgres
-- Status: design artifact. The first implementation migration should be
-- created from this file. After that, supabase/migrations is authoritative.
--
-- Assumes Supabase auth helpers: auth.uid(), auth.role(), auth.users.
-- Do not run this against a non-Supabase Postgres without those.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('super_admin', 'admin', 'student');
create type public.account_status as enum ('invited', 'active', 'suspended');
create type public.scholarship_status as enum ('draft', 'published', 'closed', 'archived');
create type public.study_level as enum (
  'secondary',
  'certificate',
  'diploma',
  'bachelor',
  'master',
  'doctorate',
  'postdoctoral'
);
create type public.funding_type as enum ('full', 'partial', 'tuition', 'stipend', 'other');
create type public.application_mode as enum ('external', 'coming_soon');
create type public.delivery_mode as enum ('on_campus', 'online', 'hybrid');
create type public.contact_reason as enum (
  'general',
  'correction',
  'privacy',
  'partnership',
  'account_help'
);
create type public.contact_status as enum ('new', 'read', 'closed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_active_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role = 'super_admin'
  );
$$;

revoke all on function public.is_active_staff() from public;
revoke all on function public.is_active_super_admin() from public;
grant execute on function public.is_active_staff() to anon, authenticated, service_role;
grant execute on function public.is_active_super_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  status public.account_status not null default 'invited',
  full_name text not null,
  country_code char(2),
  education_level public.study_level,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_country_code_format check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  ),
  constraint profiles_full_name_present check (char_length(trim(full_name)) > 0)
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Missing app_metadata.role does not create a profile and does not raise.
-- That auth user cannot pass any policy that requires a profile.
-- An unknown role raises, so a bad invite fails instead of becoming a student.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned text;
begin
  assigned := new.raw_app_meta_data ->> 'role';
  if assigned is null then
    return new;
  end if;
  if assigned not in ('super_admin', 'admin', 'student') then
    raise exception 'Unknown role %', assigned;
  end if;

  insert into public.profiles (id, role, status, full_name)
  values (
    new.id,
    assigned::public.user_role,
    'invited',
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Invited user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.guard_profile()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  jwt_role text := coalesce(auth.role(), '');
begin
  if jwt_role = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.invited_by is distinct from old.invited_by
     or new.id is distinct from old.id then
    raise exception 'Profile administration fields are locked';
  end if;

  if new.status is distinct from old.status then
    if old.status = 'invited'
       and new.status = 'active'
       and new.id = auth.uid() then
      return new;
    end if;
    raise exception 'Status change is not allowed';
  end if;

  return new;
end;
$$;

create trigger profiles_guard
before update on public.profiles
for each row execute function public.guard_profile();

-- ---------------------------------------------------------------------------
-- Study fields
-- ---------------------------------------------------------------------------

create table public.study_fields (
  id text primary key,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  constraint study_fields_id_format check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.profile_study_fields (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  study_field_id text not null references public.study_fields (id),
  primary key (profile_id, study_field_id)
);

insert into public.study_fields (id, name, sort_order) values
  ('agriculture', 'Agriculture', 10),
  ('architecture', 'Architecture', 20),
  ('arts-and-design', 'Arts and design', 30),
  ('business', 'Business', 40),
  ('computer-science', 'Computer science', 50),
  ('education', 'Education', 60),
  ('engineering', 'Engineering', 70),
  ('environmental-studies', 'Environmental studies', 80),
  ('health-sciences', 'Health sciences', 90),
  ('humanities', 'Humanities', 100),
  ('law', 'Law', 110),
  ('mathematics', 'Mathematics', 120),
  ('medicine', 'Medicine', 130),
  ('natural-sciences', 'Natural sciences', 140),
  ('social-sciences', 'Social sciences', 150),
  ('vocational', 'Vocational', 160),
  ('other', 'Other', 170);

-- ---------------------------------------------------------------------------
-- Scholarships
-- ---------------------------------------------------------------------------

create table public.scholarships (
  id uuid primary key default gen_random_uuid(),
  slug citext,
  title text not null default '',
  summary text not null default '',
  description_markdown text not null default '',
  eligibility_markdown text not null default '',
  benefits_markdown text not null default '',
  required_documents text[] not null default '{}',
  provider_name text not null default '',
  provider_url text,
  application_url text,
  application_mode public.application_mode not null default 'external',
  status public.scholarship_status not null default 'draft',
  is_featured boolean not null default false,
  is_sponsored boolean not null default false,
  sponsor_disclosure text,
  study_levels public.study_level[] not null default '{}',
  funding_type public.funding_type,
  amount_min numeric(12, 2),
  amount_max numeric(12, 2),
  currency char(3),
  funding_notes text,
  host_country_code char(2),
  is_remote boolean not null default false,
  delivery_mode public.delivery_mode,
  open_to_all_nationalities boolean not null default false,
  eligible_country_codes char(2)[] not null default '{}',
  deadline_at timestamptz,
  deadline_timezone text,
  is_rolling boolean not null default false,
  cover_image_path text,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  closed_at timestamptz,
  last_verified_at timestamptz,
  review_due_at timestamptz generated always as (
    case
      when last_verified_at is null then null
      else last_verified_at + interval '90 days'
    end
  ) stored,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(summary, '')), 'A')
    || setweight(to_tsvector('english', coalesce(provider_name, '')), 'B')
    || setweight(to_tsvector('english', coalesce(description_markdown, '')), 'C')
  ) stored,
  constraint scholarships_slug_format check (
    slug is null or slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint scholarships_amounts check (
    (amount_min is null or amount_min >= 0)
    and (amount_max is null or amount_max >= 0)
    and (amount_min is null or amount_max is null or amount_min <= amount_max)
    and (
      (amount_min is null and amount_max is null)
      or currency is not null
    )
  ),
  constraint scholarships_currency_format check (
    currency is null or currency ~ '^[A-Z]{3}$'
  ),
  constraint scholarships_host_country check (
    host_country_code is null or host_country_code ~ '^[A-Z]{2}$'
  ),
  constraint scholarships_rolling check (
    not is_rolling or deadline_at is null
  ),
  constraint scholarships_deadline_zone check (
    deadline_at is null or (
      deadline_timezone is not null and char_length(trim(deadline_timezone)) > 0
    )
  ),
  constraint scholarships_eligible_codes check (
    not exists (
      select 1
      from unnest(eligible_country_codes) as code
      where code !~ '^[A-Z]{2}$'
    )
  )
);

create unique index scholarships_slug_unique
  on public.scholarships (slug)
  where slug is not null;

create index scholarships_search_idx
  on public.scholarships using gin (search_vector);

create index scholarships_status_deadline_idx
  on public.scholarships (status, deadline_at);

create index scholarships_review_due_idx
  on public.scholarships (status, review_due_at);

create index scholarships_featured_idx
  on public.scholarships (published_at desc)
  where is_featured and status = 'published';

create trigger scholarships_set_updated_at
before update on public.scholarships
for each row execute function public.set_updated_at();

create table public.scholarship_study_fields (
  scholarship_id uuid not null references public.scholarships (id) on delete cascade,
  study_field_id text not null references public.study_fields (id),
  primary key (scholarship_id, study_field_id)
);

create table public.scholarship_internal (
  scholarship_id uuid primary key references public.scholarships (id) on delete cascade,
  source_notes text,
  editorial_notes text,
  upfront_fee_absent_confirmed boolean not null default false,
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger scholarship_internal_set_updated_at
before update on public.scholarship_internal
for each row execute function public.set_updated_at();

create or replace function public.assert_scholarship_publishable(row public.scholarships)
returns void
language plpgsql
set search_path = public
as $$
begin
  if row.slug is null or row.slug::text !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'A published listing needs a valid slug';
  end if;
  if char_length(trim(row.title)) = 0 then
    raise exception 'A published listing needs a title';
  end if;
  if char_length(trim(row.summary)) < 40 or char_length(trim(row.summary)) > 280 then
    raise exception 'Summary must be between 40 and 280 characters to publish';
  end if;
  if char_length(trim(row.description_markdown)) = 0 then
    raise exception 'A published listing needs a description';
  end if;
  if char_length(trim(row.provider_name)) = 0 or row.provider_url is null or row.provider_url !~ '^https://' then
    raise exception 'A published listing needs a provider name and an https provider URL';
  end if;
  if row.application_mode = 'external' and (row.application_url is null or row.application_url !~ '^https://') then
    raise exception 'An external application needs an https URL';
  end if;
  if cardinality(row.study_levels) < 1 then
    raise exception 'Choose at least one study level to publish';
  end if;
  if not exists (
    select 1 from public.scholarship_study_fields f where f.scholarship_id = row.id
  ) then
    raise exception 'Choose at least one field of study to publish';
  end if;
  if row.funding_type is null then
    raise exception 'Choose a funding type to publish';
  end if;
  if row.is_rolling then
    null;
  elsif row.deadline_at is null or row.deadline_timezone is null then
    raise exception 'Set a deadline and timezone, or mark the listing as rolling';
  end if;
  if row.last_verified_at is null then
    raise exception 'Record the date the listing was checked before publishing';
  end if;
  if row.is_sponsored and (row.sponsor_disclosure is null or char_length(trim(row.sponsor_disclosure)) = 0) then
    raise exception 'A sponsored listing needs a public disclosure';
  end if;
  if not exists (
    select 1
    from public.scholarship_internal i
    where i.scholarship_id = row.id
      and i.upfront_fee_absent_confirmed
  ) then
    raise exception 'Confirm that applicants are not charged an upfront fee';
  end if;
end;
$$;

create or replace function public.enforce_scholarship_rules()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;

  if tg_op = 'INSERT' then
    if new.created_by is null then
      new.created_by := auth.uid();
    end if;
    if new.status <> 'draft' then
      raise exception 'New listings start as drafts';
    end if;
    new.is_featured := false;
    new.published_at := null;
    new.closed_at := null;
    return new;
  end if;

  if old.published_at is not null and new.slug is distinct from old.slug then
    raise exception 'Slug is locked after the listing has been published';
  end if;

  if old.status is distinct from new.status then
    if not (
      (old.status = 'draft' and new.status in ('published', 'archived'))
      or (old.status = 'published' and new.status in ('draft', 'closed', 'archived'))
      or (old.status = 'closed' and new.status in ('published', 'archived'))
    ) then
      raise exception 'Status cannot move from % to %', old.status, new.status;
    end if;
  end if;

  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at := now();
    new.closed_at := null;
  end if;

  if new.status = 'published' then
    perform public.assert_scholarship_publishable(new);
  end if;

  if new.status = 'closed' and old.status is distinct from 'closed' then
    new.closed_at := now();
  end if;

  if new.status <> 'published' then
    new.is_featured := false;
  end if;

  return new;
end;
$$;

create trigger scholarships_enforce_rules
before insert or update on public.scholarships
for each row execute function public.enforce_scholarship_rules();

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create index audit_logs_created_idx
  on public.audit_logs (created_at desc);

create or replace function public.audit_scholarship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_action text;
  source text := nullif(current_setting('app.audit_source', true), '');
begin
  if tg_op = 'INSERT' then
    next_action := 'scholarship.created';
  elsif old.status is distinct from new.status then
    next_action := case new.status
      when 'published' then 'scholarship.published'
      when 'draft' then 'scholarship.unpublished'
      when 'closed' then 'scholarship.closed'
      when 'archived' then 'scholarship.archived'
      else 'scholarship.updated'
    end;
  else
    next_action := 'scholarship.updated';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    next_action,
    'scholarship',
    new.id,
    jsonb_strip_nulls(jsonb_build_object(
      'source', source,
      'from_status', case when tg_op = 'UPDATE' then old.status::text else null end,
      'to_status', new.status::text,
      'title_changed', tg_op = 'UPDATE' and old.title is distinct from new.title,
      'body_changed', tg_op = 'UPDATE' and (
        old.description_markdown is distinct from new.description_markdown
        or old.eligibility_markdown is distinct from new.eligibility_markdown
        or old.benefits_markdown is distinct from new.benefits_markdown
      )
    ))
  );
  return new;
end;
$$;

create trigger scholarships_audit
after insert or update on public.scholarships
for each row execute function public.audit_scholarship();

create or replace function public.audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.skip_profile_audit', true) = 'on' then
    return new;
  end if;
  if old.role is not distinct from new.role and old.status is not distinct from new.status then
    return new;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    case
      when old.role is distinct from new.role then 'user.role_changed'
      when new.status = 'suspended' then 'user.suspended'
      when old.status = 'suspended' and new.status = 'active' then 'user.reactivated'
      else 'user.updated'
    end,
    'profile',
    new.id,
    jsonb_build_object(
      'from_role', old.role,
      'to_role', new.role,
      'from_status', old.status,
      'to_status', new.status
    )
  );
  return new;
end;
$$;

create trigger profiles_audit
after update on public.profiles
for each row execute function public.audit_profile_change();

-- ---------------------------------------------------------------------------
-- Contact and rate limits
-- ---------------------------------------------------------------------------

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  reason public.contact_reason not null,
  message text not null,
  status public.contact_status not null default 'new',
  handled_by uuid references public.profiles (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint contact_name_len check (char_length(trim(name)) between 1 and 120),
  constraint contact_message_len check (char_length(trim(message)) between 1 and 5000),
  constraint contact_email_shape check (position('@' in email) > 1)
);

create index contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

create table public.rate_limit_buckets (
  bucket_key text not null,
  window_start timestamptz not null,
  hit_count integer not null default 1,
  primary key (bucket_key, window_start)
);

-- ---------------------------------------------------------------------------
-- Privileged functions
-- The server passes actor from the session. It must not pass an id from the body.
-- Execute is granted to service_role only.
-- ---------------------------------------------------------------------------

create or replace function public.list_accounts(actor uuid)
returns table (
  id uuid,
  email text,
  full_name text,
  role public.user_role,
  status public.account_status,
  invited_by uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = actor
      and p.role = 'super_admin'
      and p.status = 'active'
  ) then
    raise exception 'Not allowed';
  end if;

  return query
  select p.id, u.email::text, p.full_name, p.role, p.status, p.invited_by, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

create or replace function public.apply_account_change(
  actor uuid,
  target uuid,
  new_role public.user_role,
  new_status public.account_status
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  previous public.profiles%rowtype;
  next_action text;
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = actor
      and p.role = 'super_admin'
      and p.status = 'active'
  ) then
    raise exception 'Not allowed';
  end if;

  select * into previous from public.profiles where id = target;
  if not found then
    raise exception 'Account not found';
  end if;

  if previous.role = 'super_admin'
     and previous.status = 'active'
     and (new_role <> 'super_admin' or new_status <> 'active')
     and (
       select count(*)
       from public.profiles
       where role = 'super_admin'
         and status = 'active'
         and id <> target
     ) = 0 then
    raise exception 'The last active super admin cannot be removed';
  end if;

  perform set_config('app.skip_profile_audit', 'on', true);

  update public.profiles
  set role = new_role,
      status = new_status
  where id = target;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  where id = target;

  next_action := case
    when previous.role is distinct from new_role then 'user.role_changed'
    when new_status = 'suspended' and previous.status is distinct from 'suspended' then 'user.suspended'
    when previous.status = 'suspended' and new_status = 'active' then 'user.reactivated'
    else 'user.updated'
  end;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor,
    next_action,
    'profile',
    target,
    jsonb_build_object(
      'from_role', previous.role,
      'to_role', new_role,
      'from_status', previous.status,
      'to_status', new_status
    )
  );
end;
$$;

create or replace function public.mark_invited_by(actor uuid, target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = actor
      and p.role = 'super_admin'
      and p.status = 'active'
  ) then
    raise exception 'Not allowed';
  end if;

  update public.profiles
  set invited_by = actor
  where id = target
    and invited_by is null;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor,
    'user.invited',
    'profile',
    target,
    jsonb_build_object('role', (select role from public.profiles where id = target))
  );
end;
$$;

create or replace function public.close_expired_scholarships()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  closed_count integer;
begin
  perform set_config('app.audit_source', 'cron', true);
  update public.scholarships
  set status = 'closed'
  where status = 'published'
    and not is_rolling
    and deadline_at is not null
    and deadline_at < now();
  get diagnostics closed_count = row_count;
  return closed_count;
end;
$$;

create or replace function public.purge_rate_limit_buckets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.rate_limit_buckets
  where window_start < now() - interval '48 hours';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.list_accounts(uuid) from public;
revoke all on function public.apply_account_change(uuid, uuid, public.user_role, public.account_status) from public;
revoke all on function public.mark_invited_by(uuid, uuid) from public;
revoke all on function public.close_expired_scholarships() from public;
revoke all on function public.purge_rate_limit_buckets() from public;
revoke all on function public.assert_scholarship_publishable(public.scholarships) from public;
revoke all on function public.handle_new_user() from public;

grant execute on function public.list_accounts(uuid) to service_role;
grant execute on function public.apply_account_change(uuid, uuid, public.user_role, public.account_status) to service_role;
grant execute on function public.mark_invited_by(uuid, uuid) to service_role;
grant execute on function public.close_expired_scholarships() to service_role;
grant execute on function public.purge_rate_limit_buckets() to service_role;

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- Supabase may also apply default privileges. Revoke first, then grant
-- only what the API roles need. service_role retains full access.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.study_fields enable row level security;
alter table public.profile_study_fields enable row level security;
alter table public.scholarships enable row level security;
alter table public.scholarship_study_fields enable row level security;
alter table public.scholarship_internal enable row level security;
alter table public.audit_logs enable row level security;
alter table public.contact_messages enable row level security;
alter table public.rate_limit_buckets enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.study_fields from anon, authenticated;
revoke all on public.profile_study_fields from anon, authenticated;
revoke all on public.scholarships from anon, authenticated;
revoke all on public.scholarship_study_fields from anon, authenticated;
revoke all on public.scholarship_internal from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;
revoke all on public.rate_limit_buckets from anon, authenticated;

grant select on public.profiles to authenticated;
-- status is included so an invitee can move invited -> active.
-- The guard trigger rejects every other status change and every role change.
grant update (full_name, country_code, education_level, status) on public.profiles to authenticated;

grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;
grant execute on function public.set_updated_at() to authenticated, service_role;
grant execute on function public.guard_profile() to authenticated, service_role;
grant execute on function public.enforce_scholarship_rules() to authenticated, service_role;
grant execute on function public.audit_scholarship() to authenticated, service_role;
grant execute on function public.audit_profile_change() to authenticated, service_role;

grant select on public.study_fields to anon, authenticated;

grant select, insert, delete on public.profile_study_fields to authenticated;

grant select on public.scholarships to anon, authenticated;
grant insert, update on public.scholarships to authenticated;

grant select on public.scholarship_study_fields to anon, authenticated;
grant insert, delete on public.scholarship_study_fields to authenticated;

grant select, insert, update on public.scholarship_internal to authenticated;

grant select on public.audit_logs to authenticated;

grant select, update on public.contact_messages to authenticated;

-- profiles
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy profiles_select_staff_directory
on public.profiles
for select
to authenticated
using (
  public.is_active_staff()
  and role in ('admin', 'super_admin')
);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- study fields
create policy study_fields_public_read
on public.study_fields
for select
to anon, authenticated
using (active);

-- profile interests
create policy profile_interests_own
on public.profile_study_fields
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- scholarships
create policy scholarships_public_read
on public.scholarships
for select
to anon, authenticated
using (status in ('published', 'closed'));

create policy scholarships_staff_read
on public.scholarships
for select
to authenticated
using (public.is_active_staff());

create policy scholarships_staff_insert
on public.scholarships
for insert
to authenticated
with check (public.is_active_staff() and created_by = auth.uid());

create policy scholarships_staff_update
on public.scholarships
for update
to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

-- scholarship fields
create policy scholarship_fields_public_read
on public.scholarship_study_fields
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.scholarships s
    where s.id = scholarship_id
      and s.status in ('published', 'closed')
  )
);

create policy scholarship_fields_staff_write
on public.scholarship_study_fields
for all
to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

-- internal notes: no anon policy, so the default is deny
create policy scholarship_internal_staff
on public.scholarship_internal
for all
to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

-- audit
create policy audit_super_admin_read
on public.audit_logs
for select
to authenticated
using (public.is_active_super_admin());

-- contact inbox. Inserts are service-role only, from the contact route.
create policy contact_staff_read
on public.contact_messages
for select
to authenticated
using (public.is_active_staff());

create policy contact_staff_update
on public.contact_messages
for update
to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

-- ---------------------------------------------------------------------------
-- Storage. Public reads are safe only because this bucket holds cover images.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scholarship-media',
  'scholarship-media',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy scholarship_media_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'scholarship-media');

create policy scholarship_media_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'scholarship-media'
  and public.is_active_staff()
  and name like 'scholarships/%'
);

create policy scholarship_media_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'scholarship-media'
  and public.is_active_staff()
  and name like 'scholarships/%'
)
with check (
  bucket_id = 'scholarship-media'
  and public.is_active_staff()
  and name like 'scholarships/%'
);

create policy scholarship_media_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'scholarship-media'
  and public.is_active_staff()
  and name like 'scholarships/%'
);
