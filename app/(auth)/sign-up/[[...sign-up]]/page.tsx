import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { BillyLogo } from "@/app/(auth)/BillyLogo";
import { buttonVariants } from "@/components/ui/button";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <BillyLogo />
      <div className="flex flex-col items-start gap-2 w-fit">
        <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          ← Back
        </Link>
        <SignUp />
      </div>
    </div>
  );
}
