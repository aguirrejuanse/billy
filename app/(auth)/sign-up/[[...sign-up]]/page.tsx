import { SignUp } from "@clerk/nextjs";
import { BillyLogo } from "@/app/(auth)/BillyLogo";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <BillyLogo />
      <SignUp />
    </div>
  );
}
