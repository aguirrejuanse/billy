import { api } from "@/lib/api";
import type { Vendor } from "@/types";

interface GetVendorsResponse {
  data: Vendor[];
}

export async function getVendorsService(): Promise<Vendor[]> {
  const { data } = await api.get<GetVendorsResponse>("/vendors");
  return data.data;
}
