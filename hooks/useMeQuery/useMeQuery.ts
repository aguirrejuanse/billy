import { useQuery } from "@tanstack/react-query";
import { getMeService } from "@/services/auth";

export function useMeQuery() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMeService,
  });
}
