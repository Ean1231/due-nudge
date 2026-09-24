import { Resend } from "resend";
import { buildReminderEmail } from "@/lib/email/template";
import type { ReminderEmailPayload } from "@/lib/email/types";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendInvoiceReminder(payload: ReminderEmailPayload) {
  const content = buildReminderEmail(payload);

  if (!isEmailConfigured()) {
    console.log("[DueNudge email demo]", { to: payload.to, subject: content.subject, text: content.text });
    return { id: `demo-${Date.now()}` };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "DueNudge <onboarding@resend.dev>";
  const result = await resend.emails.send({
    from,
    to: payload.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
