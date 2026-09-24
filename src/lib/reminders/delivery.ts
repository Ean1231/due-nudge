import { Prisma, type Client, type Invoice, type User } from "@prisma/client";
import { freeSendLimitMessage, getSendAllowance } from "@/lib/billing/allowance";
import { prisma } from "@/lib/db";
import { GMAIL_REQUIRED_MESSAGE, sendInvoiceReminder } from "@/lib/email";
import { GmailDeliveryUnknownError } from "@/lib/gmail/send";

export type DeliveryResult =
  | { ok: true; logId: string; messageId: string; demo: boolean; to: string }
  | { ok: false; code: "limit" | "gmail" | "duplicate" | "unknown" | "failed"; error: string };

export async function deliverReminder(
  user: User,
  client: Client,
  invoice: Invoice,
  milestone: number,
  options: { retryUnknown?: boolean } = {},
): Promise<DeliveryResult> {
  const allowance = await getSendAllowance(user);
  if (allowance.blocked) {
    return { ok: false, code: "limit", error: freeSendLimitMessage() };
  }

  const claim = await claimReminder(invoice.id, milestone, options.retryUnknown === true);
  if (claim === "unknown") {
    return {
      ok: false,
      code: "unknown",
      error: "Gmail delivery was not confirmed. Check Sent Mail before choosing to retry.",
    };
  }
  if (!claim) {
    return { ok: false, code: "duplicate", error: "This reminder is already being sent or was sent earlier." };
  }

  try {
    const result = await sendInvoiceReminder(
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
      invoice,
    );

    if ("needsGmail" in result) {
      await failReminder(claim.id, GMAIL_REQUIRED_MESSAGE);
      return { ok: false, code: "gmail", error: GMAIL_REQUIRED_MESSAGE };
    }

    const messageId = result.id || `unknown-${claim.id}`;
    await prisma.reminderLog.update({
      where: { id: claim.id },
      data: {
        status: "sent",
        providerMessageId: messageId,
        error: null,
        sentAt: new Date(),
      },
    });
    return {
      ok: true,
      logId: claim.id,
      messageId,
      demo: messageId.startsWith("demo-"),
      to: client.email,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    await failReminder(claim.id, message, err instanceof GmailDeliveryUnknownError ? "unknown" : "failed");
    return { ok: false, code: "failed", error: message };
  }
}

async function claimReminder(invoiceId: string, milestone: number, retryUnknown: boolean) {
  try {
    return await prisma.reminderLog.create({
      data: { invoiceId, milestone, status: "sending", sentAt: null },
    });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") throw err;
  }

  const existing = await prisma.reminderLog.findUnique({
    where: { invoiceId_milestone: { invoiceId, milestone } },
  });
  if (!existing) return null;
  if (existing.status === "unknown" && !retryUnknown) return "unknown" as const;
  if (existing.status !== "failed" && existing.status !== "unknown") return null;

  const reclaimed = await prisma.reminderLog.updateMany({
    where: { id: existing.id, status: existing.status },
    data: {
      status: "sending",
      error: null,
      attemptCount: { increment: 1 },
      claimedAt: new Date(),
    },
  });
  if (reclaimed.count !== 1) return null;
  return prisma.reminderLog.findUniqueOrThrow({ where: { id: existing.id } });
}

async function failReminder(id: string, error: string, status = "failed") {
  try {
    await prisma.reminderLog.update({
      where: { id },
      data: { status, error: error.slice(0, 1000), sentAt: null },
    });
  } catch (updateError) {
    console.error("[DueNudge] Could not record reminder failure:", updateError);
  }
}
