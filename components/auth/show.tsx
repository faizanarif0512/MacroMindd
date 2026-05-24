"use client";

import { useAuth } from "@clerk/nextjs";

export function Show({ when, children }: { when: "signed-in" | "signed-out"; children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (when === "signed-in" && isSignedIn) {
    return children;
  }

  if (when === "signed-out" && !isSignedIn) {
    return children;
  }

  return null;
}
