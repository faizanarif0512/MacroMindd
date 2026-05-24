"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <ProgressPrimitive.Root className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-primary transition-all"
        style={{ transform: `translateX(-${100 - Math.min(value, 100)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
