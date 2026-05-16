import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import { paymentMethodEnum, currencyEnum, billStatusEnum } from "@/db/schema";

vi.mock("@/lib/auth");
vi.mock("@/db");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";

type FindFirstFn = ReturnType<typeof vi.fn>;

type MockDb = {
  query: {
    vendors: { findFirst: FindFirstFn };
    bills: { findFirst: FindFirstFn };
  };
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

const mockVendor = {
  id: "b2c3d4e5-f6a7-4890-bc23-de45fa678901",
  name: "Acme Corp",
  email: null,
  paymentMethod: paymentMethodEnum.enumValues[0],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validBody = {
  vendorId: mockVendor.id,
  number: "INV-001",
  amount: 100,
  currency: currencyEnum.enumValues[0],
  invoiceDate: "2024-01-15",
  dueDate: "2024-02-15",
  paymentType: paymentMethodEnum.enumValues[0],
};

const mockBill = {
  id: "c3d4e5f6-a7b8-4901-cd34-ef5678901234",
  ...validBody,
  amount: "100.00",
  ownerId: mockUser.id,
  status: billStatusEnum.enumValues[0],
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockAuth(authenticated = true) {
  if (authenticated) {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser, error: null });
  } else {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
  }
}

function buildTransactionMock(billResult = mockBill) {
  const insertMock = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([billResult]),
    }),
  });
  const transactionMock = vi
    .fn()
    .mockImplementation(
      async (cb: (tx: { insert: typeof insertMock }) => Promise<typeof billResult>) =>
        cb({ insert: insertMock })
    );
  return { insertMock, transactionMock };
}

function mockDb({
  vendor = mockVendor,
  existingBill = null,
  billResult = mockBill,
}: {
  vendor?: typeof mockVendor | null;
  existingBill?: typeof mockBill | null;
  billResult?: typeof mockBill;
} = {}) {
  const { insertMock, transactionMock } = buildTransactionMock(billResult);

  const mocked = db as unknown as MockDb;
  mocked.query = {
    vendors: { findFirst: vi.fn().mockResolvedValue(vendor) },
    bills: { findFirst: vi.fn().mockResolvedValue(existingBill) },
  };
  mocked.transaction = transactionMock;

  return { insertMock, transactionMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/bills", () => {
  describe("authentication", () => {
    it("returns 401 when unauthenticated", async () => {
      mockAuth(false);

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("request validation", () => {
    it("returns 400 for invalid JSON body", async () => {
      mockAuth();

      const req = new NextRequest("http://localhost/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Invalid JSON body");
    });

    it("returns 422 for invalid schema (missing required fields)", async () => {
      mockAuth();

      const res = await POST(makeRequest({ vendorId: mockVendor.id }));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(Array.isArray(body.error)).toBe(true);
    });
  });

  describe("business logic", () => {
    it("returns 422 when vendor does not exist", async () => {
      mockAuth();
      mockDb({ vendor: null });

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body.error).toBe("Vendor not found");
    });

    it("returns 409 when bill number already exists for this user", async () => {
      mockAuth();
      mockDb({ existingBill: mockBill });

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.error).toBe("Bill number already exists");
    });

    it("returns 201 with created bill on happy path (no lineItems)", async () => {
      mockAuth();
      mockDb();

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.data).toMatchObject({
        id: mockBill.id,
        number: mockBill.number,
        status: billStatusEnum.enumValues[0],
        ownerId: mockUser.id,
      });
    });

    it("returns 201 and inserts bill + lineItems in transaction", async () => {
      mockAuth();
      const { insertMock } = mockDb();

      const bodyWithLineItems = {
        ...validBody,
        lineItems: [{ description: "Service fee", amount: 50 }],
      };

      const res = await POST(makeRequest(bodyWithLineItems));
      expect(res.status).toBe(201);
      expect(insertMock).toHaveBeenCalledTimes(2);
    });
  });
});
