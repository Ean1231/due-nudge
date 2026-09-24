import { decryptGmailToken } from "@/lib/gmail/token";
import { gmailAccessToken } from "@/lib/gmail/oauth";
import type { ReminderEmailContent } from "@/lib/email/types";

export class GmailDeliveryUnknownError extends Error {
  constructor() {
    super("Gmail delivery status is unknown. Check Sent Mail before trying again.");
    this.name = "GmailDeliveryUnknownError";
  }
}

export async function sendViaGmail(input: {
  refreshToken: string;
  fromEmail: string;
  fromName: string;
  to: string;
  content: ReminderEmailContent;
  attachments?: Array<{ filename: string; contentType: string; data: Buffer }>;
}) {
  const accessToken = await gmailAccessToken(decryptGmailToken(input.refreshToken));
  const raw = buildRawMessage(input);
  let response: Response;
  try {
    response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
  } catch {
    throw new GmailDeliveryUnknownError();
  }
  const data = (await response.json()) as { id?: string; error?: { message?: string } };
  if (!response.ok || !data.id) {
    if (response.status >= 500) throw new GmailDeliveryUnknownError();
    const message = data.error?.message || "Gmail rejected the reminder";
    if (message.toLowerCase().includes("insufficient authentication scopes")) {
      throw new Error("Gmail send permission is missing. Disconnect Gmail, then connect it again and approve email sending.");
    }
    throw new Error(message);
  }
  return data.id;
}

function buildRawMessage(input: {
  fromEmail: string;
  fromName: string;
  to: string;
  content: ReminderEmailContent;
  attachments?: Array<{ filename: string; contentType: string; data: Buffer }>;
}) {
  const hasAttachments = Boolean(input.attachments?.length);
  const mixedBoundary = `due-nudge-mixed-${Date.now()}`;
  const alternativeBoundary = `due-nudge-alternative-${Date.now()}`;
  const from = `${encodeHeader(input.fromName)} <${input.fromEmail}>`;
  const headers = [
    `From: ${from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeader(input.content.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${hasAttachments ? `multipart/mixed; boundary="${mixedBoundary}"` : `multipart/alternative; boundary="${alternativeBoundary}"`}`,
    "",
  ];
  const alternative = [
    ...(hasAttachments
      ? [`--${mixedBoundary}`, `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`, ""]
      : []),
    `--${alternativeBoundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.content.text,
    `--${alternativeBoundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.content.html,
    `--${alternativeBoundary}--`,
    "",
  ];
  const attachments = hasAttachments
    ? [
        ...input.attachments!.flatMap((attachment) => [
        `--${mixedBoundary}`,
        `Content-Type: ${attachment.contentType}; name="${safeHeaderFilename(attachment.filename)}"`,
        `Content-Disposition: attachment; filename="${safeHeaderFilename(attachment.filename)}"`,
        "Content-Transfer-Encoding: base64",
        "",
        wrapBase64(attachment.data.toString("base64")),
        ]),
        `--${mixedBoundary}--`,
        "",
      ]
    : [];
  const message = [...headers, ...alternative, ...attachments].join("\r\n");
  return Buffer.from(message).toString("base64url");
}

function safeHeaderFilename(filename: string) {
  return filename.replace(/[\r\n"]/g, "").slice(0, 120);
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value.replace(/[\r\n]/g, " ")).toString("base64")}?=`;
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") || value;
}
