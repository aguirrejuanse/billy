"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useVendorsQuery } from "@/hooks/useVendorsQuery";
import { billStatusLabels } from "@/lib/formatters";
import { billStatusEnum } from "@/db/schema";
import { FilterSelect } from "./filters/FilterSelect";
import { Button } from "@/components/ui/button";

export function BillsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: vendors, isPending } = useVendorsQuery();

  const currentStatus = searchParams.get("status");
  const currentVendorId = searchParams.get("vendorId");

  const hasFilters = currentStatus !== null || currentVendorId !== null;

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`?${params.toString()}`);
  }

  function clearFilters() {
    router.replace(pathname);
  }

  const statusOptions = billStatusEnum.enumValues.map((s) => ({
    value: s,
    label: billStatusLabels[s],
  }));

  const vendorOptions = (vendors ?? []).map((v) => ({ value: v.id, label: v.name }));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterSelect
        value={currentStatus}
        placeholder="All statuses"
        options={statusOptions}
        onChange={(v) => updateParam("status", v)}
      />
      <FilterSelect
        value={currentVendorId}
        placeholder="All vendors"
        options={vendorOptions}
        onChange={(v) => updateParam("vendorId", v)}
        disabled={isPending}
      />
      {hasFilters && (
        <Button
          variant="link"
          size="sm"
          onClick={clearFilters}
          className="text-xs text-muted-foreground"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
