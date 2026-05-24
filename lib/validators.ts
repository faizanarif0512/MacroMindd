import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.coerce.number().int().min(13).max(100),
  gender: z.enum(["FEMALE", "MALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]),
  height: z.coerce.number().min(90).max(250),
  weight: z.coerce.number().min(25).max(300),
  goal: z.enum(["FAT_LOSS", "MUSCLE_GAIN", "MAINTENANCE"]),
  activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "ATHLETE"]),
  targetCalories: z.coerce.number().int().min(900).max(6000),
  targetProtein: z.coerce.number().int().min(20).max(400)
});

export const foodLogSchema = z.object({
  foodId: z.string().optional(),
  foodName: z.string().min(1),
  quantity: z.coerce.number().min(1).max(5000),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACKS"]),
  timestamp: z.coerce.date().optional(),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
  fiber: z.coerce.number().min(0)
});

export const foodLogUpdateSchema = foodLogSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const naturalLanguageSchema = z.object({
  text: z.string().min(2).max(300),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACKS"]).default("SNACKS")
});

export const customFoodSchema = z.object({
  name: z.string().min(1),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
  fiber: z.coerce.number().min(0),
  servingSize: z.coerce.number().min(1).max(5000).default(100)
});

export const customFoodUpdateSchema = customFoodSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const weightSchema = z.object({
  weight: z.coerce.number().min(25).max(300),
  date: z.coerce.date().optional()
});

export const weightUpdateSchema = weightSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});
