import { api } from "@/lib/api";
import type { AgingReportData } from "@/types";

interface AgingReportResponse {
  data: AgingReportData;
}

export async function getAgingReportService(): Promise<AgingReportData> {
  const { data } = await api.get<AgingReportResponse>("/reports/aging");
  return data.data;
}
