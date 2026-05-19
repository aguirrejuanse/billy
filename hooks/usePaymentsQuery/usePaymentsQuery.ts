import { useQuery } from "@tanstack/react-query";
import { getPaymentsService, type PaymentFilters } from "@/services/payments";
import type { PaymentWithRelations } from "@/types";

export function usePaymentsQuery(filters?: PaymentFilters) {
  return useQuery<PaymentWithRelations[]>({
    queryKey: ["payments", filters?.status, filters?.paymentMethod, filters?.vendorId],
    queryFn: () => getPaymentsService(filters),
    placeholderData: [],
    staleTime: 30000,
  });
}
