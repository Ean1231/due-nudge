import { Resend } from "resend";
import { formatMoney } from "@/lib/money";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export type ReminderEmailPayload = {
  to: string;
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  dueDate: Date;
  milestone: number;
};

export async function sendInvoiceReminder(payload: ReminderEmailPayload) {
  const subject =
    payload.milestone === 3
      ? `Friendly reminder: invoice ${payload.invoiceNumber} is overdue`
      : payload.milestone === 7
        ? `Follow-up: invoice ${payload.invoiceNumber} still unpaid`
        : `Final reminder: invoice ${payload.invoiceNumber} is ${payload.milestone} days overdue`;

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
    `Thanks,`,
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

  if (!isEmailConfigured()) {
    console.log("[DueNudge email demo]", { to: payload.to, subject, text });
    return { id: `demo-${Date.now()}` };
  }

  const resend = getResend();
  const from = process.env.EMAIL_FROM || "DueNudge <onboarding@resend.dev>";
  const result = await resend.emails.send({
    from,
    to: payload.to,
    subject,
    text,
    html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
