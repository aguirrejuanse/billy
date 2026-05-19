import { api } from "@/lib/api";
import type { VendorWithMethods } from "@/types";
import type { CreateVendorInput, UpdateVendorInput } from "@/lib/validators";

interface GetVendorsResponse {
  data: VendorWithMethods[];
}

interface VendorResponse {
  data: VendorWithMethods;
}

export async function getVendorsService(): Promise<VendorWithMethods[]> {
  const { data } = await api.get<GetVendorsResponse>("/vendors");
  return data.data;
}

export async function createVendorService(input: CreateVendorInput): Promise<VendorWithMethods> {
  const { data } = await api.post<VendorResponse>("/vendors", input);
  return data.data;
}

export async function updateVendorService(
  id: string,
  input: UpdateVendorInput
): Promise<VendorWithMethods> {
  const { data } = await api.patch<VendorResponse>(`/vendors/${id}`, input);
  return data.data;
}
