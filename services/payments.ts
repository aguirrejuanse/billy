import { api } from "@/lib/api";
import type { PaymentWithRelations } from "@/types";

interface GetPaymentsResponse {
  data: PaymentWithRelations[];
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
