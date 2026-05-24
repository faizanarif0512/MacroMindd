import { NextResponse } from "next/server";
import { demoProfile } from "@/lib/demo-data";
import { getOrCreateRequestUser } from "@/lib/backend";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  const { user, mode } = await getOrCreateRequestUser();
  return NextResponse.json({ profile: user ?? demoProfile, mode });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ profile: parsed.data, mode }, { status: 201 });
  }

  const profile = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data
  });

  return NextResponse.json({ profile, mode: "database" }, { status: 201 });
}
