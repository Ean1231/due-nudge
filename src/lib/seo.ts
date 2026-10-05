export const SITE_NAME = "DueNudge";

export const SITE_DESCRIPTION =
  "DueNudge emails your clients about unpaid invoices: once when you send the reminder, then 3, 7, and 14 days after the due date.";

export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "https://due-nudge.vercel.app";
  return configured.replace(/\/$/, "");
}
