"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency, truncateLabel } from "@/lib/formatters";
import { AGING_BUCKETS } from "@/lib/aging";
import { ChartEmptyState } from "@/components/reports/info/ChartEmptyState";
import type { AgingRow } from "@/types";

interface AgingVendorChartProps {
  rows: AgingRow[];
}

export function AgingVendorChart({ rows }: AgingVendorChartProps) {
  if (rows.length === 0) return <ChartEmptyState />;

  const data = rows.map((row) => ({
    ...row,
    name: truncateLabel(row.vendorName, 14),
    fullName: row.vendorName,
  }));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Outstanding by Vendor</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
          barCategoryGap="40%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
            tick={{ fontSize: 12 }}
            width={64}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
          />
          <Legend />
          {AGING_BUCKETS.map(({ key, label, color }) => (
            <Bar key={key} dataKey={key} name={label} stackId="a" fill={color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
