import { formatMoney } from "@/lib/money";
import type { ReminderEmailContent, ReminderEmailPayload } from "@/lib/email/types";

export function buildReminderEmail(payload: ReminderEmailPayload): ReminderEmailContent {
  const amount = formatMoney(payload.amountCents, payload.currency);
  const due = payload.dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const text = [
    `Hi ${payload.clientName},`,
    "",
    `This is a reminder from ${payload.businessName} that invoice ${payload.invoiceNumber} for ${amount} (due ${due}) is still unpaid.`,
    "",
    "Please arrange payment at your earliest convenience. If you've already paid, you can ignore this message.",
    "",
    "Thanks,",
    payload.businessName,
  ].join("\n");

  const html = `
    <div style="font-family:Georgia,serif;color:#0f1f1c;line-height:1.6;max-width:560px">
      <p>Hi ${escapeHtml(payload.clientName)},</p>
      <p>This is a reminder from <strong>${escapeHtml(payload.businessName)}</strong> that invoice <strong>${escapeHtml(payload.invoiceNumber)}</strong> for <strong>${escapeHtml(amount)}</strong> (due ${escapeHtml(due)}) is still unpaid.</p>
      <p>Please arrange payment at your earliest convenience. If you've already paid, you can ignore this message.</p>
      <p>Thanks,<br/>${escapeHtml(payload.businessName)}</p>
    </div>
  `;

  return { subject: reminderSubject(payload), text, html };
}

function reminderSubject(payload: ReminderEmailPayload) {
  if (payload.milestone === 0 || payload.milestone >= 100) {
    return `Invoice reminder: ${payload.invoiceNumber} from ${payload.businessName}`;
  }
  if (payload.milestone === 3) {
    return `Friendly reminder: invoice ${payload.invoiceNumber} is overdue`;
  }
  if (payload.milestone === 7) {
    return `Follow-up: invoice ${payload.invoiceNumber} still unpaid`;
  }
  return `Final reminder: invoice ${payload.invoiceNumber} is ${payload.milestone} days overdue`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
