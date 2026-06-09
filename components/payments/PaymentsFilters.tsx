"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useVendorsQuery } from "@/hooks/useVendorsQuery";
import { paymentStatusLabels, paymentMethodLabels } from "@/lib/formatters";
import { paymentStatusEnum, paymentMethodEnum } from "@/db/schema";
import { FilterSelect } from "@/components/bills/filters/FilterSelect";
import { Button } from "@/components/ui/button";

export function PaymentsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: vendors, isPending } = useVendorsQuery();

  const currentStatus = searchParams.get("status");
  const currentMethod = searchParams.get("paymentMethod");
  const currentVendorId = searchParams.get("vendorId");

  const hasFilters = currentStatus !== null || currentMethod !== null || currentVendorId !== null;

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

  const statusOptions = paymentStatusEnum.enumValues.map((s) => ({
    value: s,
    label: paymentStatusLabels[s],
  }));

  const methodOptions = paymentMethodEnum.enumValues.map((m) => ({
    value: m,
    label: paymentMethodLabels[m],
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
        value={currentMethod}
        placeholder="All methods"
        options={methodOptions}
        onChange={(v) => updateParam("paymentMethod", v)}
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
