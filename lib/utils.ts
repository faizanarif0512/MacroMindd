import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

export function scaleNutrition<T extends { calories: number; protein: number; carbs: number; fats: number; fiber: number; servingSize: number }>(
  food: T,
  quantity: number
) {
  const factor = quantity / food.servingSize;
  return {
    calories: Math.round(food.calories * factor),
    protein: roundMacro(food.protein * factor),
    carbs: roundMacro(food.carbs * factor),
    fats: roundMacro(food.fats * factor),
    fiber: roundMacro(food.fiber * factor)
  };
}
