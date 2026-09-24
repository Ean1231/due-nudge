import { createHmac, timingSafeEqual } from "crypto";

const GMAIL_SCOPE = "openid email https://www.googleapis.com/auth/gmail.send";

export function isGmailConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function gmailRedirectUri() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/api/gmail/callback`;
}

export function gmailConnectUrl(state: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", gmailRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export function signGmailState(userId: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function readGmailState(state: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const decoded = Buffer.from(state, "base64url").toString("utf8");
  const [userId, exp, sig] = decoded.split(".");
  if (!userId || !exp || !sig) return null;
  const payload = `${userId}.${exp}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  if (Number(exp) < Date.now()) return null;
  return userId;
}

export async function exchangeGmailCode(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: gmailRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !data.access_token || !data.refresh_token) {
    throw new Error(data.error_description || data.error || "Google did not return a refresh token");
  }
  const email = await gmailAddress(data.access_token);
  return { refreshToken: data.refresh_token, email };
}

export async function gmailAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Could not refresh Gmail access");
  }
  return data.access_token;
}

async function gmailAddress(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json()) as { email?: string };
  if (!response.ok || !data.email) throw new Error("Could not read the connected Gmail address");
  return data.email;
}
