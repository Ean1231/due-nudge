import { decryptGmailToken } from "@/lib/gmail/token";
import { gmailAccessToken } from "@/lib/gmail/oauth";
import type { ReminderEmailContent } from "@/lib/email/types";

export async function sendViaGmail(input: {
  refreshToken: string;
  fromEmail: string;
  fromName: string;
  to: string;
  content: ReminderEmailContent;
}) {
  const accessToken = await gmailAccessToken(decryptGmailToken(input.refreshToken));
  const raw = buildRawMessage(input);
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  const data = (await response.json()) as { id?: string; error?: { message?: string } };
  if (!response.ok || !data.id) {
    throw new Error(data.error?.message || "Gmail rejected the reminder");
  }
  return data.id;
}

function buildRawMessage(input: {
  fromEmail: string;
  fromName: string;
  to: string;
  content: ReminderEmailContent;
}) {
  const boundary = `due-nudge-${Date.now()}`;
  const from = `${input.fromName.replace(/"/g, "")} <${input.fromEmail}>`;
  const message = [
    `From: ${from}`,
    `To: ${input.to}`,
    `Subject: ${input.content.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    input.content.text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    input.content.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(message).toString("base64url");
}
