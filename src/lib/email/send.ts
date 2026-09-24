import { buildReminderEmail } from "@/lib/email/template";
import type { ReminderEmailPayload } from "@/lib/email/types";
import { sendViaGmail } from "@/lib/gmail/send";
import type { Invoice } from "@prisma/client";
import { readInvoicePdf } from "@/lib/invoices/attachment";

export const GMAIL_REQUIRED_MESSAGE = "Connect Gmail so reminders come from your address.";

type GmailSender = {
  gmailEmail: string | null;
  gmailRefreshToken: string | null;
  name?: string | null;
  businessName?: string | null;
  reminderSubject?: string | null;
  reminderBody?: string | null;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendInvoiceReminder(payload: ReminderEmailPayload, sender?: GmailSender, invoice?: Invoice) {
  const template =
    sender?.reminderSubject && sender.reminderBody
      ? { subject: sender.reminderSubject, body: sender.reminderBody }
      : null;
  const content = buildReminderEmail(payload, template);

  if (sender?.gmailRefreshToken && sender.gmailEmail) {
    const attachment =
      invoice?.attachmentPath && invoice.attachmentName
        ? {
            filename: invoice.attachmentName,
            contentType: invoice.attachmentContentType || "application/pdf",
            data: await readInvoicePdf(invoice.attachmentPath),
          }
        : undefined;
    const id = await sendViaGmail({
      refreshToken: sender.gmailRefreshToken,
      fromEmail: sender.gmailEmail,
      fromName: sender.businessName || sender.name || "DueNudge",
      to: payload.to,
      content,
      attachment,
    });
    return { id };
  }

  if (isEmailConfigured()) {
    return { needsGmail: true as const };
  }

  console.log("[DueNudge email demo]", { to: payload.to, subject: content.subject, text: content.text });
  return { id: `demo-${Date.now()}` };
}
