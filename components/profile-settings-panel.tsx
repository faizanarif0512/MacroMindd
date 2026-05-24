"use client";

import { FormEvent, useState, useTransition, useEffect } from "react";
import { X, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserProfile, Goal } from "@/lib/types";

const activityLevels = [
  { value: "SEDENTARY", label: "Sedentary (desk job, minimal exercise)" },
  { value: "LIGHT", label: "Lightly Active (1-3 days light exercise/week)" },
  { value: "MODERATE", label: "Moderately Active (3-5 days moderate exercise/week)" },
  { value: "ACTIVE", label: "Very Active (6-7 days heavy exercise/week)" },
  { value: "ATHLETE", label: "Athlete (daily intense training or physical job)" }
];

const goals = [
  { value: "FAT_LOSS", label: "Fat loss" },
  { value: "MUSCLE_GAIN", label: "Muscle gain" },
  { value: "MAINTENANCE", label: "Maintenance" }
];

function calculateSuggestedCalories(
  weight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: string,
  goal: string
): number {
  if (!weight || !height || !age) return 2000;

  // Mifflin-St Jeor BMR Formula
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "MALE") {
    bmr += 5;
  } else {
    bmr -= 161; // Standard female/non-binary baseline
  }

  // TDEE Activity Level Multipliers
  let multiplier = 1.2;
  switch (activityLevel) {
    case "SEDENTARY": multiplier = 1.2; break;
    case "LIGHT": multiplier = 1.375; break;
    case "MODERATE": multiplier = 1.55; break;
    case "ACTIVE": multiplier = 1.725; break;
    case "ATHLETE": multiplier = 1.9; break;
  }

  const tdee = bmr * multiplier;

  // Adjust for goal
  let suggested = tdee;
  if (goal === "FAT_LOSS") {
    suggested = tdee - 500;
  } else if (goal === "MUSCLE_GAIN") {
    suggested = tdee + 300;
  }

  return Math.max(1200, Math.round(suggested));
}

function calculateSuggestedProtein(weight: number, goal: string): number {
  if (!weight) return 120;
  // Standard grams per kg of body weight
  let multiplier = 1.6;
  if (goal === "FAT_LOSS") {
    multiplier = 2.0; // Preserves lean muscle mass during deficit
  } else if (goal === "MUSCLE_GAIN") {
    multiplier = 2.2; // Hypertrophy target
  }
  return Math.round(weight * multiplier);
}

