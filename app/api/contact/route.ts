import { sendContact } from "@/lib/actions";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await sendContact(null, formData);
  const status = result?.error ? 400 : 200;
  return Response.json(result ?? { message: "Message received." }, { status });
}
