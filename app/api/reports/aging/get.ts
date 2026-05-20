import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bills as billsTable, vendors as vendorsTable, billStatusEnum } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { isoDateToLocal, MS_PER_DAY } from "@/lib/formatters";
import type { AgingRow, AgingReportData } from "@/types";

export const maxDuration = 30;

type BucketKey = keyof Omit<AgingRow, "vendorId" | "vendorName" | "total">;

function getBucket(days: number): BucketKey {
  if (days <= 0) return "current";
  if (days <= 30) return "days1_30";
  if (days <= 60) return "days31_60";
  if (days <= 90) return "days61_90";
  return "days90plus";
}

const OPEN_STATUSES = billStatusEnum.enumValues.filter(
  (s) => s === "awaiting_approval" || s === "approved"
);

export async function GET(_request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const rows = await db
      .select({
        dueDate: billsTable.dueDate,
        amount: billsTable.amount,
        vendorId: vendorsTable.id,
        vendorName: vendorsTable.name,
      })
      .from(billsTable)
      .innerJoin(vendorsTable, eq(billsTable.vendorId, vendorsTable.id))
      .where(and(eq(billsTable.ownerId, user.id), inArray(billsTable.status, OPEN_STATUSES)));

    const vendorMap = new Map<string, AgingRow>();
    let overdueBillCount = 0;

    for (const { dueDate, amount: rawAmount, vendorId, vendorName } of rows) {
      const days = Math.floor((todayMs - isoDateToLocal(dueDate).getTime()) / MS_PER_DAY);
      const bucket = getBucket(days);
      const amount = Number(rawAmount);

      if (isNaN(amount)) continue;
      if (days > 0) overdueBillCount++;

      const existing = vendorMap.get(vendorId);
      if (existing) {
        existing[bucket] += amount;
        existing.total += amount;
      } else {
        const row: AgingRow = {
          vendorId,
          vendorName,
          current: 0,
          days1_30: 0,
          days31_60: 0,
          days61_90: 0,
          days90plus: 0,
          total: amount,
        };
        row[bucket] = amount;
        vendorMap.set(vendorId, row);
      }
    }

    const agingRows = Array.from(vendorMap.values()).sort((a, b) =>
      a.vendorName.localeCompare(b.vendorName)
    );

    const { totalOutstanding, totalOverdue } = agingRows.reduce(
      (acc, row) => {
        acc.totalOutstanding += row.total;
        acc.totalOverdue += row.days1_30 + row.days31_60 + row.days61_90 + row.days90plus;
        return acc;
      },
      { totalOutstanding: 0, totalOverdue: 0 }
    );

    const data: AgingReportData = {
      rows: agingRows,
      summary: { totalOutstanding, totalOverdue, overdueBillCount },
    };

    return NextResponse.json({ data });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/reports/aging]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
