import type { NutritionEntry } from "@/lib/types";

export const demoProfile = {
  id: "demo-user",
  name: "Faizan",
  email: "demo@macromind.app",
  age: 29,
  gender: "MALE",
  height: 175,
  weight: 76,
  goal: "MUSCLE_GAIN",
  activityLevel: "MODERATE",
  targetCalories: 2450,
  targetProtein: 145
} as const;

export const indianFoods = [
  { id: "paneer", name: "Paneer", source: "Indian foods", quantity: 100, servingSize: 100, mealType: "LUNCH", calories: 265, protein: 18.3, carbs: 1.2, fats: 20.8, fiber: 0 },
  { id: "roti", name: "Whole wheat roti", source: "Indian foods", quantity: 40, servingSize: 40, mealType: "LUNCH", calories: 120, protein: 3.6, carbs: 22, fats: 2.2, fiber: 3.2 },
  { id: "dal", name: "Dal tadka", source: "Indian foods", quantity: 180, servingSize: 180, mealType: "DINNER", calories: 210, protein: 11, carbs: 28, fats: 6, fiber: 7 },
  { id: "rice", name: "Steamed basmati rice", source: "Indian foods", quantity: 150, servingSize: 150, mealType: "LUNCH", calories: 195, protein: 4, carbs: 42, fats: 0.5, fiber: 1 },
  { id: "chicken-curry", name: "Chicken curry", source: "Indian foods", quantity: 200, servingSize: 200, mealType: "DINNER", calories: 360, protein: 34, carbs: 10, fats: 19, fiber: 2 },
  { id: "eggs", name: "Boiled eggs", source: "USDA style", quantity: 100, servingSize: 100, mealType: "BREAKFAST", calories: 155, protein: 12.6, carbs: 1.1, fats: 10.6, fiber: 0 },
  { id: "greek-yogurt", name: "Greek yogurt", source: "Packaged", quantity: 170, servingSize: 170, mealType: "SNACKS", calories: 100, protein: 17, carbs: 6, fats: 0.7, fiber: 0 },
  { id: "subway-salad", name: "Restaurant grilled chicken salad", source: "Restaurant", quantity: 320, servingSize: 320, mealType: "LUNCH", calories: 290, protein: 28, carbs: 18, fats: 11, fiber: 6 },
  { id: "soybean-boiled", name: "Boiled soybeans", aliases: ["soyabean", "soybean", "soya bean", "edamame"], source: "Indian foods", quantity: 100, servingSize: 100, mealType: "LUNCH", calories: 173, protein: 16.6, carbs: 9.9, fats: 9, fiber: 6 },
  { id: "soya-chunks", name: "Soya chunks cooked", aliases: ["soy chunks", "soyabean chunks", "soya nuggets", "nutrela"], source: "Indian foods", quantity: 100, servingSize: 100, mealType: "LUNCH", calories: 156, protein: 15.6, carbs: 14.7, fats: 0.6, fiber: 5.2 },
  { id: "tofu", name: "Tofu", aliases: ["soy paneer", "bean curd"], source: "USDA style", quantity: 100, servingSize: 100, mealType: "LUNCH", calories: 144, protein: 17.3, carbs: 2.8, fats: 8.7, fiber: 2.3 },
  { id: "rajma", name: "Rajma curry", aliases: ["kidney beans", "rajma chawal"], source: "Indian foods", quantity: 180, servingSize: 180, mealType: "LUNCH", calories: 245, protein: 12, carbs: 38, fats: 5, fiber: 10 },
  { id: "chole", name: "Chole", aliases: ["chickpeas", "chana masala", "kabuli chana"], source: "Indian foods", quantity: 180, servingSize: 180, mealType: "LUNCH", calories: 286, protein: 14, carbs: 42, fats: 8, fiber: 11 },
  { id: "sprouts", name: "Moong sprouts", aliases: ["green gram sprouts", "sprouted moong"], source: "Indian foods", quantity: 100, servingSize: 100, mealType: "SNACKS", calories: 105, protein: 8, carbs: 19, fats: 0.4, fiber: 7 },
  { id: "oats", name: "Rolled oats", aliases: ["oatmeal", "masala oats"], source: "Packaged", quantity: 40, servingSize: 40, mealType: "BREAKFAST", calories: 152, protein: 5.2, carbs: 26.5, fats: 2.8, fiber: 4.2 },
  { id: "banana", name: "Banana", aliases: ["kela"], source: "USDA style", quantity: 120, servingSize: 120, mealType: "SNACKS", calories: 105, protein: 1.3, carbs: 27, fats: 0.4, fiber: 3.1 },
  { id: "whey", name: "Whey protein", aliases: ["protein powder", "whey scoop"], source: "Packaged", quantity: 30, servingSize: 30, mealType: "SNACKS", calories: 120, protein: 24, carbs: 3, fats: 1.5, fiber: 0 }
] satisfies NutritionEntry[];

export const demoLogs: NutritionEntry[] = [
  { ...indianFoods[5], id: "log-1", quantity: 100, mealType: "BREAKFAST" },
  { ...indianFoods[1], id: "log-2", quantity: 80, mealType: "BREAKFAST", calories: 240, protein: 7.2, carbs: 44, fats: 4.4, fiber: 6.4 },
  { ...indianFoods[0], id: "log-3", quantity: 150, mealType: "LUNCH", calories: 398, protein: 27.5, carbs: 1.8, fats: 31.2, fiber: 0 },
  { ...indianFoods[2], id: "log-4", quantity: 180, mealType: "DINNER" },
  { ...indianFoods[3], id: "log-5", quantity: 150, mealType: "DINNER" }
];

export const weeklyCalories = [
  { day: "Mon", calories: 2180, protein: 126 },
  { day: "Tue", calories: 2310, protein: 138 },
  { day: "Wed", calories: 2060, protein: 118 },
  { day: "Thu", calories: 2440, protein: 147 },
  { day: "Fri", calories: 2380, protein: 140 },
  { day: "Sat", calories: 2520, protein: 151 },
  { day: "Sun", calories: 1198, protein: 74 }
];
