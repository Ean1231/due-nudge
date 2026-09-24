import { buildReminderEmail } from "@/lib/email/template";
import type { ReminderEmailPayload } from "@/lib/email/types";
import { sendViaGmail } from "@/lib/gmail/send";

export const GMAIL_REQUIRED_MESSAGE = "Connect Gmail so reminders come from your address.";

type GmailSender = {
  gmailEmail: string | null;
  gmailRefreshToken: string | null;
  name?: string | null;
  businessName?: string | null;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendInvoiceReminder(payload: ReminderEmailPayload, sender?: GmailSender) {
  const content = buildReminderEmail(payload);

  if (sender?.gmailRefreshToken && sender.gmailEmail) {
    const id = await sendViaGmail({
      refreshToken: sender.gmailRefreshToken,
      fromEmail: sender.gmailEmail,
      fromName: sender.businessName || sender.name || "DueNudge",
      to: payload.to,
      content,
    });
    return { id };
  }

  if (isEmailConfigured()) {
    return { needsGmail: true as const };
  }

  console.log("[DueNudge email demo]", { to: payload.to, subject: content.subject, text: content.text });
  return { id: `demo-${Date.now()}` };
}
