import { useState } from "react";
import type { BillWithRelations } from "@/types";

export function useBillSelection(bills: BillWithRelations[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(bills.map((b) => b.id)));
  }

  function clear() {
    setSelectedIds(new Set());
  }

  const allSelected = bills.length > 0 && selectedIds.size === bills.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const selectedBills = bills.filter((b) => selectedIds.has(b.id));

  return { selectedIds, selectedBills, toggle, selectAll, clear, allSelected, someSelected };
}
