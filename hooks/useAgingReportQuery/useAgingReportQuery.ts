import { useQuery } from "@tanstack/react-query";
import { getAgingReportService } from "@/services/reports";
import type { AgingReportData } from "@/types";

export function useAgingReportQuery() {
  return useQuery<AgingReportData>({
    queryKey: ["reports", "aging"],
    queryFn: getAgingReportService,
    staleTime: 30000,
  });
}
