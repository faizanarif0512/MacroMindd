import { NextResponse } from "next/server";
import { getOrCreateRequestUser } from "@/lib/backend";
import { prisma } from "@/lib/prisma";
import { customFoodSchema } from "@/lib/validators";

export async function GET() {
  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ customFoods: [], mode });
  }

  const customFoods = await prisma.customFood.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ customFoods, mode: "database" });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = customFoodSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ customFood: { id: crypto.randomUUID(), ...parsed.data }, mode }, { status: 201 });
  }

  const customFood = await prisma.customFood.create({
    data: {
      userId: user.id,
      ...parsed.data
    }
  });

  return NextResponse.json({ customFood, mode: "database" }, { status: 201 });
}
