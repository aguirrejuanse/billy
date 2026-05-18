import { useQuery } from "@tanstack/react-query";
import { getBillByIdService } from "@/services/bills";
import type { BillWithRelations } from "@/types";

export function useBillQuery(id: string) {
  return useQuery<BillWithRelations>({
    queryKey: ["bills", id],
    queryFn: () => getBillByIdService(id),
    staleTime: 30000,
    retry: 1,
  });
}
