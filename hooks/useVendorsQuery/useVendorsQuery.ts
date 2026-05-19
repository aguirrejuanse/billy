import { useQuery } from "@tanstack/react-query";
import { getVendorsService } from "@/services/vendors";
import type { VendorWithMethods } from "@/types";

export function useVendorsQuery() {
  return useQuery<VendorWithMethods[]>({
    queryKey: ["vendors"],
    queryFn: getVendorsService,
    staleTime: 5 * 60 * 1000,
  });
}
