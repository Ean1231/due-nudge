import { describe, expect, it } from "vitest";
import { isOwnedStoragePath, safeDownloadName } from "@/lib/security/storage-path";

describe("storage paths", () => {
  it("allows only files stored under the owner", () => {
    expect(isOwnedStoragePath("user-1", "invoices/user-1/file.pdf")).toBe(true);
    expect(isOwnedStoragePath("user-1", "invoices/user-2/file.pdf")).toBe(false);
    expect(isOwnedStoragePath("user-1", "invoices/user-1/../user-2/file.pdf")).toBe(false);
  });

  it("strips header-breaking characters from download names", () => {
    expect(safeDownloadName('invoice"\r\n.pdf')).toBe("invoice.pdf");
  });
});
