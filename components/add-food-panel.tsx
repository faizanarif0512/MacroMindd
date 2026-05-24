"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { MealType, NutritionEntry } from "@/lib/types";
import { scaleNutrition } from "@/lib/utils";

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"];

export function AddFoodPanel({
  open,
  onClose,
  onAdd
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (entry: NutritionEntry) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [mealType, setMealType] = useState<MealType>("SNACKS");
  const [results, setResults] = useState<NutritionEntry[]>([]);
  const [naturalText, setNaturalText] = useState("");
  const [isPending, startTransition] = useTransition();

  const canSearch = query.trim().length > 1;

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/foods?q=${encodeURIComponent(query)}`);
          if (!response.ok) return;
          const data = (await response.json()) as { foods: NutritionEntry[] };
          setResults(data.foods);
        } catch (error) {
          console.error("Failed to fetch foods:", error);
        }
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [canSearch, query]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function addFood(food: NutritionEntry) {
    const scaled = scaleNutrition(food, quantity);
    await onAdd({ ...food, ...scaled, quantity, mealType, id: crypto.randomUUID() });
    onClose();
  }

  function parseNatural(event: FormEvent) {
    event.preventDefault();
    if (!naturalText.trim()) return;
    startTransition(async () => {
      const response = await fetch("/api/ai/parse-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: naturalText, mealType })
      });
      const data = (await response.json()) as { items: NutritionEntry[] };
      await Promise.all(data.items.map((item) => onAdd({ ...item, id: crypto.randomUUID() })));
      setNaturalText("");
      onClose();
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/20 p-3 backdrop-blur-sm sm:flex sm:items-end sm:justify-center">
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto mt-14 w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-soft"
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Add food</h2>
            <p className="text-sm text-muted-foreground">Search, scan later, or type naturally.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close add food">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_180px]">
          <div className="space-y-4">
            <form onSubmit={parseNatural} className="flex gap-2">
              <Input
                value={naturalText}
                onChange={(event) => setNaturalText(event.target.value)}
                placeholder="2 eggs and 3 rotis"
              />
              <Button type="submit" size="icon" aria-label="Parse natural language">
                <Sparkles className="h-4 w-4" />
              </Button>
            </form>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search foods" className="pl-9" />
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {(results.length ? results : []).map((food) => (
                <button
                  key={`${food.source}-${food.id}-${food.name}`}
                  onClick={() => addFood(food)}
                  className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">{food.name}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{food.servingSize}g serving</span>
                      <span>&middot;</span>
                      <span>{food.calories} kcal</span>
                      <span>&middot;</span>
                      <span>{food.protein}g protein</span>
                      <span>&middot;</span>
                      <span>{food.source}</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4" />
                </button>
              ))}
              {isPending ? <Card className="p-4 text-sm text-muted-foreground">Finding the closest match...</Card> : null}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Quantity (grams)</label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-3 text-xs text-muted-foreground font-semibold">g</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mealTypes.map((meal) => (
                <button
                  key={meal}
                  onClick={() => setMealType(meal)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium ${mealType === meal ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  {meal.toLowerCase()}
                </button>
              ))}
            </div>
            <Badge>Barcode, voice, and image scanning-ready</Badge>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
