import type { AgingNumericKey } from "@/types";

interface AgingBucket {
  key: AgingNumericKey;
  label: string;
  color: string;
}

type AgingBuckets = readonly AgingBucket[];

export const AGING_BUCKETS: AgingBuckets = [
  { key: "days90plus", label: "90+ days", color: "#991b1b" },
  { key: "days61_90", label: "61–90 days", color: "#ef4444" },
  { key: "days31_60", label: "31–60 days", color: "#f97316" },
  { key: "days1_30", label: "1–30 days", color: "#eab308" },
  { key: "current", label: "Current", color: "#22c55e" },
];
