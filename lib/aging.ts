import type { AgingNumericKey } from "@/types";

interface AgingBucket {
  key: AgingNumericKey;
  label: string;
  color: string;
}

type AgingBuckets = readonly AgingBucket[];

export const AGING_BUCKETS: AgingBuckets = [
  { key: "current" as const, label: "Current", color: "#22c55e" },
  { key: "days1_30" as const, label: "1–30 days", color: "#eab308" },
  { key: "days31_60" as const, label: "31–60 days", color: "#f97316" },
  { key: "days61_90" as const, label: "61–90 days", color: "#ef4444" },
  { key: "days90plus" as const, label: "90+ days", color: "#991b1b" },
];
