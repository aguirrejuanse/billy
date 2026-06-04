import { useMutation } from "@tanstack/react-query";
import { demoSignInService } from "@/services/auth";

export function useDemoLoginMutation() {
  return useMutation<void, Error>({
    mutationFn: demoSignInService,
  });
}
