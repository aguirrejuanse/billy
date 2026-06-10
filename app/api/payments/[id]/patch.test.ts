import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { PATCH } from "./route";

vi.mock("@/lib/auth");
vi.mock("@/db");
vi.mock("@/lib/utils");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { isValidUuid } from "@/lib/utils";
import type { Payment } from "@/db/schema";

const mockUser = {
  id: "a1b2c3d4-e5f6-4789-ab12-cd34ef567890",
  clerkId: "clerk_123",
  name: "Test User",
  email: "test@test.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PAYMENT_ID = "b2c3d4e5-f6a7-4890-bc23-de45fa678901";
const BILL_ID = "c3d4e5f6-a7b8-4901-cd34-ef56ab789012";
const VENDOR_ID = "d4e5f6a7-b8c9-4012-de45-fa67bc890123";

const mockPayment: Payment = {
  id: PAYMENT_ID,
  billId: BILL_ID,
  vendorId: VENDOR_ID,
  amount: "1000.00",
  status: "scheduled",
  scheduledDate: "2026-06-10",
  initiatedAt: null,
  paidAt: null,
  paymentMethod: "ach",
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBill = { id: BILL_ID, number: "BILL-001", ownerId: mockUser.id };
const mockVendor = { id: VENDOR_ID, name: "Acme Corp" };

function makeRequest(body: unknown, id = PAYMENT_ID) {
  return new NextRequest(`http://localhost/api/payments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(id = PAYMENT_ID) {
  return { params: Promise.resolve({ id }) };
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

function makeChain(rows: unknown[]) {
  const chain = { from: vi.fn(), innerJoin: vi.fn(), where: vi.fn(), limit: vi.fn() };
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockReturnValue({
    then: (fn: (rows: unknown[]) => unknown) => Promise.resolve(fn(rows)),
  });
  return chain;
}

// Builds a chainable db.select() mock that resolves to `rows`
function mockDbSelect(rows: unknown[]) {
  (db as unknown as { select: ReturnType<typeof vi.fn> }).select = vi
    .fn()
    .mockReturnValue(makeChain(rows));
}

// Builds a two-call db.select() mock: first call resolves firstRows, second call resolves secondRows
function mockSelectChain(firstRows: unknown[], secondRows: unknown[]) {
  let callCount = 0;
  (db as unknown as { select: ReturnType<typeof vi.fn> }).select = vi
    .fn()
    .mockImplementation(() => {
      return makeChain(++callCount === 1 ? firstRows : secondRows);
    });
}

// Builds a chainable db.update() mock that returns `returning` rows
function mockDbUpdate(returning: unknown[]) {
  const chain = {
    set: vi.fn(),
    where: vi.fn(),
    returning: vi.fn(),
  };
  chain.set.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.returning.mockResolvedValue(returning);
  (db as unknown as { update: ReturnType<typeof vi.fn> }).update = vi.fn().mockReturnValue(chain);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isValidUuid).mockReturnValue(true);
});

describe("PATCH /api/payments/:id", () => {
  describe("authentication", () => {
    it("returns 401 when unauthenticated", async () => {
      mockAuth(false);

      const res = await PATCH(makeRequest({ action: "release" }), makeParams());
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("param validation", () => {
    it("returns 404 for invalid UUID param", async () => {
      mockAuth();
      vi.mocked(isValidUuid).mockReturnValue(false);

      const res = await PATCH(
        makeRequest({ action: "release" }, "not-a-uuid"),
        makeParams("not-a-uuid")
      );
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe("Payment not found");
    });
  });

  describe("request validation", () => {
    it("returns 400 for invalid JSON body", async () => {
      mockAuth();

      const req = new NextRequest(`http://localhost/api/payments/${PAYMENT_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      });
      const res = await PATCH(req, makeParams());
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Invalid request body");
    });

    it("returns 422 for invalid action", async () => {
      mockAuth();

      const res = await PATCH(makeRequest({ action: "invalid_action" }), makeParams());
      expect(res.status).toBe(422);
    });
  });

  describe("business logic", () => {
    it("returns 404 when payment not found", async () => {
      mockAuth();
      mockDbSelect([]);

      const res = await PATCH(makeRequest({ action: "release" }), makeParams());
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe("Payment not found");
    });

    describe("release", () => {
      it("returns 400 when payment is not scheduled", async () => {
        mockAuth();
        mockDbSelect([
          { payment: { ...mockPayment, status: "initiated" }, bill: mockBill, vendor: mockVendor },
        ]);

        const res = await PATCH(makeRequest({ action: "release" }), makeParams());
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body.error).toBe("Only scheduled payments can be released");
      });

      it("returns 200 and transitions to initiated", async () => {
        mockAuth();
        const updatedPayment = { ...mockPayment, status: "initiated", initiatedAt: new Date() };
        mockSelectChain(
          [{ payment: mockPayment, bill: mockBill, vendor: mockVendor }],
          [{ payment: updatedPayment, bill: mockBill, vendor: mockVendor }]
        );
        mockDbUpdate([updatedPayment]);

        const res = await PATCH(makeRequest({ action: "release" }), makeParams());
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.data.status).toBe("initiated");
      });
    });

    describe("mark_paid", () => {
      it("returns 400 when payment is not initiated", async () => {
        mockAuth();
        mockDbSelect([{ payment: mockPayment, bill: mockBill, vendor: mockVendor }]);

        const res = await PATCH(makeRequest({ action: "mark_paid" }), makeParams());
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body.error).toBe("Only initiated payments can be marked as paid");
      });

      it("returns 200 and transitions to paid", async () => {
        mockAuth();
        const initiatedPayment = { ...mockPayment, status: "initiated" };
        const paidPayment = { ...mockPayment, status: "paid", paidAt: new Date() };
        mockSelectChain(
          [{ payment: initiatedPayment, bill: mockBill, vendor: mockVendor }],
          [{ payment: paidPayment, bill: mockBill, vendor: mockVendor }]
        );
        mockDbUpdate([paidPayment]);

        const res = await PATCH(makeRequest({ action: "mark_paid" }), makeParams());
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.data.status).toBe("paid");
      });
    });

    describe("retry", () => {
      it("returns 400 when payment is not failed", async () => {
        mockAuth();
        mockDbSelect([{ payment: mockPayment, bill: mockBill, vendor: mockVendor }]);

        const res = await PATCH(makeRequest({ action: "retry" }), makeParams());
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body.error).toBe("Only failed payments can be retried");
      });

      it("returns 200 and transitions back to scheduled", async () => {
        mockAuth();
        const failedPayment = { ...mockPayment, status: "failed" };
        const scheduledPayment = { ...mockPayment, status: "scheduled", initiatedAt: null };
        mockSelectChain(
          [{ payment: failedPayment, bill: mockBill, vendor: mockVendor }],
          [{ payment: scheduledPayment, bill: mockBill, vendor: mockVendor }]
        );
        mockDbUpdate([scheduledPayment]);

        const res = await PATCH(makeRequest({ action: "retry" }), makeParams());
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.data.status).toBe("scheduled");
      });
    });
  });

  describe("error handling", () => {
    it("returns 409 on race condition (RACE_LOST)", async () => {
      mockAuth();
      mockDbSelect([{ payment: mockPayment, bill: mockBill, vendor: mockVendor }]);
      mockDbUpdate([]); // returning() returns empty — race lost

      const res = await PATCH(makeRequest({ action: "release" }), makeParams());
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.error).toBe("Payment status changed concurrently");
    });

    it("returns 500 on unexpected db error", async () => {
      mockAuth();
      (db as unknown as { select: ReturnType<typeof vi.fn> }).select = vi
        .fn()
        .mockImplementation(() => {
          throw new Error("DB down");
        });

      const res = await PATCH(makeRequest({ action: "release" }), makeParams());
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
