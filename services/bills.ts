import { api } from "@/lib/api";
import type { Bill, BillWithRelations } from "@/types";
import type { CreateBillInput, BillAction } from "@/lib/validators";

interface GetBillsResponse {
  data: BillWithRelations[];
}

interface CreateBillResponse {
  data: Bill;
}

export interface BillFilters {
  status?: string;
  vendorId?: string;
}

export async function getBillsService(filters?: BillFilters): Promise<BillWithRelations[]> {
  const { data } = await api.get<GetBillsResponse>("/bills", { params: filters });
  return data.data;
}

export async function createBillService(input: CreateBillInput): Promise<Bill> {
  const { data } = await api.post<CreateBillResponse>("/bills", input);
  return data.data;
}

interface GetBillByIdResponse {
  data: BillWithRelations;
}

export async function getBillByIdService(id: string): Promise<BillWithRelations> {
  const { data } = await api.get<GetBillByIdResponse>(`/bills/${id}`);
  return data.data;
}

export async function billActionService(
  id: string,
  action: BillAction
): Promise<BillWithRelations> {
  const { data } = await api.patch<GetBillByIdResponse>(`/bills/${id}`, { action });
  return data.data;
}
