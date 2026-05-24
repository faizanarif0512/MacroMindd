export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";

export type Goal = "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE";

export type NutritionEntry = {
  id?: string;
  foodId?: string;
  name: string;
  brand?: string;
  source?: string;
  aliases?: string[];
  quantity: number;
  servingSize: number;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
};

export type UserProfile = {
  id?: string;
  name: string;
  email: string;
  age?: number | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  goal: Goal;
  activityLevel: string;
  targetCalories: number;
  targetProtein: number;
};

export type AiInsight = {
  score: number;
  summary: string;
  suggestions: string[];
};

export type DashboardSummary = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  targetCalories: number;
  targetProtein: number;
  waterCups: number;
  healthScore: number;
  consistencyScore: number;
};
