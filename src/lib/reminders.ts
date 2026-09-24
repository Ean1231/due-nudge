import { addDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { deliverReminder } from "@/lib/reminders/delivery";

export const REMINDER_MILESTONES = [3, 7, 14] as const;

export async function processDueReminders(now = new Date()) {
  const today = startOfDay(now);
  const unpaid = await prisma.invoice.findMany({
    where: { status: "unpaid" },
    include: {
      client: true,
      user: true,
      reminders: true,
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const invoice of unpaid) {
    const due = startOfDay(invoice.dueDate);
    const sentMilestones = new Set(
      invoice.reminders.filter((reminder) => reminder.status === "sent").map((reminder) => reminder.milestone),
    );

    for (const milestone of REMINDER_MILESTONES) {
      if (sentMilestones.has(milestone)) continue;

      const sendOn = addDays(due, milestone);
      if (today < sendOn) continue;

      try {
        const result = await deliverReminder(invoice.user, invoice.client, invoice, milestone);
        if (result.ok) {
          sent += 1;
          continue;
        }
        if (result.code === "limit" || result.code === "gmail") break;
        if (result.code !== "duplicate") {
          errors.push(`Invoice ${invoice.id} milestone +${milestone}: ${result.error}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Invoice ${invoice.id} milestone +${milestone}: ${message}`);
      }
    }
  }

  return { checked: unpaid.length, sent, errors };
}

