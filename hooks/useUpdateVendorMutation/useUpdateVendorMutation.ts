import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVendorService } from "@/services/vendors";
import type { UpdateVendorInput } from "@/lib/validators";
import type { VendorWithMethods } from "@/types";
import { ApiError } from "@/lib/api";

interface UpdateVendorArgs {
  id: string;
  input: UpdateVendorInput;
}

export function useUpdateVendorMutation() {
  const queryClient = useQueryClient();

  return useMutation<VendorWithMethods, ApiError, UpdateVendorArgs>({
    mutationFn: ({ id, input }) => updateVendorService(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
