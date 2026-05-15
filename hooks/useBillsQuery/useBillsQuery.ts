import { useQuery } from "@tanstack/react-query";
import { getBillsService } from "@/services/bills";
import type { BillWithRelations } from "@/types";

export function useBillsQuery() {
  return useQuery<BillWithRelations[]>({
    queryKey: ["bills"],
    queryFn: getBillsService,
    placeholderData: [],
    staleTime: 30000,
  });
}
