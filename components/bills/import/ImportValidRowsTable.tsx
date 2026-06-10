"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, paymentMethodLabels } from "@/lib/formatters";
import { type ImportBillRow } from "@/lib/import-validators";

interface ImportValidRowsTableProps {
  rows: ImportBillRow[];
}

export function ImportValidRowsTable({ rows }: ImportValidRowsTableProps) {
  return (
    <div className="overflow-auto rounded-md border max-h-64">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Number</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="hidden sm:table-cell">Due Date</TableHead>
            <TableHead className="hidden sm:table-cell">Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.vendor_name}-${row.number}`}>
              <TableCell className="max-w-35 truncate">{row.vendor_name}</TableCell>
              <TableCell>{row.number}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(row.amount, row.currency)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">{row.due_date}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {paymentMethodLabels[row.payment_type]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
