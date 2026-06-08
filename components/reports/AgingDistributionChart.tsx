"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import type { AgingRow } from "@/types";

interface AgingDistributionChartProps {
  rows: AgingRow[];
}

const BUCKETS = [
  { key: "current", label: "Current", color: "#22c55e" },
  { key: "days1_30", label: "1–30 days", color: "#eab308" },
  { key: "days31_60", label: "31–60 days", color: "#f97316" },
  { key: "days61_90", label: "61–90 days", color: "#ef4444" },
  { key: "days90plus", label: "90+ days", color: "#991b1b" },
] as const;

export function AgingDistributionChart({ rows }: AgingDistributionChartProps) {
  const data = BUCKETS.map(({ key, label, color }) => ({
    name: label,
    value: rows.reduce((sum, row) => sum + row[key], 0),
    color,
  })).filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">No data to display.</div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Outstanding by Aging Bucket</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const v = Number(value);
              return [`${formatCurrency(v)} (${((v / total) * 100).toFixed(1)}%)`, String(name)];
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
