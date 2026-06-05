import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import { paymentMethodEnum, currencyEnum, billStatusEnum } from "@/db/schema";
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

const mockBill: Bill = {
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
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeRawRequest(rawBody: string) {
  return new NextRequest("http://localhost/api/bills", {
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

function mockDbQueries({
  vendor = mockVendor,
  existingBill = null,
}: {
  vendor?: typeof mockVendor | null;
  existingBill?: Bill | null;
} = {}) {
  const mocked = db as unknown as MockDb;
  mocked.query = {
    vendors: { findFirst: vi.fn().mockResolvedValue(vendor) },
    bills: { findFirst: vi.fn().mockResolvedValue(existingBill) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createBillWithLineItems).mockResolvedValue(mockBill);
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

      const res = await POST(makeRawRequest("not-json{{{"));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Invalid JSON body");
    });

    it("returns 422 for missing required fields", async () => {
      mockAuth();

      const res = await POST(makeRequest({ vendorId: mockVendor.id }));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(typeof body.error).toBe("string");
    });

    it("returns 422 when dueDate is before invoiceDate", async () => {
      mockAuth();

      const res = await POST(
        makeRequest({ ...validBody, invoiceDate: "2024-02-15", dueDate: "2024-01-15" })
      );
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body.error).toBe("Due date must be on or after invoice date");
    });
  });

  describe("business logic", () => {
    it("returns 422 when vendor does not exist", async () => {
      mockAuth();
      mockDbQueries({ vendor: null });

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body.error).toBe("Vendor not found");
    });

    it("returns 409 when bill number already exists for this user", async () => {
      mockAuth();
      mockDbQueries({ existingBill: mockBill });

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.error).toBe("Bill number already exists");
    });

    it("vendor-not-found takes precedence over duplicate-bill when both conditions are true", async () => {
      mockAuth();
      mockDbQueries({ vendor: null, existingBill: mockBill });

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body.error).toBe("Vendor not found");
    });

    it("returns 201 with created bill on happy path", async () => {
      mockAuth();
      mockDbQueries();

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

    it("calls createBillWithLineItems with correct params", async () => {
      mockAuth();
      mockDbQueries();

      await POST(makeRequest(validBody));

      expect(createBillWithLineItems).toHaveBeenCalledWith({
        data: expect.objectContaining({ number: "INV-001", amount: 100 }),
        ownerId: mockUser.id,
      });
    });

    it("returns 201 when line items are provided", async () => {
      mockAuth();
      mockDbQueries();

      const res = await POST(
        makeRequest({
          ...validBody,
          lineItems: [{ description: "Service fee", amount: 50 }],
        })
      );
      expect(res.status).toBe(201);
    });

    it("returns 500 when createBillWithLineItems throws", async () => {
      mockAuth();
      mockDbQueries();
      vi.mocked(createBillWithLineItems).mockRejectedValue(new Error("DB failure"));

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
