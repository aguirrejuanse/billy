import { useQuery } from "@tanstack/react-query";
import { getBillsService, type BillFilters } from "@/services/bills";
import type { BillWithRelations } from "@/types";

export function useBillsQuery(filters?: BillFilters) {
  return useQuery<BillWithRelations[]>({
    queryKey: ["bills", filters?.status, filters?.vendorId],
    queryFn: () => getBillsService(filters),
    placeholderData: [],
    staleTime: 30000,
  });
}
