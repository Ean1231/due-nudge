import { addDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { sendInvoiceReminder } from "@/lib/email";

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
    const sentMilestones = new Set(invoice.reminders.map((r) => r.milestone));

    for (const milestone of REMINDER_MILESTONES) {
      if (sentMilestones.has(milestone)) continue;

      const sendOn = addDays(due, milestone);
      if (today < sendOn) continue;

      try {
        await sendInvoiceReminder({
          to: invoice.client.email,
          clientName: invoice.client.name,
          businessName: invoice.user.businessName || invoice.user.name || "Your freelancers",
          invoiceNumber: invoice.number,
          amountCents: invoice.amountCents,
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          milestone,
        });

        await prisma.reminderLog.create({
          data: {
            invoiceId: invoice.id,
            milestone,
          },
        });
        sent += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Invoice ${invoice.id} milestone +${milestone}: ${message}`);
      }
    }
  }

  return { checked: unpaid.length, sent, errors };
}

