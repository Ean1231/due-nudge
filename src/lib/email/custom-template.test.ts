import { describe, expect, it } from "vitest";
import { buildReminderEmail } from "@/lib/email/template";
import { interpolateTemplate, reminderTemplateSchema } from "@/lib/email/custom-template";

describe("custom reminder templates", () => {
  it("interpolates allowed variables", () => {
    expect(
      interpolateTemplate("Invoice {{invoiceNumber}} for {{clientName}}", {
        clientName: "Alex",
        businessName: "Studio",
        invoiceNumber: "INV-1",
        amount: "$100.00",
        dueDate: "January 1, 2027",
      }),
    ).toBe("Invoice INV-1 for Alex");
  });

  it("rejects unknown variables", () => {
    const parsed = reminderTemplateSchema.safeParse({
      subject: "Hello {{unknown}}",
      body: "Invoice {{invoiceNumber}}",
    });
    expect(parsed.success).toBe(false);
  });

  it("escapes user and template values in HTML", () => {
    const email = buildReminderEmail(
      {
        to: "client@example.com",
        clientName: "<script>alert(1)</script>",
        businessName: "Studio",
        invoiceNumber: "INV-1",
        amountCents: 10000,
        currency: "usd",
        dueDate: new Date("2027-01-01T00:00:00.000Z"),
        milestone: 3,
      },
      { subject: "Reminder {{invoiceNumber}}", body: "Hi {{clientName}}" },
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
