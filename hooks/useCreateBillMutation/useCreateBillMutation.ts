import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createBillService } from "@/services/bills";
import type { CreateBillInput } from "@/lib/validators";
import type { Bill } from "@/types";
import { ApiError } from "@/lib/api";

export function useCreateBillMutation() {
  const queryClient = useQueryClient();

  return useMutation<Bill, ApiError, CreateBillInput>({
    mutationFn: createBillService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}
