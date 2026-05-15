import { api } from "@/lib/api";
import type { BillWithRelations } from "@/types";

interface GetBillsResponse {
  data: BillWithRelations[];
}

export async function getBillsService(): Promise<BillWithRelations[]> {
  const { data } = await api.get<GetBillsResponse>("/bills");
  return data.data;
}
