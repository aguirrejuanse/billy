import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBillsImportService } from "@/services/bills";
import type { ImportBillRow, ImportResult } from "@/lib/import-validators";
import { ApiError } from "@/lib/api";

export function useCreateImportMutation() {
  const queryClient = useQueryClient();

  return useMutation<ImportResult, ApiError, ImportBillRow[]>({
    mutationFn: createBillsImportService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}
