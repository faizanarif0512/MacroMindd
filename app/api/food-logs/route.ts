import { NextResponse } from "next/server";
import { demoLogs } from "@/lib/demo-data";
import { getOrCreateRequestUser, toNutritionEntry } from "@/lib/backend";
import { prisma } from "@/lib/prisma";
import { foodLogSchema } from "@/lib/validators";

export async function GET() {
  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    return NextResponse.json({ logs: [], mode });
  }

  const logs = await prisma.foodLog.findMany({
    where: { userId: user.id },
    orderBy: { timestamp: "desc" },
    take: 100
  });

  return NextResponse.json({ logs: logs.map(toNutritionEntry), mode: "database" });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = foodLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    const log = {
      id: crypto.randomUUID(),
      name: parsed.data.foodName,
      source: "demo",
      servingSize: parsed.data.quantity,
      ...parsed.data
    };
    return NextResponse.json({ log, mode }, { status: 201 });
  }

  const food = parsed.data.foodId
    ? await prisma.food.findUnique({
        where: { id: parsed.data.foodId }
      })
    : null;

  const log = await prisma.foodLog.create({
    data: {
      userId: user.id,
      foodId: food?.id,
      foodName: parsed.data.foodName,
      quantity: parsed.data.quantity,
      mealType: parsed.data.mealType,
      timestamp: parsed.data.timestamp,
      calories: parsed.data.calories,
      protein: parsed.data.protein,
      carbs: parsed.data.carbs,
      fats: parsed.data.fats,
      fiber: parsed.data.fiber
    }
  });

  return NextResponse.json({ log: toNutritionEntry(log), mode: "database" }, { status: 201 });
}
