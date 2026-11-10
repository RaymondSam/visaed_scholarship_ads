import { ScholarshipEditor } from "@/components/scholarship-editor";

export const metadata = { title: "New listing" };

export default function NewScholarshipPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">New listing</h1>
      <div className="mt-6">
        <ScholarshipEditor scholarship={null} internal={null} />
      </div>
    </div>
  );
}
