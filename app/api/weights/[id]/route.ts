import { NextResponse } from "next/server";
import { getOrCreateRequestUser } from "@/lib/backend";
import { prisma } from "@/lib/prisma";
import { weightUpdateSchema } from "@/lib/validators";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = weightUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ weight: { id, ...parsed.data }, mode });
  }

  const existing = await prisma.weight.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Weight entry not found" }, { status: 404 });

  const weight = await prisma.weight.update({
    where: { id },
    data: parsed.data
  });

  return NextResponse.json({ weight, mode: "database" });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ deleted: true, id, mode });
  }

  const existing = await prisma.weight.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Weight entry not found" }, { status: 404 });

  await prisma.weight.delete({ where: { id } });
  return NextResponse.json({ deleted: true, id, mode: "database" });
}
