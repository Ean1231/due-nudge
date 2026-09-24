"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { revokeGmailToken } from "@/lib/gmail/oauth";
import { decryptGmailToken } from "@/lib/gmail/token";
import { getAppUser } from "@/lib/session";

export async function disconnectGmail() {
  const user = await getAppUser();
  if (!user) redirect("/login");
  if (user.gmailRefreshToken) {
    try {
      await revokeGmailToken(decryptGmailToken(user.gmailRefreshToken));
    } catch (err) {
      console.error("[DueNudge] Could not revoke Gmail access:", err);
    }
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { gmailEmail: null, gmailRefreshToken: null },
  });
  redirect("/dashboard");
}
