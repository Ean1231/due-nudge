import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/session";
import { gmailConnectUrl, isGmailConfigured, signGmailState } from "@/lib/gmail/oauth";

export async function GET(request: Request) {
  const user = await getAppUser();
  const appUrl = new URL(request.url).origin;
  if (!user) return NextResponse.redirect(new URL("/login", appUrl));
  if (!isGmailConfigured()) return NextResponse.redirect(new URL("/dashboard?gmail=missing", appUrl));
  return NextResponse.redirect(gmailConnectUrl(signGmailState(user.id)));
}
