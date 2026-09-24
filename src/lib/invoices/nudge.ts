import type { Client, Invoice, ReminderLog, User } from "@prisma/client";
import { freeSendLimitMessage, getSendAllowance } from "@/lib/billing/allowance";
import { prisma } from "@/lib/db";
import { GMAIL_REQUIRED_MESSAGE, sendInvoiceReminder } from "@/lib/email";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function sendManualReminder(
  user: User,
  client: Client,
  invoice: Invoice,
  reminders: ReminderLog[],
) {
  const latest = reminders.reduce<Date | null>((newest, reminder) => {
    if (!newest || reminder.sentAt > newest) return reminder.sentAt;
    return newest;
  }, null);

  if (latest && Date.now() - latest.getTime() < DAY_MS) {
    return { ok: false as const, error: "This client was already emailed about this invoice in the last 24 hours." };
  }

  const allowance = await getSendAllowance(user);
  if (allowance.blocked) {
    return { ok: false as const, error: freeSendLimitMessage(), limit: true as const };
  }

  const manualCount = reminders.filter((reminder) => reminder.milestone >= 100).length;
  const milestone = 100 + manualCount;
  const emailResult = await sendInvoiceReminder(
    {
      to: client.email,
      clientName: client.name,
      businessName: user.businessName || user.name || "Your freelancers",
      invoiceNumber: invoice.number,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      milestone,
    },
    user,
  );
  if (emailResult && "needsGmail" in emailResult) {
    return { ok: false as const, error: GMAIL_REQUIRED_MESSAGE, gmail: true as const };
  }

  await prisma.reminderLog.create({
    data: { invoiceId: invoice.id, milestone },
  });

  const demo = Boolean(emailResult && "id" in emailResult && String(emailResult.id).startsWith("demo-"));
  return { ok: true as const, demo, to: client.email };
}
