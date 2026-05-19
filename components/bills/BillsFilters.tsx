"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendorsQuery } from "@/hooks/useVendorsQuery";
import { billStatusLabels } from "@/lib/formatters";
import { billStatusEnum } from "@/db/schema";

export function BillsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: vendors } = useVendorsQuery();

  const currentStatus = searchParams.get("status");
  const currentVendorId = searchParams.get("vendorId");

  const hasFilters = currentStatus !== null || currentVendorId !== null;

  function updateParam(key: string, value: string | null) {
    if (value === null) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    if (value) params.set(key, value);
    router.replace(`?${params.toString()}`);
  }

  function clearFilters() {
    router.replace("?");
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={currentStatus ?? undefined} onValueChange={(v) => updateParam("status", v)}>
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          {billStatusEnum.enumValues.map((s) => (
            <SelectItem key={s} value={s}>
              {billStatusLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentVendorId ?? undefined}
        onValueChange={(v) => updateParam("vendorId", v)}
      >
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue placeholder="All vendors" />
        </SelectTrigger>
        <SelectContent>
          {vendors?.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors cursor-pointer"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
