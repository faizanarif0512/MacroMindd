"use client";

import { motion } from "framer-motion";

export function MacroRing({ value, label, sublabel }: { value: number; label: string; sublabel: string }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative flex aspect-square min-h-44 items-center justify-center">
      <svg className="h-44 w-44 -rotate-90" viewBox="0 0 140 140" aria-hidden>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-semibold">{label}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>
      </div>
    </div>
  );
}
