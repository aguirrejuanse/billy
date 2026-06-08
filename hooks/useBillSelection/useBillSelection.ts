import { useState } from "react";
import type { BillWithRelations } from "@/types";

export function useBillSelection(bills: BillWithRelations[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const billIds = new Set(bills.map((b) => b.id));
  const validSelectedIds = new Set([...selectedIds].filter((id) => billIds.has(id)));

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

  const allSelected = bills.length > 0 && validSelectedIds.size === bills.length;
  const someSelected = validSelectedIds.size > 0 && !allSelected;

  const selectedBills = bills.filter((b) => validSelectedIds.has(b.id));

  return {
    selectedIds: validSelectedIds,
    selectedBills,
    toggle,
    selectAll,
    clear,
    allSelected,
    someSelected,
  };
}
