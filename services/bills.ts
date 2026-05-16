import { api } from "@/lib/api";
import type { Bill, BillWithRelations } from "@/types";
import type { CreateBillInput } from "@/lib/validators";

interface GetBillsResponse {
  data: BillWithRelations[];
}

interface CreateBillResponse {
  data: Bill;
}

export async function getBillsService(): Promise<BillWithRelations[]> {
  const { data } = await api.get<GetBillsResponse>("/bills");
  return data.data;
}

export async function createBillService(input: CreateBillInput): Promise<Bill> {
  const { data } = await api.post<CreateBillResponse>("/bills", input);
  return data.data;
}
