import { useQuery } from "@tanstack/react-query";
import { getAgingReportService } from "@/services/reports";
import type { AgingReportData } from "@/types";

export function useAgingReportQuery(endDate?: string) {
  return useQuery<AgingReportData>({
    queryKey: ["reports", "aging", endDate],
    queryFn: () => getAgingReportService(endDate),
    staleTime: 30000,
  });
}
