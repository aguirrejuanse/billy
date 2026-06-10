import { api } from "@/lib/api";
import type { PaymentWithRelations } from "@/types";
import type { PaymentAction } from "@/lib/validators";

interface GetPaymentsResponse {
  data: PaymentWithRelations[];
}

interface PaymentActionResponse {
  data: PaymentWithRelations;
}

export interface PaymentFilters {
  status?: string;
  paymentMethod?: string;
  vendorId?: string;
}

export async function getPaymentsService(
  filters?: PaymentFilters
): Promise<PaymentWithRelations[]> {
  const { data } = await api.get<GetPaymentsResponse>("/payments", { params: filters });
  return data.data;
}

export async function paymentActionService(
  id: string,
  action: PaymentAction
): Promise<PaymentWithRelations> {
  const { data } = await api.patch<PaymentActionResponse>(`/payments/${id}`, { action });
  return data.data;
}
