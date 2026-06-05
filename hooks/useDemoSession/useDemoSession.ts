import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { demoSignOutService } from "@/services/auth";
import { useDemoLoginMutation } from "@/hooks/useDemoLoginMutation";
import { useMeQuery } from "@/hooks/useMeQuery";

export function useDemoSession() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useMeQuery();
  const isDemo = data?.isDemo ?? false;

  const { mutate: signIn, isPending: isSigningIn, error: signInError } = useDemoLoginMutation();

  async function signOut() {
    try {
      await demoSignOutService();
    } finally {
      queryClient.clear();
      router.push("/sign-in");
    }
  }

  return { isDemo, user: data, signIn, isSigningIn, signInError, signOut };
}
