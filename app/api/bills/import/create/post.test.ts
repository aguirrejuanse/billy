import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import type { Bill } from "@/types";

vi.mock("@/lib/auth");
vi.mock("@/db");
vi.mock("@/lib/bill-queries");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { createBillWithLineItems } from "@/lib/bill-queries";

type FindFirstFn = ReturnType<typeof vi.fn>;
type MockDb = {
  query: {
    vendors: { findFirst: FindFirstFn };
    bills: { findFirst: FindFirstFn };
  };
  insert: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
};

const mockUser = {
  id: "a1b2c3d4-e5f6-4789-ab12-cd34ef567890",
  clerkId: "clerk_123",
  name: "Test User",
  email: "test@test.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const VENDOR_ID = "b2c3d4e5-f6a7-4890-bc23-de45fa678901";

const mockVendorPrivate = {
  id: VENDOR_ID,
  name: "Acme Corp",
  email: null,
  ownerId: mockUser.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  paymentMethods: [{ method: "ach" }],
};

const mockVendorGlobal = {
  ...mockVendorPrivate,
  ownerId: null,
  paymentMethods: [{ method: "ach" }],
};

const mockBill: Bill = {
  id: "c3d4e5f6-a7b8-4901-cd34-ef5678901234",
  vendorId: VENDOR_ID,
  number: "INV-001",
  amount: "1500.00",
  currency: "USD",
  invoiceDate: "2026-01-15",
  dueDate: "2026-02-15",
  paymentType: "ach",
  ownerId: mockUser.id,
  status: "draft",
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validRow = {
  vendor_name: "Acme Corp",
  number: "INV-001",
  amount: 1500,
  currency: "USD" as const,
  invoice_date: "2026-01-15",
  due_date: "2026-02-15",
  description: undefined,
  payment_type: "ach" as const,
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bills/import/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeRawRequest(rawBody: string) {
  return new NextRequest("http://localhost/api/bills/import/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody,
  });
}

function mockAuth(authenticated = true) {
  if (authenticated) {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: mockUser,
      isDemo: false,
      error: null,
    });
  } else {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: null,
      isDemo: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
  }
}

// Note: bills.findFirst is queried BEFORE vendors.findFirst (duplicate check is now first)
function mockDbQueries({
  vendor = mockVendorPrivate as typeof mockVendorPrivate | typeof mockVendorGlobal | null,
  existingBill = null as Bill | null,
} = {}) {
  const mocked = db as unknown as MockDb;
  mocked.query = {
    bills: { findFirst: vi.fn().mockResolvedValue(existingBill) },
    vendors: { findFirst: vi.fn().mockResolvedValue(vendor) },
  };
}

function mockDbInsert() {
  const chain = { values: vi.fn().mockResolvedValue([]) };
  (db as unknown as MockDb).insert = vi.fn().mockReturnValue(chain);
}

function mockDbTransaction(newVendor = mockVendorPrivate) {
  const txInsertChain = { values: vi.fn().mockResolvedValue([]) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx: any = {
    insert: vi.fn().mockReturnValue(txInsertChain),
  };
  (db as unknown as MockDb).transaction = vi
    .fn()
    .mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      tx.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVendor]),
        }),
      });
      return fn(tx);
    });
  return tx;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createBillWithLineItems).mockResolvedValue(mockBill);
});

