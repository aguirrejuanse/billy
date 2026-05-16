import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBillService } from "@/services/bills";

export function useCreateBillMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBillService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}
