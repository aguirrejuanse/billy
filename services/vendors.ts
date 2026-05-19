import { api } from "@/lib/api";
import type { Vendor } from "@/types";
import type { CreateVendorInput, UpdateVendorInput } from "@/lib/validators";

interface GetVendorsResponse {
  data: Vendor[];
}

interface VendorResponse {
  data: Vendor;
}

export async function getVendorsService(): Promise<Vendor[]> {
  const { data } = await api.get<GetVendorsResponse>("/vendors");
  return data.data;
}

export async function createVendorService(input: CreateVendorInput): Promise<Vendor> {
  const { data } = await api.post<VendorResponse>("/vendors", input);
  return data.data;
}

export async function updateVendorService(id: string, input: UpdateVendorInput): Promise<Vendor> {
  const { data } = await api.patch<VendorResponse>(`/vendors/${id}`, input);
  return data.data;
}
