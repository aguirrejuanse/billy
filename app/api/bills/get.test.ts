import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "./route";
import { paymentMethodEnum, currencyEnum, billStatusEnum } from "@/db/schema";
import type { BillWithRelations } from "@/types";

vi.mock("@/lib/auth");
vi.mock("@/db");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";

type FindFirstFn = ReturnType<typeof vi.fn>;
type FindManyFn = ReturnType<typeof vi.fn>;

type MockDb = {
  query: {
    vendors: { findFirst: FindFirstFn };
    bills: { findFirst: FindFirstFn; findMany: FindManyFn };
  };
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
  paymentMethods: [paymentMethodEnum.enumValues[0]],
  ownerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBillWithRelations: BillWithRelations = {
  id: "c3d4e5f6-a7b8-4901-cd34-ef5678901234",
  vendorId: mockVendor.id,
  number: "INV-001",
  amount: "100.00",
  currency: currencyEnum.enumValues[0],
  invoiceDate: "2024-01-15",
  dueDate: "2024-02-15",
  paymentType: paymentMethodEnum.enumValues[0],
  ownerId: mockUser.id,
  status: billStatusEnum.enumValues[0],
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  vendor: mockVendor,
  lineItems: [],
  payment: null,
};

function makeRequest(searchParams: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/bills");
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
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

function mockDbFindMany(bills: BillWithRelations[] = [mockBillWithRelations]) {
  const mocked = db as unknown as MockDb;
  mocked.query = {
    vendors: { findFirst: vi.fn() },
    bills: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue(bills) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/bills", () => {
  describe("authentication", () => {
    it("returns 401 when unauthenticated", async () => {
      mockAuth(false);

      const res = await GET(makeRequest());
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("happy path", () => {
    it("returns 200 with bills when no filters provided", async () => {
      mockAuth();
      mockDbFindMany();

      const res = await GET(makeRequest());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(mockBillWithRelations.id);
    });

    it("returns 200 with empty array when no bills exist", async () => {
      mockAuth();
      mockDbFindMany([]);

      const res = await GET(makeRequest());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toEqual([]);
    });

    it("returns 200 with valid status filter", async () => {
      mockAuth();
      mockDbFindMany();

      const res = await GET(makeRequest({ status: billStatusEnum.enumValues[0] }));
      expect(res.status).toBe(200);
    });

    it("returns 200 with valid vendorId filter", async () => {
      mockAuth();
      mockDbFindMany();

      const res = await GET(makeRequest({ vendorId: mockVendor.id }));
      expect(res.status).toBe(200);
    });

    it("returns 200 with both filters combined", async () => {
      mockAuth();
      mockDbFindMany();

      const res = await GET(
        makeRequest({ status: billStatusEnum.enumValues[0], vendorId: mockVendor.id })
      );
      expect(res.status).toBe(200);
    });
  });

  describe("filter validation", () => {
    it("returns 422 for invalid status value", async () => {
      mockAuth();

      const res = await GET(makeRequest({ status: "invalid_status" }));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body.error).toBe("Invalid status value");
    });

    it("returns 422 for non-UUID vendorId", async () => {
      mockAuth();

      const res = await GET(makeRequest({ vendorId: "not-a-uuid" }));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body.error).toBe("Invalid vendorId");
    });
  });

  describe("error handling", () => {
    it("returns 500 when db.query.bills.findMany throws", async () => {
      mockAuth();
      const mocked = db as unknown as MockDb;
      mocked.query = {
        vendors: { findFirst: vi.fn() },
        bills: {
          findFirst: vi.fn(),
          findMany: vi.fn().mockRejectedValue(new Error("DB failure")),
        },
      };

      const res = await GET(makeRequest());
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
