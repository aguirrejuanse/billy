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
            <TableHead>Due Date</TableHead>
            <TableHead>Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="max-w-35 truncate">{row.vendor_name}</TableCell>
              <TableCell>{row.number}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(row.amount, row.currency)}
              </TableCell>
              <TableCell>{row.due_date}</TableCell>
              <TableCell>{paymentMethodLabels[row.payment_type]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
