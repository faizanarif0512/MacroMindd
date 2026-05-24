"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Show } from "@/components/auth/show";
import { Button } from "@/components/ui/button";

export function AuthNav() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">Sign in</Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">Sign up</Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton afterSignOutUrl="/" />
      </Show>
    </div>
  );
}
