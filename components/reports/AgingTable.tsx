import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { AgingRow, AgingNumericKey } from "@/types";

interface AgingTableProps {
  rows: AgingRow[];
}

const COLUMNS = [
  { key: "current", label: "Current" },
  { key: "days1_30", label: "1–30 days" },
  { key: "days31_60", label: "31–60 days" },
  { key: "days61_90", label: "61–90 days" },
  { key: "days90plus", label: "90+ days" },
  { key: "total", label: "Total" },
] as const satisfies readonly { key: AgingNumericKey; label: string }[];

const SKELETON_HEADERS = ["Vendor", ...COLUMNS.map((c) => c.label)];

export function AgingTable({ rows }: AgingTableProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">No open bills found.</div>
    );
  }

  const totals = COLUMNS.reduce(
    (acc, { key }) => {
      acc[key] = rows.reduce((sum, row) => sum + row[key], 0);
      return acc;
    },
    {} as Record<(typeof COLUMNS)[number]["key"], number>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          {COLUMNS.map((col) => (
            <TableHead key={col.key} className="text-right">
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.vendorId}>
            <TableCell className="font-medium">{row.vendorName}</TableCell>
            {COLUMNS.map((col) => (
              <TableCell key={col.key} className="text-right tabular-nums">
                {row[col.key] > 0 ? formatCurrency(row[col.key]) : "—"}
              </TableCell>
            ))}
          </TableRow>
        ))}
        <TableRow className="border-t-2 font-semibold">
          <TableCell>Total</TableCell>
          {COLUMNS.map((col) => (
            <TableCell key={col.key} className="text-right tabular-nums">
              {totals[col.key] > 0 ? formatCurrency(totals[col.key]) : "—"}
            </TableCell>
          ))}
        </TableRow>
      </TableBody>
    </Table>
  );
}

export function AgingTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {SKELETON_HEADERS.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: SKELETON_HEADERS.length }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-4 w-20" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
