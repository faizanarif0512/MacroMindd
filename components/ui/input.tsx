import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";
