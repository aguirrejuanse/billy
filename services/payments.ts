import { api } from "@/lib/api";
import type { PaymentWithRelations } from "@/types";

interface GetPaymentsResponse {
  data: PaymentWithRelations[];
}

export async function getPaymentsService(): Promise<PaymentWithRelations[]> {
  const { data } = await api.get<GetPaymentsResponse>("/payments");
  return data.data;
}
