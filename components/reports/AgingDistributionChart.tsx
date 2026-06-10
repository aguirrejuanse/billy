"use client";

import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { AGING_BUCKETS } from "@/lib/aging";
import { ChartEmptyState } from "@/components/reports/info/ChartEmptyState";
import type { AgingRow } from "@/types";

interface AgingDistributionChartProps {
  rows: AgingRow[];
}

export function AgingDistributionChart({ rows }: AgingDistributionChartProps) {
  const data = AGING_BUCKETS.map(({ key, label, color }) => ({
    name: label,
    value: rows.reduce((sum, row) => sum + row[key], 0),
    fill: color,
  })).filter((d) => d.value > 0);

  if (data.length === 0) return <ChartEmptyState />;

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
            innerRadius="45%"
            outerRadius="70%"
            paddingAngle={2}
            dataKey="value"
          >
            <text
              x="50%"
              y="46%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={16}
              fontWeight={600}
              fill="currentColor"
            >
              {formatCurrency(total)}
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill="#888"
            >
              outstanding
            </text>
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
