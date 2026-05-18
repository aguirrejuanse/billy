import { formatCurrency } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BillLineItem } from "@/types";

interface LineItemsInfoProps {
  lineItems: BillLineItem[];
  currency: string;
}

export function LineItemsInfo({ lineItems, currency }: LineItemsInfoProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">Line Items</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Account Code</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.accountCode ?? "—"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.amount, currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
