import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentActionService } from "@/services/payments";
import { ApiError } from "@/lib/api";
import type { PaymentWithRelations } from "@/types";
import type { PaymentAction } from "@/lib/validators";

export function usePaymentActionMutation(paymentId: string) {
  const queryClient = useQueryClient();

  return useMutation<PaymentWithRelations, ApiError, PaymentAction>({
    mutationFn: (action) => paymentActionService(paymentId, action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bills", data.billId] });
    },
  });
}
