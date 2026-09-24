import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  hasAccess: vi.fn(),
  billingRequired: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { reminderLog: { count: mocks.count } },
}));
vi.mock("@/lib/billing/status", () => ({
  hasAppAccess: mocks.hasAccess,
  isBillingRequired: mocks.billingRequired,
}));

import { getSendAllowance } from "@/lib/billing/allowance";

describe("free send allowance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.billingRequired.mockReturnValue(true);
    mocks.hasAccess.mockReturnValue(false);
  });

  it("counts only sending and confirmed deliveries", async () => {
    mocks.count.mockResolvedValue(2);
    const allowance = await getSendAllowance({ id: "user-1", subscriptionStatus: "none" });
    expect(mocks.count).toHaveBeenCalledWith({
      where: {
        invoice: { userId: "user-1" },
        status: { in: ["sending", "sent"] },
      },
    });
    expect(allowance).toMatchObject({ used: 2, remaining: 1, blocked: false });
  });

  it("blocks the fourth free send", async () => {
    mocks.count.mockResolvedValue(3);
    await expect(getSendAllowance({ id: "user-1", subscriptionStatus: "none" })).resolves.toMatchObject({
      remaining: 0,
      blocked: true,
    });
  });
});
