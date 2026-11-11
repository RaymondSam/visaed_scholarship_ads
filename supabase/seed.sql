-- Sample listings for local `supabase db reset` and preview.
-- Production does not run this file. New rows must start as drafts; the
-- status trigger rejects a published insert.

insert into public.scholarships (
  id,
  title,
  summary,
  description_markdown,
  provider_name,
  provider_url,
  application_url,
  application_mode,
  status,
  study_levels,
  funding_type,
  is_rolling,
  open_to_all_nationalities,
  host_country_code,
  last_verified_at
) values (
  '11111111-1111-4111-8111-111111111111',
  'Example Research Award',
  'A fictional award used to preview the catalog layout. It is not a real scholarship and nobody can apply.',
  'This listing is sample data for local development. Staff replace it before launch.',
  'Example Foundation',
  'https://example.com',
  'https://example.com/apply',
  'external',
  'draft',
  array['master']::public.study_level[],
  'partial',
  true,
  true,
  'KE',
  now()
);

insert into public.scholarship_study_fields (scholarship_id, study_field_id)
values ('11111111-1111-4111-8111-111111111111', 'computer-science');

insert into public.scholarship_internal (scholarship_id, upfront_fee_absent_confirmed, source_notes)
values (
  '11111111-1111-4111-8111-111111111111',
  true,
  'Fictional seed. Do not publish this wording on the production project.'
);

update public.scholarships
set status = 'published',
    slug = 'example-research-award'
where id = '11111111-1111-4111-8111-111111111111';
