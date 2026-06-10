"use client";

import { useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDemoLoginMutation } from "@/hooks/useDemoLoginMutation";
import { Button } from "@/components/ui/button";
import { BillyLogo } from "@/app/(auth)/BillyLogo";

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <BillyLogo />
        <div className="flex flex-col items-start gap-2 w-fit">
          <Button onClick={() => setShowClerkSignIn(false)} variant="ghost" size="sm">
            ← Back
          </Button>
          <SignIn />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 px-6">
        <BillyLogo />

        <div className="space-y-3">
          <Button onClick={handleDemoLogin} disabled={isPending} size="lg" className="w-full">
            {isPending ? (
              <>
                <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Entering demo...
              </>
            ) : (
              "See demo"
            )}
          </Button>

          {error && <p className="text-xs text-destructive text-center">{error.message}</p>}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowClerkSignIn(true)}
            className="w-full"
          >
            Login with my account
          </Button>
        </div>
      </div>
    </div>
  );
}
