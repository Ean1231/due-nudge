import type { Client, Invoice, ReminderLog, User } from "@prisma/client";
import { deliverReminder } from "@/lib/reminders/delivery";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function sendManualReminder(
  user: User,
  client: Client,
  invoice: Invoice,
  reminders: ReminderLog[],
  retryUnknown = false,
) {
  const latest = reminders.reduce<Date | null>((newest, reminder) => {
    if (reminder.status !== "sent" || !reminder.sentAt) return newest;
    if (!newest || reminder.sentAt > newest) return reminder.sentAt;
    return newest;
  }, null);

  if (latest && Date.now() - latest.getTime() < DAY_MS) {
    return { ok: false as const, error: "This client was already emailed about this invoice in the last 24 hours." };
  }

  const manualCount = reminders.filter((reminder) => reminder.milestone >= 100 && reminder.status === "sent").length;
  const milestone = 100 + manualCount;
  const result = await deliverReminder(user, client, invoice, milestone, { retryUnknown });
  if (result.ok) return result;
  return {
    ok: false as const,
    code: result.code,
    error: result.error,
  };
}
