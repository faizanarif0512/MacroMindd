"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Activity, Apple, Dumbbell, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Goal } from "@/lib/types";

const goals: { Icon: typeof Flame; label: string; value: Goal }[] = [
  { Icon: Flame, label: "Fat loss", value: "FAT_LOSS" },
  { Icon: Dumbbell, label: "Muscle gain", value: "MUSCLE_GAIN" },
  { Icon: Activity, label: "Maintenance", value: "MAINTENANCE" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [goal, setGoal] = useState<Goal>("MUSCLE_GAIN");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isLoaded && !user) {
      setStatus("Sign in first so your profile can be saved.");
    }
  }, [isLoaded, user]);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setStatus("");
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? user?.fullName ?? "MacroMind user"),
          email: String(formData.get("email") ?? user?.primaryEmailAddress?.emailAddress ?? "user@macromind.local"),
          age: Number(formData.get("age")),
          gender: String(formData.get("gender")),
          height: Number(formData.get("height")),
          weight: Number(formData.get("weight")),
          goal,
          activityLevel: String(formData.get("activityLevel")),
          targetCalories: Number(formData.get("targetCalories")),
          targetProtein: Number(formData.get("targetProtein"))
        })
      });

      if (!response.ok) {
        setStatus("Could not save profile. Check that you are signed in.");
        return;
      }

      if (!user) {
        localStorage.setItem("macromind_guest_profile", JSON.stringify({
          name: String(formData.get("name") ?? "MacroMind user"),
          email: String(formData.get("email") ?? "user@macromind.local"),
          age: Number(formData.get("age")),
          gender: String(formData.get("gender")),
          height: Number(formData.get("height")),
          weight: Number(formData.get("weight")),
          goal,
          activityLevel: String(formData.get("activityLevel")),
          targetCalories: Number(formData.get("targetCalories")),
          targetProtein: Number(formData.get("targetProtein"))
        }));
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <form onSubmit={saveProfile} className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Apple className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Set up MacroMind</h1>
            <p className="text-sm text-muted-foreground">Your targets tune the dashboard and AI coach.</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input name="name" placeholder="Name" defaultValue={user?.fullName ?? "Faizan"} />
            <Input name="email" placeholder="Email" defaultValue={user?.primaryEmailAddress?.emailAddress ?? "demo@macromind.app"} />
            <Input name="age" type="number" placeholder="Age" defaultValue={29} />
            <select name="gender" defaultValue="MALE" className="h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
            <Input name="height" type="number" placeholder="Height in cm" defaultValue={175} />
            <Input name="weight" type="number" placeholder="Weight in kg" defaultValue={76} />
            <select name="activityLevel" defaultValue="MODERATE" className="h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:col-span-2">
              <option value="SEDENTARY">Sedentary</option>
              <option value="LIGHT">Light</option>
              <option value="MODERATE">Moderate</option>
              <option value="ACTIVE">Active</option>
              <option value="ATHLETE">Athlete</option>
            </select>
            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              {goals.map(({ Icon, label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoal(value)}
                  className={`rounded-xl border p-4 text-left text-sm hover:bg-muted ${goal === value ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  <Icon className="mb-3 h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            <Input name="targetCalories" type="number" placeholder="Target calories" defaultValue={2450} />
            <Input name="targetProtein" type="number" placeholder="Protein goal" defaultValue={145} />
            {status ? <p className="text-sm text-muted-foreground sm:col-span-2">{status}</p> : null}
            <Button className="sm:col-span-2" disabled={isPending || !isLoaded}>
              {isPending ? "Saving..." : "Save profile"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}
