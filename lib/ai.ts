import OpenAI from "openai";
import { z } from "zod";
import { demoLogs, demoProfile } from "@/lib/demo-data";
import type { NutritionEntry } from "@/lib/types";

const parsedFoodSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      servingSize: z.number(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fats: z.number(),
      fiber: z.number()
    })
  )
});

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function parseNaturalFood(text: string, mealType: NutritionEntry["mealType"]) {
  const getFallback = () => {
    const fallback = demoLogs.find((item) => text.toLowerCase().includes(item.name.toLowerCase().split(" ")[0]));
    return {
      items: [
        {
          ...(fallback ?? demoLogs[0]),
          id: undefined,
          mealType,
          source: "AI estimate"
        }
      ]
    };
  };

  const openai = getOpenAI();
  if (!openai) {
    return getFallback();
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Parse food text into nutrition items. Estimate macros realistically per item. Return JSON with items: name, quantity grams, servingSize grams, calories, protein, carbs, fats, fiber."
        },
        { role: "user", content: text }
      ]
    });

    const parsed = parsedFoodSchema.parse(JSON.parse(completion.choices[0]?.message.content ?? "{\"items\":[]}"));
    return { items: parsed.items.map((item) => ({ ...item, mealType, source: "OpenAI estimate" })) };
  } catch (error) {
    console.error("OpenAI parse food error, falling back to mock:", error);
    return getFallback();
  }
}

export async function generateAiInsights(logs: NutritionEntry[] = demoLogs, profile = demoProfile) {
  const totals = logs.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fats: acc.fats + item.fats,
      fiber: acc.fiber + item.fiber
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  );

  const getFallback = () => {
    const proteinRatio = profile.targetProtein ? totals.protein / profile.targetProtein : 0;
    const calorieRatio = profile.targetCalories ? totals.calories / profile.targetCalories : 0;

    let score = 100;
    let summary = "Excellent start! Your tracking metrics are clean and balanced today.";
    const suggestions: string[] = [];

    if (logs.length === 0) {
      score = 70;
      const goalText = profile.goal ? profile.goal.toLowerCase().replace("_", " ") : "health";
      summary = `Welcome, ${profile.name}! Let's hit your daily target of ${profile.targetCalories} kcal today to support your ${goalText} goal.`;
      suggestions.push(`Aim for your personalized protein target of ${profile.targetProtein}g.`);
      suggestions.push("Add a lean protein source (like eggs, low-fat paneer, or chicken breast) to your next log.");
      suggestions.push("Drink at least 3 liters of water today to support recovery and hydration.");
    } else {
      const remainingCal = profile.targetCalories - totals.calories;
      if (remainingCal < -150) {
        score -= 15;
        summary = `You have exceeded your daily calorie target by ${Math.round(Math.abs(remainingCal))} kcal. Focus on low-fat protein for any other logs.`;
        suggestions.push("Focus on high-volume, low-calorie greens like cucumber or sautéed zucchini.");
      } else if (remainingCal > 300) {
        summary = `Looking great! You have ${Math.round(remainingCal)} kcal remaining to satisfy your daily calorie targets.`;
        suggestions.push("You have ample room for a balanced meal or nutritious post-workout snack.");
      } else {
        summary = "Spot-on! Calories are pacing perfectly with your daily targets.";
      }

      if (proteinRatio < 0.5) {
        score -= 20;
        suggestions.push(`Close the protein gap (need ${Math.round(profile.targetProtein - totals.protein)}g more) with chicken breast, paneer, or soy chunks.`);
      } else if (proteinRatio < 0.8) {
        score -= 10;
        suggestions.push("You are close to your protein target! Add a scoop of whey protein or egg whites to close it.");
      } else {
        suggestions.push("Excellent job on protein! Your muscles are well-fueled.");
      }

      if (totals.fiber < 25) {
        suggestions.push("Add fruit, rolled oats, or a leafy salad to lift fiber closer to the 25g baseline.");
      }
      
      if (totals.fats > 80) {
        score -= 5;
        suggestions.push("Fats are tracking slightly high. Try preparing your next meal with less added oils.");
      }
    }

    return {
      score: Math.max(40, score),
      summary,
      suggestions: suggestions.slice(0, 3)
    };
  };

  const openai = getOpenAI();
  if (!openai) {
    return getFallback();
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are MacroMind, a concise nutrition coach. Return JSON: score number 0-100, summary string, suggestions string[]. Be specific, practical, and goal-aware."
        },
        {
          role: "user",
          content: JSON.stringify({ profile, totals, logs })
        }
      ]
    });

    return JSON.parse(completion.choices[0]?.message.content ?? "{}");
  } catch (error) {
    console.error("OpenAI generate insights error, falling back to mock:", error);
    return getFallback();
  }
}
