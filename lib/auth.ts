import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserId() {
  const { userId } = await auth();

  if (!userId) {
    return "demo-user";
  }

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    return user?.id ?? "demo-user";
  } catch {
    return "demo-user";
  }
}