describe("POST /api/bills/import/create", () => {
  describe("authentication", () => {
    it("returns 401 when unauthenticated", async () => {
      mockAuth(false);
      const res = await POST(makeRequest({ rows: [validRow] }));
      expect(res.status).toBe(401);
    });
  });

  describe("request validation", () => {
    it("returns 400 for invalid JSON body", async () => {
      mockAuth();
      const res = await POST(makeRawRequest("not-json{{{"));
      expect(res.status).toBe(400);
    });

    it("returns 422 for empty rows array", async () => {
      mockAuth();
      const res = await POST(makeRequest({ rows: [] }));
      expect(res.status).toBe(422);
    });

    it("returns 422 when rows exceed 50", async () => {
      mockAuth();
      const rows = Array.from({ length: 51 }, (_, i) => ({
        ...validRow,
        number: `INV-${i}`,
      }));
      const res = await POST(makeRequest({ rows }));
      expect(res.status).toBe(422);
    });

    it("returns 422 for invalid row data", async () => {
      mockAuth();
      const res = await POST(makeRequest({ rows: [{ vendor_name: "", number: "", amount: -1 }] }));
      expect(res.status).toBe(422);
    });
  });

  describe("happy path — vendor found", () => {
    it("creates bill and returns 201 with imported count", async () => {
      mockAuth();
      mockDbQueries();
      mockDbInsert();

      const res = await POST(makeRequest({ rows: [validRow] }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.imported).toBe(1);
      expect(body.data.errors).toHaveLength(0);
    });

    it("calls createBillWithLineItems with mapped camelCase fields", async () => {
      mockAuth();
      mockDbQueries();
      mockDbInsert();

      await POST(makeRequest({ rows: [validRow] }));

      expect(createBillWithLineItems).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vendorId: VENDOR_ID,
          invoiceDate: "2026-01-15",
          dueDate: "2026-02-15",
          paymentType: "ach",
          lineItems: [],
        }),
        ownerId: mockUser.id,
      });
    });

    it("inserts missing payment method on existing private vendor", async () => {
      mockAuth();
      const vendorWithoutMethod = { ...mockVendorPrivate, paymentMethods: [] };
      mockDbQueries({ vendor: vendorWithoutMethod });
      mockDbInsert();

      await POST(makeRequest({ rows: [validRow] }));

      const mocked = db as unknown as MockDb;
      expect(mocked.insert).toHaveBeenCalled();
    });

    it("does NOT insert payment method on global vendor, but still creates bill", async () => {
      mockAuth();
      mockDbQueries({ vendor: mockVendorGlobal });
      mockDbInsert();

      await POST(makeRequest({ rows: [validRow] }));

      const mocked = db as unknown as MockDb;
      expect(mocked.insert).not.toHaveBeenCalled();
      expect(createBillWithLineItems).toHaveBeenCalledOnce();
    });
  });

  describe("happy path — vendor not found", () => {
    it("auto-creates vendor and bill, returns 201 with imported=1", async () => {
      mockAuth();
      mockDbQueries({ vendor: null });
      mockDbTransaction();

      const res = await POST(makeRequest({ rows: [validRow] }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.imported).toBe(1);
    });
  });

  describe("error accumulation", () => {
    it("returns row error for duplicate bill number, other rows still import", async () => {
      mockAuth();
      // bills.findFirst: first row → duplicate, second row → no duplicate
      // vendors.findFirst: called only for non-duplicate rows (second row)
      const mocked = db as unknown as MockDb;
      mocked.query = {
        bills: {
          findFirst: vi.fn().mockResolvedValueOnce(mockBill).mockResolvedValueOnce(null),
        },
        vendors: { findFirst: vi.fn().mockResolvedValue(mockVendorPrivate) },
      };
      mockDbInsert();

      const rows = [validRow, { ...validRow, number: "INV-002" }];
      const res = await POST(makeRequest({ rows }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.imported).toBe(1);
      expect(body.data.errors).toHaveLength(1);
      expect(body.data.errors[0].row).toBe(2);
      expect(body.data.errors[0].error).toContain("INV-001");
    });

    it("processes all rows and accumulates multiple errors", async () => {
      mockAuth();
      const mocked = db as unknown as MockDb;
      mocked.query = {
        bills: { findFirst: vi.fn().mockResolvedValue(mockBill) }, // all duplicates
        vendors: { findFirst: vi.fn().mockResolvedValue(mockVendorPrivate) },
      };
      mockDbInsert();

      const rows = [
        validRow,
        { ...validRow, number: "INV-002" },
        { ...validRow, number: "INV-003" },
      ];
      const res = await POST(makeRequest({ rows }));
      const body = await res.json();
      expect(body.data.imported).toBe(0);
      expect(body.data.errors).toHaveLength(3);
    });

    it("createBillWithLineItems failure becomes a row error, does not abort the whole import", async () => {
      mockAuth();
      // First row fails, second row succeeds
      vi.mocked(createBillWithLineItems)
        .mockRejectedValueOnce(new Error("DB failure"))
        .mockResolvedValueOnce(mockBill);
      const mocked = db as unknown as MockDb;
      mocked.query = {
        bills: { findFirst: vi.fn().mockResolvedValue(null) },
        vendors: { findFirst: vi.fn().mockResolvedValue(mockVendorPrivate) },
      };
      mockDbInsert();

      const rows = [validRow, { ...validRow, number: "INV-002" }];
      const res = await POST(makeRequest({ rows }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.imported).toBe(1);
      expect(body.data.errors).toHaveLength(1);
      expect(body.data.errors[0].error).toBe("Failed to create bill");
    });
  });

  describe("error handling", () => {
    it("returns 500 when auth throws unexpectedly", async () => {
      vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error("Auth failure"));

      const res = await POST(makeRequest({ rows: [validRow] }));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
