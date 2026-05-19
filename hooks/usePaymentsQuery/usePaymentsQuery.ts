import { useQuery } from "@tanstack/react-query";
import { getPaymentsService } from "@/services/payments";
import type { PaymentWithRelations } from "@/types";

export function usePaymentsQuery() {
  return useQuery<PaymentWithRelations[]>({
    queryKey: ["payments"],
    queryFn: getPaymentsService,
    placeholderData: [],
    staleTime: 30000,
  });
}
