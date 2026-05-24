import { indianFoods } from "@/lib/demo-data";
import type { NutritionEntry } from "@/lib/types";

type UsdaFood = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  foodNutrients?: { nutrientName: string; value: number; unitName: string }[];
};

function nutrient(food: UsdaFood, label: string) {
  return food.foodNutrients?.find((item) => item.nutrientName.toLowerCase().includes(label))?.value ?? 0;
}

function normalizeUsda(food: UsdaFood): NutritionEntry {
  return {
    id: String(food.fdcId),
    foodId: String(food.fdcId),
    name: food.description.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
    brand: food.brandOwner,
    source: "USDA FoodData Central",
    quantity: 100,
    servingSize: 100,
    mealType: "SNACKS",
    calories: nutrient(food, "energy"),
    protein: nutrient(food, "protein"),
    carbs: nutrient(food, "carbohydrate"),
    fats: nutrient(food, "total lipid"),
    fiber: nutrient(food, "fiber")
  };
}

function words(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreFood(food: NutritionEntry, query: string) {
  const haystack = [food.name, ...(food.aliases ?? []), food.brand ?? "", food.source ?? ""].join(" ").toLowerCase();
  const cleanQuery = query.trim().toLowerCase();

  if (haystack.includes(cleanQuery)) return 100;

  const queryWords = words(cleanQuery);
  const matches = queryWords.filter((word) => haystack.includes(word)).length;
  return matches ? matches * 20 : 0;
}

export async function searchFoods(query: string): Promise<NutritionEntry[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const localMatches = indianFoods
    .map((food) => ({ food, score: scoreFood(food, cleanQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.food);

  if (!process.env.USDA_API_KEY || process.env.USDA_API_KEY === "DEMO_KEY") {
    return localMatches;
  }

  const params = new URLSearchParams({
    api_key: process.env.USDA_API_KEY,
    query,
    pageSize: "8"
  });

  try {
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`, {
      next: { revalidate: 60 * 60 * 24 }
    });
    if (!response.ok) throw new Error("USDA search failed");
    const data = (await response.json()) as { foods?: UsdaFood[] };
    const usda = (data.foods ?? []).map(normalizeUsda);
    return [...localMatches, ...usda].slice(0, 10);
  } catch {
    return localMatches;
  }
}
