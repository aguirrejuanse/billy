"use client";

import { useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDemoLoginMutation } from "@/hooks/useDemoLoginMutation";

export function SignInForm() {
  const router = useRouter();
  const [showClerkSignIn, setShowClerkSignIn] = useState(false);
  const { mutate: demoLogin, isPending, error } = useDemoLoginMutation();

  function handleDemoLogin() {
    demoLogin(undefined, {
      onSuccess: () => router.push("/bills"),
    });
  }

  if (showClerkSignIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <SignIn />
        <button
          onClick={() => setShowClerkSignIn(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Billy</h1>
          <p className="text-sm text-muted-foreground">Accounts Payable Manager</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleDemoLogin}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <>
                <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Entering demo...
              </>
            ) : (
              "See demo"
            )}
          </button>

          {error && <p className="text-xs text-destructive text-center">{error.message}</p>}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <button
            onClick={() => setShowClerkSignIn(true)}
            className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Login with my account
          </button>
        </div>
      </div>
    </div>
  );
}
