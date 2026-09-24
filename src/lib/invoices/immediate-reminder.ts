import type { Client, Invoice, User } from "@prisma/client";
import { freeSendLimitMessage, getSendAllowance } from "@/lib/billing/allowance";
import { prisma } from "@/lib/db";
import { GMAIL_REQUIRED_MESSAGE, sendInvoiceReminder } from "@/lib/email";

export type ReminderStatus = "sent" | "demo" | "failed" | "limit" | "gmail";

export async function sendImmediateReminder(
  user: User,
  client: Client,
  invoice: Invoice,
) {
  let reminderStatus: ReminderStatus = "failed";
  let reminderError: string | null = null;

  const allowance = await getSendAllowance(user);
  if (allowance.blocked) {
    return { reminderStatus: "limit" as const, reminderError: freeSendLimitMessage() };
  }

  try {
    const emailResult = await sendInvoiceReminder(
      {
        to: client.email,
        clientName: client.name,
        businessName: user.businessName || user.name || "Your freelancers",
        invoiceNumber: invoice.number,
        amountCents: invoice.amountCents,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        milestone: 0,
      },
      user,
    );
    if (emailResult && "needsGmail" in emailResult) {
      return { reminderStatus: "gmail" as const, reminderError: GMAIL_REQUIRED_MESSAGE };
    }

    reminderStatus = isDemoSend(emailResult) ? "demo" : "sent";
    await prisma.reminderLog.create({
      data: { invoiceId: invoice.id, milestone: 0 },
    });
  } catch (err) {
    reminderStatus = "failed";
    reminderError = err instanceof Error ? err.message : "Unknown email error";
    console.error("[DueNudge] Immediate reminder failed:", err);
  }

  return { reminderStatus, reminderError };
}

function isDemoSend(result: { id?: string } | null | undefined) {
  return Boolean(result?.id?.startsWith("demo-"));
}
