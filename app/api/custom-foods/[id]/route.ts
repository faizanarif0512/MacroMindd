import { NextResponse } from "next/server";
import { getOrCreateRequestUser } from "@/lib/backend";
import { prisma } from "@/lib/prisma";
import { customFoodUpdateSchema } from "@/lib/validators";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = customFoodUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ customFood: { id, ...parsed.data }, mode });
  }

  const existing = await prisma.customFood.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Custom food not found" }, { status: 404 });

  const customFood = await prisma.customFood.update({
    where: { id },
    data: parsed.data
  });

  return NextResponse.json({ customFood, mode: "database" });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ deleted: true, id, mode });
  }

  const existing = await prisma.customFood.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Custom food not found" }, { status: 404 });

  await prisma.customFood.delete({ where: { id } });
  return NextResponse.json({ deleted: true, id, mode: "database" });
}