export function ProfileSettingsPanel({
  open,
  onClose,
  profile,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updated: UserProfile) => void | Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  // On-the-fly inputs for dynamic calculations
  const [age, setAge] = useState(profile?.age ?? 29);
  const [gender, setGender] = useState(profile?.gender ?? "MALE");
  const [height, setHeight] = useState(profile?.height ?? 175);
  const [weight, setWeight] = useState(profile?.weight ?? 76);
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? "MUSCLE_GAIN");
  const [activityLevel, setActivityLevel] = useState(profile?.activityLevel ?? "MODERATE");

  // Calorie Mode: SUGGESTED or CUSTOM
  const [calorieMode, setCalorieMode] = useState<"SUGGESTED" | "CUSTOM">("SUGGESTED");
  const [customCalories, setCustomCalories] = useState(profile?.targetCalories ?? 2200);

  // Protein Mode: SUGGESTED or CUSTOM
  const [proteinMode, setProteinMode] = useState<"SUGGESTED" | "CUSTOM">("SUGGESTED");
  const [customProtein, setCustomProtein] = useState(profile?.targetProtein ?? 120);

  // Dynamic calculations
  const suggestedCalories = calculateSuggestedCalories(weight, height, age, gender, activityLevel, goal);
  const suggestedProtein = calculateSuggestedProtein(weight, goal);

  // If user profile updates, load values
  useEffect(() => {
    if (!profile) return;
    setAge(profile.age ?? 29);
    setGender(profile.gender ?? "MALE");
    setHeight(profile.height ?? 175);
    setWeight(profile.weight ?? 76);
    setGoal(profile.goal);
    setActivityLevel(profile.activityLevel ?? "MODERATE");
    setCustomCalories(profile.targetCalories ?? 2200);
    setCustomProtein(profile.targetProtein ?? 120);
  }, [profile]);

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

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const finalCalories = calorieMode === "SUGGESTED" ? suggestedCalories : customCalories;
    const finalProtein = proteinMode === "SUGGESTED" ? suggestedProtein : customProtein;

    const updatedProfile: UserProfile = {
      ...profile,
      name: String(formData.get("name") || profile.name),
      age: Number(age),
      gender: String(gender),
      height: Number(height),
      weight: Number(weight),
      goal,
      activityLevel: String(activityLevel),
      targetCalories: finalCalories,
      targetProtein: finalProtein
    };

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProfile)
        });
        if (response.ok) {
          await onSave(updatedProfile);
          onClose();
        }
      } catch (error) {
        console.error("Failed to save profile:", error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/20 p-3 backdrop-blur-sm sm:flex sm:items-end sm:justify-center">
      <div className="mx-auto mt-14 w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Profile & Calorie Targets</h2>
              <p className="text-sm text-muted-foreground">Adjust your biometrics and choose dynamic BMR or custom targets.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close settings">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Name</label>
              <Input name="name" defaultValue={profile.name} placeholder="Name" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Age (years)</label>
              <Input
                name="age"
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                placeholder="Age"
                min={13}
                max={100}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Gender</label>
              <select
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Height (cm)</label>
              <Input
                name="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                placeholder="Height in cm"
                min={90}
                max={250}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Weight (kg)</label>
              <Input
                name="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                placeholder="Weight in kg"
                min={25}
                max={300}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Activity Level</label>
              <select
                name="activityLevel"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {activityLevels.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Fitness Goal</label>
            <div className="grid grid-cols-3 gap-2">
              {goals.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value as Goal)}
                  className={`rounded-xl border p-3 text-sm transition-all hover:bg-muted ${
                    goal === g.value ? "bg-primary text-primary-foreground font-semibold" : "bg-background text-foreground"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calorie Selection Option */}
          <div className="space-y-2 border-t pt-4">
            <label className="text-xs font-semibold text-muted-foreground block">Calorie Target Selection</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCalorieMode("SUGGESTED")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  calorieMode === "SUGGESTED" ? "bg-primary/10 border-primary text-primary" : "bg-background border"
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested (TDEE Calculated)</div>
                <div className="text-xl font-bold mt-1">{suggestedCalories} <span className="text-xs font-medium">kcal</span></div>
                <div className="text-[10px] text-muted-foreground mt-1">Based on Mifflin-St Jeor equation</div>
              </button>
              <button
                type="button"
                onClick={() => setCalorieMode("CUSTOM")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  calorieMode === "CUSTOM" ? "bg-primary/10 border-primary text-primary" : "bg-background border"
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Calorie Intake</div>
                <div className="text-xl font-bold mt-1">{customCalories} <span className="text-xs font-medium">kcal</span></div>
                <div className="text-[10px] text-muted-foreground mt-1">Manually configured intake target</div>
              </button>
            </div>
            {calorieMode === "CUSTOM" && (
              <div className="mt-2 animate-fadeIn">
                <label className="text-xs font-semibold text-muted-foreground">Enter Custom Target Calories</label>
                <Input
                  type="number"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(Number(e.target.value))}
                  placeholder="e.g. 2350"
                  min={900}
                  max={6000}
                  required
                />
              </div>
            )}
          </div>

          {/* Protein Selection Option */}
          <div className="space-y-2 border-t pt-4">
            <label className="text-xs font-semibold text-muted-foreground block">Protein Target Selection</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProteinMode("SUGGESTED")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  proteinMode === "SUGGESTED" ? "bg-primary/10 border-primary text-primary" : "bg-background border"
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested (Goal Adaptive)</div>
                <div className="text-xl font-bold mt-1">{suggestedProtein} <span className="text-xs font-medium">g</span></div>
                <div className="text-[10px] text-muted-foreground mt-1">Tailored for muscle tissue maintenance</div>
              </button>
              <button
                type="button"
                onClick={() => setProteinMode("CUSTOM")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  proteinMode === "CUSTOM" ? "bg-primary/10 border-primary text-primary" : "bg-background border"
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Protein Intake</div>
                <div className="text-xl font-bold mt-1">{customProtein} <span className="text-xs font-medium">g</span></div>
                <div className="text-[10px] text-muted-foreground mt-1">Manually configured protein target</div>
              </button>
            </div>
            {proteinMode === "CUSTOM" && (
              <div className="mt-2 animate-fadeIn">
                <label className="text-xs font-semibold text-muted-foreground">Enter Custom Target Protein (g)</label>
                <Input
                  type="number"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(Number(e.target.value))}
                  placeholder="e.g. 150"
                  min={20}
                  max={400}
                  required
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
