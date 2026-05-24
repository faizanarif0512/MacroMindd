import { NextResponse } from "next/server";
import { getOrCreateRequestUser, toNutritionEntry } from "@/lib/backend";
import { prisma } from "@/lib/prisma";
import { foodLogUpdateSchema } from "@/lib/validators";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = foodLogUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ log: { id, ...parsed.data }, mode });
  }

  const existing = await prisma.foodLog.findFirst({
    where: { id, userId: user.id }
  });

  if (!existing) {
    return NextResponse.json({ error: "Food log not found" }, { status: 404 });
  }

  const food = parsed.data.foodId
    ? await prisma.food.findUnique({
        where: { id: parsed.data.foodId }
      })
    : null;

  const data = {
    ...parsed.data,
    foodId: parsed.data.foodId ? food?.id : undefined
  };

  const log = await prisma.foodLog.update({
    where: { id },
    data
  });

  return NextResponse.json({ log: toNutritionEntry(log), mode: "database" });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ deleted: true, id, mode });
  }

  const existing = await prisma.foodLog.findFirst({
    where: { id, userId: user.id }
  });

  if (!existing) {
    return NextResponse.json({ error: "Food log not found" }, { status: 404 });
  }

  await prisma.foodLog.delete({ where: { id } });
  return NextResponse.json({ deleted: true, id, mode: "database" });
}
