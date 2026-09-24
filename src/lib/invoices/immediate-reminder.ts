import type { Client, Invoice, User } from "@prisma/client";
import { deliverReminder } from "@/lib/reminders/delivery";

export type ReminderStatus = "sent" | "demo" | "failed" | "limit" | "gmail";

export async function sendImmediateReminder(
  user: User,
  client: Client,
  invoice: Invoice,
) {
  const result = await deliverReminder(user, client, invoice, 0);
  if (result.ok) {
    return {
      reminderStatus: result.demo ? ("demo" as const) : ("sent" as const),
      reminderError: null,
    };
  }
  const status: ReminderStatus =
    result.code === "limit" ? "limit" : result.code === "gmail" ? "gmail" : "failed";
  return { reminderStatus: status, reminderError: result.error };
}
