import { buildReminderEmail } from "@/lib/email/template";
import type { ReminderEmailPayload } from "@/lib/email/types";
import { sendViaGmail } from "@/lib/gmail/send";
import type { Invoice } from "@prisma/client";
import { readInvoicePdf, readStoredAttachment } from "@/lib/invoices/attachment";

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
    const attachments: Array<{ filename: string; contentType: string; data: Buffer }> = [];
    if (invoice?.attachmentPath && invoice.attachmentName) {
      attachments.push({
            filename: invoice.attachmentName,
            contentType: invoice.attachmentContentType || "application/pdf",
            data: await readInvoicePdf(invoice.attachmentPath),
      });
    }
    if (invoice?.sourceDocumentPath && invoice.sourceDocumentName) {
      attachments.push({
        filename: invoice.sourceDocumentName,
        contentType: invoice.sourceDocumentContentType || "application/octet-stream",
        data: await readStoredAttachment(invoice.sourceDocumentPath),
      });
    }
    const id = await sendViaGmail({
      refreshToken: sender.gmailRefreshToken,
      fromEmail: sender.gmailEmail,
      fromName: sender.businessName || sender.name || "DueNudge",
      to: payload.to,
      content,
      attachments,
    });
    return { id };
  }

  if (isEmailConfigured()) {
    return { needsGmail: true as const };
  }

  console.log("[DueNudge email demo]", { to: payload.to, subject: content.subject, text: content.text });
  return { id: `demo-${Date.now()}` };
}
