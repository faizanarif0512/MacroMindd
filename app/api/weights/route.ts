import { NextResponse } from "next/server";
import { getOrCreateRequestUser } from "@/lib/backend";
import { prisma } from "@/lib/prisma";
import { weightSchema } from "@/lib/validators";

export async function GET() {
  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ weights: [], mode });
  }

  const weights = await prisma.weight.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 100
  });

  return NextResponse.json({ weights, mode: "database" });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = weightSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ weight: { id: crypto.randomUUID(), ...parsed.data }, mode }, { status: 201 });
  }

  const weight = await prisma.weight.create({
    data: {
      userId: user.id,
      weight: parsed.data.weight,
      date: parsed.data.date
    }
  });

  return NextResponse.json({ weight, mode: "database" }, { status: 201 });
}
