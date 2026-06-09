import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentMethodLabels } from "@/lib/formatters";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { EmptyState } from "@/components/ui/empty-state";
import type { VendorWithMethods } from "@/types";

interface VendorsTableProps {
  vendors: VendorWithMethods[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onEdit?: (vendor: VendorWithMethods) => void;
}

const COLUMNS = (
  <TableRow>
    <TableHead>Name</TableHead>
    <TableHead>Email</TableHead>
    <TableHead>Payment Method</TableHead>
    <TableHead>Type</TableHead>
    <TableHead />
  </TableRow>
);

export function VendorsTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-16" />
      <Table>
        <TableHeader>{COLUMNS}</TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-10" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function VendorsTable({ vendors, isLoading, error, onRetry, onEdit }: VendorsTableProps) {
  if (isLoading) return <VendorsTableSkeleton />;

  if (error) return <ErrorFallback message="Failed to load vendors." onRetry={onRetry} />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{vendors.length} vendors</p>
      {vendors.length === 0 ? (
        <EmptyState message="No vendors found." />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                {COLUMNS}
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {vendor.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {vendor.paymentMethods.map((m) => paymentMethodLabels[m]).join(", ")}
                    </TableCell>
                    <TableCell>
                      {vendor.ownerId === null ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                          Global
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {vendor.ownerId !== null && onEdit && (
                        <button
                          onClick={() => onEdit(vendor)}
                          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
