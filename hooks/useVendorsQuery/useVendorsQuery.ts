import { useQuery } from "@tanstack/react-query";
import { getVendorsService } from "@/services/vendors";
import type { Vendor } from "@/types";

export function useVendorsQuery() {
  return useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: getVendorsService,
    staleTime: 5 * 60 * 1000,
  });
}
