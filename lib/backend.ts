import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { NutritionEntry } from "@/lib/types";

export function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function calculateTotals(logs: Pick<NutritionEntry, "calories" | "protein" | "carbs" | "fats" | "fiber">[]) {
  return logs.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fats: acc.fats + item.fats,
      fiber: acc.fiber + item.fiber
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  );
}

export function toNutritionEntry(log: {
  id: string;
  foodId?: string | null;
  foodName: string;
  quantity: number;
  mealType: NutritionEntry["mealType"];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}): NutritionEntry {
  return {
    id: log.id,
    foodId: log.foodId ?? undefined,
    name: log.foodName,
    quantity: log.quantity,
    servingSize: log.quantity,
    mealType: log.mealType,
    calories: log.calories,
    protein: log.protein,
    carbs: log.carbs,
    fats: log.fats,
    fiber: log.fiber,
    source: "database"
  };
}

export async function getOrCreateRequestUser() {
  try {
    const { userId } = await auth().catch(() => ({ userId: null }));
    if (!userId) {
      return { user: null, mode: "demo" as const };
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@macromind.local`;
    const name = clerkUser?.fullName ?? clerkUser?.firstName ?? "MacroMind user";

    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        email,
        name,
        age: 29,
        gender: "MALE",
        height: 175,
        weight: 76,
        goal: "MUSCLE_GAIN",
        activityLevel: "MODERATE",
        targetCalories: 2450,
        targetProtein: 145
      },
      update: { email, name }
    });

    return { user, mode: "database" as const };
  } catch (error) {
    console.error("Database user lookup failed:", error);
    return { user: null, mode: "demo" as const };
  }
}

export async function getDashboardData(date = new Date()) {
  const { user, mode } = await getOrCreateRequestUser();

  if (!user) {
    const totals = calculateTotals([]);
    return {
      mode,
      profile: null,
      logs: [],
      totals,
      weeklyCalories: [],
      waterCups: 0,
      healthScore: 100,
      consistencyScore: 100
    };
  }

  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysSinceMonday - 63); // 9 weeks * 7 = 63 days
  startDate.setHours(0, 0, 0, 0);

  const [logs, weights, pastLogs] = await Promise.all([
    prisma.foodLog.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        }
      },
      orderBy: { timestamp: "desc" }
    }),
    prisma.weight.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
      take: 14
    }),
    prisma.foodLog.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: startDate }
      },
      select: {
        calories: true,
        protein: true,
        timestamp: true
      }
    })
  ]);

  // Aggregate daily stats for the contribution grid (70 days = 10 full weeks starting on Mon)
  const dailyLogs: Record<string, { calories: number; protein: number }> = {};
  for (let i = 0; i < 70; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    dailyLogs[dateStr] = { calories: 0, protein: 0 };
  }

  pastLogs.forEach((log) => {
    const dateStr = new Date(log.timestamp).toISOString().split("T")[0];
    if (dailyLogs[dateStr] !== undefined) {
      dailyLogs[dateStr].calories += log.calories;
      dailyLogs[dateStr].protein += log.protein;
    }
  });

  const weeklyCaloriesReal = Object.entries(dailyLogs).map(([date, data]) => ({
    date,
    calories: Math.round(data.calories),
    protein: Math.round(data.protein)
  }));

  // Calculate tracking streak timezone-safe
  let streak = 0;
  const checkDate = new Date();
  const todayStr = checkDate.toISOString().split("T")[0];
  const loggedToday = dailyLogs[todayStr] && dailyLogs[todayStr].calories > 0;
  
  if (loggedToday) {
    streak = 1;
    for (let i = 1; i < 70; i++) {
      const prevDate = new Date(checkDate);
      prevDate.setDate(checkDate.getDate() - i);
      const prevStr = prevDate.toISOString().split("T")[0];
      if (dailyLogs[prevStr] && dailyLogs[prevStr].calories > 0) {
        streak++;
      } else {
        break;
      }
    }
  } else {
    const yesterdayDate = new Date(checkDate);
    yesterdayDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];
    if (dailyLogs[yesterdayStr] && dailyLogs[yesterdayStr].calories > 0) {
      streak = 1;
      for (let i = 2; i < 70; i++) {
        const prevDate = new Date(checkDate);
        prevDate.setDate(checkDate.getDate() - i);
        const prevStr = prevDate.toISOString().split("T")[0];
        if (dailyLogs[prevStr] && dailyLogs[prevStr].calories > 0) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  const entries = logs.map(toNutritionEntry);
  const totals = calculateTotals(entries);
  const proteinRatio = user.targetProtein ? totals.protein / user.targetProtein : 0;
  const calorieRatio = user.targetCalories ? totals.calories / user.targetCalories : 0;

  return {
    mode,
    profile: user,
    logs: entries,
    totals,
    weeklyCalories: weeklyCaloriesReal,
    weights,
    waterCups: 0,
    healthScore: Math.max(40, Math.min(100, Math.round(65 + proteinRatio * 20 - Math.max(calorieRatio - 1, 0) * 25))),
    consistencyScore: Math.max(30, Math.min(100, Math.round(50 + entries.length * 8))),
    streak
  };
}
