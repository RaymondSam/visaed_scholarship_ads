import { notFound, redirect } from "next/navigation";
import { ScholarshipView } from "@/components/scholarship-view";
import { currentProfile } from "@/lib/auth/current";
import { getRepository } from "@/lib/data/local-store";

export const metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentProfile();
  if (!user) redirect("/login");
  const { id } = await params;
  const record = await getRepository().getManaged(user.id, id);
  if (!record) notFound();
  const related = record.scholarship.status === "published" ? await getRepository().related(record.scholarship.id) : [];
  return <ScholarshipView scholarship={record.scholarship} related={related} preview />;
}
