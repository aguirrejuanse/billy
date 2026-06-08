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
import { formatCurrency } from "@/lib/formatters";
import type { AgingRow } from "@/types";

interface AgingVendorChartProps {
  rows: AgingRow[];
}

const BUCKETS = [
  { key: "current", label: "Current", color: "#22c55e" },
  { key: "days1_30", label: "1–30 days", color: "#eab308" },
  { key: "days31_60", label: "31–60 days", color: "#f97316" },
  { key: "days61_90", label: "61–90 days", color: "#ef4444" },
  { key: "days90plus", label: "90+ days", color: "#991b1b" },
] as const;

const MAX_VENDOR_LABEL = 14;

function truncate(name: string) {
  return name.length > MAX_VENDOR_LABEL ? `${name.slice(0, MAX_VENDOR_LABEL)}…` : name;
}

export function AgingVendorChart({ rows }: AgingVendorChartProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">No data to display.</div>
    );
  }

  const data = rows.map((row) => ({
    name: truncate(row.vendorName),
    fullName: row.vendorName,
    current: row.current,
    days1_30: row.days1_30,
    days31_60: row.days31_60,
    days61_90: row.days61_90,
    days90plus: row.days90plus,
  }));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Outstanding by Vendor</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            width={56}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
          />
          <Legend />
          {BUCKETS.map(({ key, label, color }) => (
            <Bar key={key} dataKey={key} name={label} stackId="a" fill={color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
