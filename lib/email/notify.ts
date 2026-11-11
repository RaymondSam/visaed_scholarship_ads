import "server-only";

const CONTACT_SUBJECT = "New Visaed Scholarships message";

export async function notifyContactInbox(input: { name: string; email: string; reason: string; message: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_INBOX_EMAIL;
  const from = process.env.EMAIL_FROM;
  if (!key || !to || !from || process.env.EMAIL_DISABLE_SEND === "true") return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.email,
      subject: CONTACT_SUBJECT,
      text: `${input.name} wrote about ${input.reason}.\n\n${input.message}`,
    }),
  });
  if (!response.ok) console.error("contact notification failed");
}

export async function notifyAuthLink(input: { to: string; subject: string; body: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from || process.env.EMAIL_DISABLE_SEND === "true") return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.body }),
  });
  if (!response.ok) {
    console.error("auth link notification failed");
    return false;
  }
  return true;
}
