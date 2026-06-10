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
import { AGING_BUCKETS } from "@/lib/aging";
import type { AgingRow, AgingNumericKey } from "@/types";

interface AgingTableProps {
  rows: AgingRow[];
}

const COLUMNS: readonly { key: AgingNumericKey; label: string }[] = [
  ...AGING_BUCKETS,
  { key: "total" as const, label: "Total" },
];

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
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={`text-right${col.key !== "total" ? " hidden sm:table-cell" : ""}`}
              >
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
                <TableCell
                  key={col.key}
                  className={`text-right tabular-nums${col.key !== "total" ? " hidden sm:table-cell" : ""}`}
                >
                  {row[col.key] > 0 ? formatCurrency(row[col.key]) : "—"}
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow className="border-t-2 font-semibold">
            <TableCell>Total</TableCell>
            {COLUMNS.map((col) => (
              <TableCell
                key={col.key}
                className={`text-right tabular-nums${col.key !== "total" ? " hidden sm:table-cell" : ""}`}
              >
                {totals[col.key] > 0 ? formatCurrency(totals[col.key]) : "—"}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export function AgingTableSkeleton() {
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {SKELETON_HEADERS.map((h, i) => (
              <TableHead
                key={h}
                className={i > 0 && i < SKELETON_HEADERS.length - 1 ? "hidden sm:table-cell" : ""}
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: SKELETON_HEADERS.length }).map((_, j) => (
                <TableCell
                  key={j}
                  className={j > 0 && j < SKELETON_HEADERS.length - 1 ? "hidden sm:table-cell" : ""}
                >
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
