import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  valueClassName?: string;
  description?: string;
}

export function StatCard({ label, value, valueClassName, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold ${valueClassName ?? ""}`}>{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
