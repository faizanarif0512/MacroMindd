import { NextResponse } from "next/server";
import { getOrCreateRequestUser, toNutritionEntry, startOfDay, endOfDay } from "@/lib/backend";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const { user } = await getOrCreateRequestUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startYesterday = startOfDay(yesterday);
    const endYesterday = endOfDay(yesterday);

    // 1. Fetch yesterday's logs
    const yesterdayLogs = await prisma.foodLog.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: startYesterday,
          lte: endYesterday
        }
      }
    });

    if (yesterdayLogs.length === 0) {
      return NextResponse.json({ logs: [], message: "No meals logged yesterday." });
    }

    // 2. Duplicate to today
    const today = new Date();
    const duplicated = yesterdayLogs.map((log) => ({
      userId: user.id,
      foodId: log.foodId,
      foodName: log.foodName,
      quantity: log.quantity,
      mealType: log.mealType,
      timestamp: today,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fats: log.fats,
      fiber: log.fiber,
      notes: log.notes
    }));

    await prisma.foodLog.createMany({
      data: duplicated
    });

    // 3. Fetch today's complete logs list
    const todayLogs = await prisma.foodLog.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: startOfDay(today),
          lte: endOfDay(today)
        }
      },
      orderBy: { timestamp: "desc" }
    });

    return NextResponse.json({
      logs: todayLogs.map(toNutritionEntry),
      message: `Successfully duplicated ${yesterdayLogs.length} meals.`
    });
  } catch (error) {
    console.error("Failed to duplicate yesterday's logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
