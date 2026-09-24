import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  findFirst: vi.fn(),
  readPdf: vi.fn(),
}));

vi.mock("@/lib/api/require-user", () => ({ requireApiUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  prisma: { invoice: { findFirst: mocks.findFirst } },
}));
vi.mock("@/lib/invoices/attachment", () => ({ readInvoicePdf: mocks.readPdf }));

import { GET } from "@/app/api/invoices/[id]/attachment/route";

describe("private invoice attachment download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ user: { id: "owner-1" }, error: null });
  });

  it("does not disclose another user's attachment", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ id: "invoice-1" }),
    });
    expect(response.status).toBe(404);
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "invoice-1", userId: "owner-1" } }),
    );
    expect(mocks.readPdf).not.toHaveBeenCalled();
  });

  it("serves an owned PDF without public caching", async () => {
    mocks.findFirst.mockResolvedValue({
      attachmentPath: "invoices/owner-1/file.pdf",
      attachmentName: "invoice.pdf",
    });
    mocks.readPdf.mockResolvedValue(Buffer.from("%PDF-test"));
    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ id: "invoice-1" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toContain("invoice.pdf");
  });
});
