"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billActionService } from "@/services/bills";
import { ApiError } from "@/lib/api";
import type { BillWithRelations } from "@/types";
import type { BillAction } from "@/lib/validators";

export function useBillActionMutation(billId: string) {
  const queryClient = useQueryClient();

  return useMutation<BillWithRelations, ApiError, BillAction>({
    mutationFn: (action) => billActionService(billId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bills", billId] });
    },
  });
}
