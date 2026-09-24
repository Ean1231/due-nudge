import { Prisma, type Client, type Invoice, type User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  allowance: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    reminderLog: {
      create: mocks.create,
      findUnique: mocks.findUnique,
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      updateMany: mocks.updateMany,
      update: mocks.update,
    },
  },
}));
vi.mock("@/lib/billing/allowance", () => ({
  getSendAllowance: mocks.allowance,
  freeSendLimitMessage: () => "Free limit reached",
}));
vi.mock("@/lib/email", () => ({
  sendInvoiceReminder: mocks.send,
  GMAIL_REQUIRED_MESSAGE: "Connect Gmail",
}));

import { deliverReminder } from "@/lib/reminders/delivery";

const user = { id: "user-1", subscriptionStatus: "none" } as User;
const client = { id: "client-1", email: "client@example.com", name: "Client" } as Client;
const invoice = {
  id: "invoice-1",
  number: "INV-1",
  amountCents: 1000,
  currency: "usd",
  dueDate: new Date("2027-01-01"),
} as Invoice;

describe("reminder delivery claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.allowance.mockResolvedValue({ blocked: false });
    mocks.create.mockResolvedValue({ id: "log-1" });
    mocks.update.mockResolvedValue({});
  });

  it("records a successful provider message once", async () => {
    mocks.send.mockResolvedValue({ id: "gmail-1" });
    const result = await deliverReminder(user, client, invoice, 3);
    expect(result).toMatchObject({ ok: true, messageId: "gmail-1" });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "sent" }) }),
    );
  });

  it("records failures without marking them sent", async () => {
    mocks.send.mockRejectedValue(new Error("provider failed"));
    const result = await deliverReminder(user, client, invoice, 3);
    expect(result).toMatchObject({ ok: false, code: "failed" });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed", sentAt: null }) }),
    );
  });

  it("does not send again when the unique claim already exists", async () => {
    mocks.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );
    mocks.findUnique.mockResolvedValue({ id: "log-1", status: "sent" });
    const result = await deliverReminder(user, client, invoice, 3);
    expect(result).toMatchObject({ ok: false, code: "duplicate" });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation before retrying an unknown outcome", async () => {
    mocks.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );
    mocks.findUnique.mockResolvedValue({ id: "log-1", status: "unknown" });
    const result = await deliverReminder(user, client, invoice, 3);
    expect(result).toMatchObject({ ok: false, code: "unknown" });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("reclaims a failed delivery for a controlled retry", async () => {
    mocks.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );
    mocks.findUnique.mockResolvedValue({ id: "log-1", status: "failed" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUniqueOrThrow.mockResolvedValue({ id: "log-1", status: "sending" });
    mocks.send.mockResolvedValue({ id: "gmail-retry" });
    const result = await deliverReminder(user, client, invoice, 3);
    expect(result).toMatchObject({ ok: true, messageId: "gmail-retry" });
    expect(mocks.updateMany).toHaveBeenCalledTimes(1);
  });
});
