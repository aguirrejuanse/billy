import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVendorService } from "@/services/vendors";
import type { CreateVendorInput } from "@/lib/validators";
import type { VendorWithMethods } from "@/types";
import { ApiError } from "@/lib/api";

export function useCreateVendorMutation() {
  const queryClient = useQueryClient();

  return useMutation<VendorWithMethods, ApiError, CreateVendorInput>({
    mutationFn: createVendorService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
