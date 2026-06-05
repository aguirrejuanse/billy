import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "./route";
import { paymentMethodEnum, paymentStatusEnum } from "@/db/schema";

vi.mock("@/lib/auth");
vi.mock("@/db");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";

type MockDb = {
  select: ReturnType<typeof vi.fn>;
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

const mockBill = {
  id: "c3d4e5f6-a7b8-4901-cd34-ef5678901234",
  vendorId: mockVendor.id,
  ownerId: mockUser.id,
  number: "INV-001",
  amount: "500.00",
  currency: "USD",
  status: "approved",
  invoiceDate: "2024-01-15",
  dueDate: "2024-02-15",
  paymentType: paymentMethodEnum.enumValues[0],
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPayment = {
  id: "d4e5f6a7-b8c9-4012-de45-fa678901234b",
  billId: mockBill.id,
  vendorId: mockVendor.id,
  amount: "500.00",
  status: "scheduled",
  scheduledDate: "2024-02-15",
  initiatedAt: null,
  paidAt: null,
  paymentMethod: paymentMethodEnum.enumValues[0],
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRow = {
  payments: mockPayment,
  bills: mockBill,
  vendors: mockVendor,
};

function makeRequest(searchParams: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/payments");
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

function mockDbSelect(rows = [mockRow], shouldReject = false) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: shouldReject
      ? vi.fn().mockRejectedValue(new Error("DB failure"))
      : vi.fn().mockResolvedValue(rows),
  };
  (db as unknown as MockDb).select = vi.fn().mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/payments", () => {
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
    it("returns 200 with payments when no filters provided", async () => {
      mockAuth();
      mockDbSelect();

      const res = await GET(makeRequest());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(mockPayment.id);
      expect(body.data[0].bill.id).toBe(mockBill.id);
      expect(body.data[0].vendor.id).toBe(mockVendor.id);
    });

    it("returns 200 with empty array when no payments exist", async () => {
      mockAuth();
      mockDbSelect([]);

      const res = await GET(makeRequest());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toEqual([]);
    });

    it("returns 200 with valid status filter", async () => {
      mockAuth();
      mockDbSelect();

      const res = await GET(makeRequest({ status: paymentStatusEnum.enumValues[0] }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
    });

    it("returns 200 with valid paymentMethod filter", async () => {
      mockAuth();
      mockDbSelect();

      const res = await GET(makeRequest({ paymentMethod: paymentMethodEnum.enumValues[0] }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
    });

    it("returns 200 with valid vendorId filter", async () => {
      mockAuth();
      mockDbSelect();

      const res = await GET(makeRequest({ vendorId: mockVendor.id }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
    });

    it("returns 200 with all three filters combined", async () => {
      mockAuth();
      mockDbSelect();

      const res = await GET(
        makeRequest({
          status: paymentStatusEnum.enumValues[0],
          paymentMethod: paymentMethodEnum.enumValues[0],
          vendorId: mockVendor.id,
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
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

    it("returns 422 for invalid paymentMethod value", async () => {
      mockAuth();

      const res = await GET(makeRequest({ paymentMethod: "invalid_method" }));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body.error).toBe("Invalid paymentMethod value");
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
    it("returns 500 when db throws", async () => {
      mockAuth();
      mockDbSelect([], true);

      const res = await GET(makeRequest());
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
