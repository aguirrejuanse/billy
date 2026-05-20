import { eq, isNull, or } from "drizzle-orm";
import { vendors as vendorsTable } from "@/db/schema";

export const accessibleVendorFilter = (userId: string) =>
  or(isNull(vendorsTable.ownerId), eq(vendorsTable.ownerId, userId));
