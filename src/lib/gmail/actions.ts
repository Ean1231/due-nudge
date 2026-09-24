"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";

export async function disconnectGmail() {
  const user = await getAppUser();
  if (!user) redirect("/login");
  await prisma.user.update({
    where: { id: user.id },
    data: { gmailEmail: null, gmailRefreshToken: null },
  });
  redirect("/dashboard");
}
