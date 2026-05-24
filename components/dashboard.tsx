"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Droplets, FileDown, Plus, Repeat, Scale, Trophy, Utensils, Settings, Sparkles } from "lucide-react";
import { AddFoodPanel } from "@/components/add-food-panel";
import { ProfileSettingsPanel } from "@/components/profile-settings-panel";
import { MacroRing } from "@/components/macro-ring";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { demoLogs, demoProfile, weeklyCalories } from "@/lib/demo-data";
import type { AiInsight, MealType, NutritionEntry, UserProfile } from "@/lib/types";

const pieColors = ["#111827", "#6b7280", "#9ca3af"];
const mealLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACKS: "Snacks"
};

const fallbackInsight: AiInsight = {
  score: 82,
  summary: "You are tracking consistently today. Protein is a little behind pace, while calories are still comfortably within target.",
  suggestions: [
    "Add 150g chicken breast, tofu, or paneer to close the protein gap.",
    "Keep dinner lighter on added oils since lunch already carried most of today's fats.",
    "Add fruit or salad to lift fiber closer to the 25g daily baseline."
  ]
};

function totalLogs(logs: NutritionEntry[]) {
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

export function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<NutritionEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile>(demoProfile);
  const [trend, setTrend] = useState<{ date?: string; day?: string; calories: number; protein: number }[]>([]);
  const [healthScore, setHealthScore] = useState(82);
  const [aiInsight, setAiInsight] = useState<AiInsight>(fallbackInsight);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [waterCups, setWaterCups] = useState(0);
  const [streak, setStreak] = useState(0);

  const handleUpdateWater = (amount: number) => {
    setWaterCups((current) => {
      const next = Math.max(0, current + amount);
      localStorage.setItem("macromind_water_cups", String(next));
      localStorage.setItem("macromind_cached_water", String(next));
      return next;
    });
  };

  async function handleSendChat(event: React.FormEvent) {
    event.preventDefault();
    if (!chatQuery.trim() || chatLoading) return;

    const userMessage = { role: "user" as const, content: chatQuery.trim() };
    setChatHistory((current) => [...current, userMessage]);
    setChatQuery("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content })
      });
      if (!response.ok) throw new Error("Failed to chat");
      const data = (await response.json()) as { answer: string };
      setChatHistory((current) => [...current, { role: "assistant" as const, content: data.answer }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory((current) => [
        ...current,
        {
          role: "assistant" as const,
          content: "Sorry, I had trouble connecting to the recipe engine. Please try again in a moment!"
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    try {
      const savedProfile = localStorage.getItem("macromind_cached_profile") || localStorage.getItem("macromind_guest_profile");
      const savedLogs = localStorage.getItem("macromind_cached_logs") || localStorage.getItem("macromind_guest_logs");
      const savedTrend = localStorage.getItem("macromind_cached_trend");
      const savedHealth = localStorage.getItem("macromind_cached_health");
      const savedStreak = localStorage.getItem("macromind_cached_streak");
      const savedWater = localStorage.getItem("macromind_cached_water");
      
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      if (savedTrend) setTrend(JSON.parse(savedTrend));
      if (savedHealth) setHealthScore(JSON.parse(savedHealth));
      if (savedStreak) setStreak(Number(savedStreak));
      if (savedWater) setWaterCups(Number(savedWater));
    } catch (e) {
      console.warn("Failed to load cached states:", e);
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const savedWaterDate = localStorage.getItem("macromind_water_date");
    const savedWaterCups = localStorage.getItem("macromind_water_cups");
    if (savedWaterDate === todayStr && savedWaterCups) {
      setWaterCups(Number(savedWaterCups));
    } else {
      setWaterCups(0);
      localStorage.setItem("macromind_water_date", todayStr);
      localStorage.setItem("macromind_water_cups", "0");
      localStorage.setItem("macromind_cached_water", "0");
    }
  }, []);

  const stats = [
    { Icon: Droplets, label: "Water", value: "5 cups" },
    { Icon: Scale, label: "Weight", value: `${profile.weight ?? 76} kg` },
    { Icon: Trophy, label: "Streak", value: "12 days" }
  ];

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          mode: "database" | "demo";
          profile?: UserProfile;
          logs?: NutritionEntry[];
          weeklyCalories?: typeof weeklyCalories;
          healthScore?: number;
          streak?: number;
        };
        if (!active) return;
        
        if (data.mode === "database") {
          setProfile(data.profile ?? demoProfile);
          setLogs(data.logs ?? []);
          localStorage.setItem("macromind_cached_profile", JSON.stringify(data.profile ?? demoProfile));
          localStorage.setItem("macromind_cached_logs", JSON.stringify(data.logs ?? []));
        } else {
          const savedProfile = localStorage.getItem("macromind_guest_profile");
          const savedLogs = localStorage.getItem("macromind_guest_logs");
          const activeProfile = savedProfile ? JSON.parse(savedProfile) : demoProfile;
          const activeLogs = savedLogs ? JSON.parse(savedLogs) : [];
          setProfile(activeProfile);
          setLogs(activeLogs);
          localStorage.setItem("macromind_cached_profile", JSON.stringify(activeProfile));
          localStorage.setItem("macromind_cached_logs", JSON.stringify(activeLogs));
        }
        
        setTrend(data.weeklyCalories ?? []);
        setHealthScore(data.healthScore ?? 82);
        setStreak(data.streak ?? 0);
        localStorage.setItem("macromind_cached_trend", JSON.stringify(data.weeklyCalories ?? []));
        localStorage.setItem("macromind_cached_health", JSON.stringify(data.healthScore ?? 82));
        localStorage.setItem("macromind_cached_streak", String(data.streak ?? 0));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (isLoaded) {
      loadDashboard();
    }

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInsights() {
      try {
        const response = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logs, profile }),
          signal: controller.signal
        });
        if (!response.ok) return;
        const data = (await response.json()) as AiInsight;
        if (data.summary && data.suggestions?.length) {
          setAiInsight(data);
        }
      } catch {
        // Keep the last useful insight if OpenAI or the network is unavailable.
      }
    }

    loadInsights();

    return () => controller.abort();
  }, [logs, profile]);

  const totals = useMemo(() => totalLogs(logs), [logs]);

  const mealBreakdown = useMemo(
    () =>
      (Object.keys(mealLabels) as MealType[]).map((meal) => ({
        meal,
        calories: logs.filter((item) => item.mealType === meal).reduce((sum, item) => sum + item.calories, 0),
        items: logs.filter((item) => item.mealType === meal)
      })),
    [logs]
  );

  const macroData = [
    { name: "Protein", value: Math.round(totals.protein * 4) },
    { name: "Carbs", value: Math.round(totals.carbs * 4) },
    { name: "Fats", value: Math.round(totals.fats * 9) }
  ];

  const caloriePercent = Math.round((totals.calories / profile.targetCalories) * 100);
  const proteinPercent = Math.round((totals.protein / profile.targetProtein) * 100);

  async function addLog(entry: NutritionEntry) {
    const optimisticId = entry.id ?? crypto.randomUUID();
    const optimisticEntry = { ...entry, id: optimisticId };
    
    setLogs((current) => {
      const next = [optimisticEntry, ...current];
      localStorage.setItem("macromind_cached_logs", JSON.stringify(next));
      if (!isSignedIn) {
        localStorage.setItem("macromind_guest_logs", JSON.stringify(next));
      }
      return next;
    });

    startSaving(async () => {
      try {
        const response = await fetch("/api/food-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            foodId: entry.foodId,
            foodName: entry.name,
            quantity: entry.quantity,
            mealType: entry.mealType,
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fats: entry.fats,
            fiber: entry.fiber
          })
        });
        if (!response.ok) return;
        const data = (await response.json()) as { log: NutritionEntry };
        setLogs((current) => {
          const next = current.map((item) => (item.id === optimisticId ? data.log : item));
          localStorage.setItem("macromind_cached_logs", JSON.stringify(next));
          if (!isSignedIn) {
            localStorage.setItem("macromind_guest_logs", JSON.stringify(next));
          }
          return next;
        });
      } catch {
        // Offline-style fallback: keep the optimistic row visible.
      }
    });
  }

  function removeLog(id?: string) {
    if (!id) return;
    setLogs((current) => {
      const next = current.filter((log) => log.id !== id);
      localStorage.setItem("macromind_cached_logs", JSON.stringify(next));
      if (!isSignedIn) {
        localStorage.setItem("macromind_guest_logs", JSON.stringify(next));
      }
      return next;
    });

    startSaving(async () => {
      await fetch(`/api/food-logs/${id}`, { method: "DELETE" }).catch(() => undefined);
    });
  }

  const getCellClass = (calories: number, protein: number) => {
    if (calories === 0) return "bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 border border-border/10";
    const target = profile.targetCalories || 2000;
    const ratio = calories / target;
    
    if (ratio < 0.5) return "bg-emerald-500/20 dark:bg-emerald-500/10 hover:ring-1 hover:ring-emerald-500/30";
    if (ratio < 0.85) return "bg-emerald-500/45 dark:bg-emerald-500/25 hover:ring-1 hover:ring-emerald-500/50";
    if (ratio <= 1.15) return "bg-emerald-500 dark:bg-emerald-400 hover:ring-2 hover:ring-emerald-600";
    return "bg-emerald-700 dark:bg-emerald-600 hover:ring-2 hover:ring-emerald-800";
  };

  const getCellTitle = (dateStr: string, calories: number, protein: number) => {
    try {
      const dateFormatted = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateStr));
      if (calories === 0) return `${dateFormatted}: No tracking data`;
      return `${dateFormatted}: ${calories} kcal logged, ${protein}g protein (Goal: ${profile.targetCalories} kcal, ${profile.targetProtein}g)`;
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Utensils className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold">MacroMind</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date())}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-4xl">Good evening, {profile.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" className="hidden sm:inline-flex">
              <FileDown className="h-4 w-4" />
              Export
            </Button>
          </div>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <CardTitle>Calories</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="mx-auto h-44 w-44 rounded-full" />
                ) : (
                  <MacroRing value={caloriePercent} label={`${Math.round(totals.calories)}`} sublabel={`of ${profile.targetCalories} kcal`} />
                )}
                <Progress value={caloriePercent} />
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-muted-foreground">Remaining</div>
                    <div className="font-semibold">{Math.max(profile.targetCalories - Math.round(totals.calories), 0)} kcal</div>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-muted-foreground">Health score</div>
                    <div className="font-semibold">{healthScore} / 100</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Macros</CardTitle>
                  <p className="text-sm text-muted-foreground">Goal based split for {profile.goal.toLowerCase().replace("_", " ")}</p>
                </div>
                <Badge>{proteinPercent}% protein</Badge>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-[180px_1fr]">
                <div className="h-44">
                  {!mounted ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                      <PieChart>
                        <Pie data={macroData} dataKey="value" innerRadius={50} outerRadius={78} paddingAngle={4}>
                          {macroData.map((entry, index) => (
                            <Cell key={entry.name} fill={pieColors[index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="space-y-4">
                  {[
                    ["Protein", totals.protein, profile.targetProtein, "g"],
                    ["Carbs", totals.carbs, 280, "g"],
                    ["Fats", totals.fats, 75, "g"],
                    ["Fiber", totals.fiber, 30, "g"]
                  ].map(([label, value, target, suffix]) => (
                    <div key={label as string}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="text-muted-foreground">
                          {Math.round(value as number)}
                          {suffix} / {target}
                          {suffix}
                        </span>
                      </div>
                      <Progress value={((value as number) / (target as number)) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <Card>
            <CardHeader>
              <CardTitle>AI coach</CardTitle>
              <p className="text-sm text-muted-foreground">Practical suggestions and interactive recipe assistance.</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex flex-col justify-between h-[420px]">
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 flex-1">
                <div className="rounded-xl bg-muted p-4">{aiInsight.summary}</div>
                {aiInsight.suggestions.map((suggestion) => (
                  <div key={suggestion} className="rounded-xl bg-muted p-4">
                    {suggestion}
                  </div>
                ))}
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-xl p-3 text-xs ${
                      msg.role === "user" ? "bg-primary/10 text-primary ml-6" : "bg-muted border border-border/50"
                    }`}
                  >
                    <div className="font-semibold mb-1 text-[10px] uppercase opacity-70">
                      {msg.role === "user" ? "You" : "AI Coach"}
                    </div>
                    <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="rounded-xl bg-muted p-3 text-xs animate-pulse text-muted-foreground">
                    AI Coach is cooking up an answer...
                  </div>
                )}
              </div>

              {/* Dynamic Ask AI Chat Bar */}
              <div className="pt-3 border-t">
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <Input
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    placeholder="Ask recipes, swaps, or calorie tips..."
                    className="h-9 text-xs flex-1 bg-background"
                    disabled={chatLoading}
                  />
                  <Button type="submit" size="sm" className="h-9 px-3" disabled={chatLoading}>
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Ask
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Meal log</CardTitle>
                <p className="text-sm text-muted-foreground">{isSaving ? "Saving changes..." : "Fast logging, grouped by meal."}</p>
              </div>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {mealBreakdown.map((meal) => (
                <div key={meal.meal} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{mealLabels[meal.meal]}</h3>
                    <span className="text-sm text-muted-foreground">{Math.round(meal.calories)} kcal</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {meal.items.length ? (
                      meal.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.quantity}g &middot; {Math.round(item.protein)}g protein
                            </div>
                          </div>
                          <button
                            aria-label="Delete food"
                            onClick={() => removeLog(item.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">No foods logged yet.</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Consistency Heatmap</CardTitle>
                <p className="text-xs text-muted-foreground">Daily calorie and protein goal tracking history.</p>
              </CardHeader>
              <CardContent className="pt-2">
                {!mounted || trend.length === 0 ? (
                  <Skeleton className="h-[120px] w-full rounded-xl" />
                ) : (
                  <div>
                    <div className="flex gap-2">
                      {/* Weekday Labels Column */}
                      <div className="grid grid-rows-7 text-[9px] font-medium text-muted-foreground pr-1 h-[105px] items-center">
                        <span>Mon</span>
                        <span className="opacity-0">Tue</span>
                        <span>Wed</span>
                        <span className="opacity-0">Thu</span>
                        <span>Fri</span>
                        <span className="opacity-0">Sat</span>
                        <span>Sun</span>
                      </div>
                      
                      {/* 7 rows x 10 cols grid */}
                      <div className="grid grid-flow-col grid-rows-7 gap-[3px] h-[105px] items-center">
                        {trend.slice(0, 70).map((day: { date: string; calories: number; protein: number }, idx) => (
                          <div
                            key={`${day.date || 'day'}-${idx}`}
                            className={`w-[12px] h-[12px] rounded-[2px] transition-all cursor-pointer ${getCellClass(day.calories, day.protein)}`}
                            title={getCellTitle(day.date, day.calories, day.protein)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Legend block at bottom */}
                    <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2 border-border/40">
                      <span>Active past 70 days</span>
                      <div className="flex items-center gap-1">
                        <span>Less</span>
                        <div className="h-[10px] w-[10px] rounded-[2px] bg-muted/30 dark:bg-muted/20 border border-border/10" />
                        <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-500/20 dark:bg-emerald-500/10" />
                        <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-500/45 dark:bg-emerald-500/25" />
                        <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-500 dark:bg-emerald-400" />
                        <div className="h-[10px] w-[10px] rounded-[2px] bg-emerald-700 dark:bg-emerald-600" />
                        <span>More</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="grid grid-cols-3 gap-3">
              {/* Water Tracking Card */}
              <Card className="p-4 flex flex-col justify-between select-none">
                <div>
                  <Droplets className="mb-3 h-4 w-4 text-blue-500 animate-pulse" />
                  <div className="text-xs text-muted-foreground">Water</div>
                  <div className="mt-1 text-sm font-semibold">{waterCups} cups</div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button 
                    onClick={() => handleUpdateWater(-1)} 
                    className="h-5 w-5 rounded bg-muted hover:bg-muted/80 text-[10px] font-bold flex items-center justify-center transition-all active:scale-95 border border-border/10"
                    aria-label="Remove water cup"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => handleUpdateWater(1)} 
                    className="h-5 w-5 rounded bg-primary text-primary-foreground hover:bg-primary/95 text-[10px] font-bold flex items-center justify-center transition-all active:scale-95"
                    aria-label="Add water cup"
                  >
                    +
                  </button>
                </div>
              </Card>

              {/* Weight Card */}
              <Card className="p-4 flex flex-col justify-between">
                <div>
                  <Scale className="mb-3 h-4 w-4 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Weight</div>
                  <div className="mt-1 text-sm font-semibold">{profile.weight ?? 76} kg</div>
                </div>
              </Card>

              {/* Streak Card */}
              <Card className="p-4 flex flex-col justify-between">
                <div>
                  <Trophy className={`mb-3 h-4 w-4 transition-all duration-300 ${streak > 0 ? "text-yellow-500 animate-bounce" : "text-muted-foreground"}`} />
                  <div className="text-xs text-muted-foreground">Streak</div>
                  <div className="mt-1 text-sm font-semibold">{streak} {streak === 1 ? "day" : "days"}</div>
                </div>
              </Card>
            </div>
            <Button variant="secondary" className="w-full">
              <Repeat className="h-4 w-4" />
              Duplicate yesterday&apos;s meals
            </Button>
          </div>
        </div>
      </div>

      <Button
        onClick={() => setIsAdding(true)}
        size="icon"
        className="fixed bottom-5 right-5 h-14 w-14 rounded-full shadow-soft sm:hidden"
        aria-label="Add food"
      >
        <Plus className="h-5 w-5" />
      </Button>
      <AddFoodPanel open={isAdding} onClose={() => setIsAdding(false)} onAdd={addLog} />
      <ProfileSettingsPanel
        open={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        profile={profile}
        onSave={(updated) => {
          setProfile(updated);
          localStorage.setItem("macromind_cached_profile", JSON.stringify(updated));
          if (!isSignedIn) {
            localStorage.setItem("macromind_guest_profile", JSON.stringify(updated));
          }
        }}
      />
    </main>
  );
}
