import { db } from "@/db";
import { bills as billsTable, billLineItems as billLineItemsTable } from "@/db/schema";
import type { Bill } from "@/types";
import type { CreateBillInput } from "@/lib/validators";

interface CreateBillParams {
  data: CreateBillInput;
  ownerId: string;
}

export async function createBillWithLineItems({ data, ownerId }: CreateBillParams): Promise<Bill> {
  const { lineItems, amount, ...billData } = data;

  return db.transaction(async (tx) => {
    const [newBill] = await tx
      .insert(billsTable)
      .values({ ...billData, amount: String(amount), ownerId })
      .returning();

    if (lineItems?.length) {
      await tx
        .insert(billLineItemsTable)
        .values(
          lineItems.map((item) => ({ ...item, amount: String(item.amount), billId: newBill.id }))
        );
    }

    return newBill;
  });
}
