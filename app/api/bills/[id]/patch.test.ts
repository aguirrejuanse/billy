import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { PATCH } from "./route";

vi.mock("@/lib/auth");
vi.mock("@/db");
vi.mock("@/lib/utils");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { isValidUuid } from "@/lib/utils";
import type { BillWithRelations } from "@/types";

type FindFirstFn = ReturnType<typeof vi.fn>;
type MockDb = {
  query: { bills: { findFirst: FindFirstFn } };
  update: ReturnType<typeof vi.fn>;
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

const BILL_ID = "c3d4e5f6-a7b8-4901-cd34-ef56ab789012";
const VENDOR_ID = "d4e5f6a7-b8c9-4012-de45-fa67bc890123";

const mockBill: BillWithRelations = {
  id: BILL_ID,
  vendorId: VENDOR_ID,
  ownerId: mockUser.id,
  number: "INV-001",
  amount: "500.00",
  currency: "USD",
  status: "draft",
  invoiceDate: "2026-01-01",
  dueDate: "2026-02-01",
  description: null,
  paymentType: "ach",
  createdAt: new Date(),
  updatedAt: new Date(),
  vendor: null,
  lineItems: [],
  payment: null,
};

function makeRequest(body: unknown, id = BILL_ID) {
  return new NextRequest(`http://localhost/api/bills/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(id = BILL_ID) {
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

// Mocks db.query.bills.findFirst — first call returns `before`, second call returns `after`.
function mockDbFindFirst(
  before: BillWithRelations | null,
  after: BillWithRelations | null = before
) {
  const mocked = db as unknown as MockDb;
  mocked.query = {
    bills: {
      findFirst: vi.fn().mockResolvedValueOnce(before).mockResolvedValueOnce(after),
    },
  };
}

function mockDbUpdate(returning: unknown[]) {
  const chain = { set: vi.fn(), where: vi.fn(), returning: vi.fn() };
  chain.set.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.returning.mockResolvedValue(returning);
  (db as unknown as MockDb).update = vi.fn().mockReturnValue(chain);
}

interface MockTx {
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
}

// Mocks db.transaction — runs the callback with a tx that has update/insert mocked.
// Returns `tx` so tests can assert on side effects (e.g. tx.insert was called).
function mockDbTransaction(updateReturning: unknown[]): MockTx {
  const txChain = { set: vi.fn(), where: vi.fn(), returning: vi.fn() };
  txChain.set.mockReturnValue(txChain);
  txChain.where.mockReturnValue(txChain);
  txChain.returning.mockResolvedValue(updateReturning);

  const txInsertChain = { values: vi.fn().mockResolvedValue([]) };
  const tx: MockTx = {
    update: vi.fn().mockReturnValue(txChain),
    insert: vi.fn().mockReturnValue(txInsertChain),
  };

  (db as unknown as MockDb).transaction = vi
    .fn()
    .mockImplementation((fn: (tx: MockTx) => Promise<void>) => fn(tx));

  return tx;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isValidUuid).mockReturnValue(true);
});

describe("PATCH /api/bills/:id", () => {
  describe("authentication", () => {
    it("returns 401 when unauthenticated", async () => {
      mockAuth(false);

      const res = await PATCH(makeRequest({ action: "submit" }), makeParams());
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
        makeRequest({ action: "submit" }, "not-a-uuid"),
        makeParams("not-a-uuid")
      );
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe("Bill not found");
    });
  });

  describe("request validation", () => {
    it("returns 400 for invalid JSON body", async () => {
      mockAuth();

      const req = new NextRequest(`http://localhost/api/bills/${BILL_ID}`, {
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
    it("returns 404 when bill not found", async () => {
      mockAuth();
      mockDbFindFirst(null);

      const res = await PATCH(makeRequest({ action: "submit" }), makeParams());
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe("Bill not found");
    });

    describe("submit", () => {
      it("returns 400 when bill is not draft", async () => {
        mockAuth();
        mockDbFindFirst({ ...mockBill, status: "awaiting_approval" });

        const res = await PATCH(makeRequest({ action: "submit" }), makeParams());
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body.error).toBe("Only draft bills can be submitted");
      });

      it("returns 200 and transitions to awaiting_approval", async () => {
        mockAuth();
        const updatedBill = { ...mockBill, status: "awaiting_approval" as const };
        mockDbFindFirst(mockBill, updatedBill);
        mockDbUpdate([{ id: BILL_ID }]);

        const res = await PATCH(makeRequest({ action: "submit" }), makeParams());
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.data.status).toBe("awaiting_approval");
      });
    });

    describe("approve", () => {
      it("returns 400 when bill is not awaiting_approval", async () => {
        mockAuth();
        mockDbFindFirst({ ...mockBill, status: "draft" });

        const res = await PATCH(makeRequest({ action: "approve" }), makeParams());
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body.error).toBe("Bill cannot be approved in current status");
      });

      it("returns 200, transitions to approved, and creates a payment", async () => {
        mockAuth();
        const awaitingBill = { ...mockBill, status: "awaiting_approval" as const };
        const approvedBill = { ...mockBill, status: "approved" as const };
        mockDbFindFirst(awaitingBill, approvedBill);
        const tx = mockDbTransaction([{ id: BILL_ID }]);

        const res = await PATCH(makeRequest({ action: "approve" }), makeParams());
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.data.status).toBe("approved");
        expect(tx.insert).toHaveBeenCalledOnce();
      });
    });

    describe("reject", () => {
      it("returns 400 when bill is not awaiting_approval", async () => {
        mockAuth();
        mockDbFindFirst({ ...mockBill, status: "draft" });

        const res = await PATCH(makeRequest({ action: "reject" }), makeParams());
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body.error).toBe("Bill cannot be rejected in current status");
      });

      it("returns 200 and transitions to rejected", async () => {
        mockAuth();
        const awaitingBill = { ...mockBill, status: "awaiting_approval" as const };
        const rejectedBill = { ...mockBill, status: "rejected" as const };
        mockDbFindFirst(awaitingBill, rejectedBill);
        mockDbUpdate([{ id: BILL_ID }]);

        const res = await PATCH(makeRequest({ action: "reject" }), makeParams());
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.data.status).toBe("rejected");
      });
    });

    describe("archive", () => {
      it("returns 400 when bill is not rejected", async () => {
        mockAuth();
        mockDbFindFirst({ ...mockBill, status: "draft" });

        const res = await PATCH(makeRequest({ action: "archive" }), makeParams());
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body.error).toBe("Only rejected bills can be archived");
      });

      it("returns 200 and transitions to archived", async () => {
        mockAuth();
        const rejectedBill = { ...mockBill, status: "rejected" as const };
        const archivedBill = { ...mockBill, status: "archived" as const };
        mockDbFindFirst(rejectedBill, archivedBill);
        mockDbUpdate([{ id: BILL_ID }]);

        const res = await PATCH(makeRequest({ action: "archive" }), makeParams());
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.data.status).toBe("archived");
      });
    });
  });

  describe("error handling", () => {
    it("returns 409 on race condition (RACE_LOST)", async () => {
      mockAuth();
      mockDbFindFirst(mockBill);
      mockDbUpdate([]); // returning() returns empty — race lost

      const res = await PATCH(makeRequest({ action: "submit" }), makeParams());
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.error).toBe("Bill status changed concurrently");
    });

    it("returns 500 on unexpected db error", async () => {
      mockAuth();
      const mocked = db as unknown as MockDb;
      mocked.query = {
        bills: {
          findFirst: vi.fn().mockRejectedValue(new Error("DB down")),
        },
      };

      const res = await PATCH(makeRequest({ action: "submit" }), makeParams());
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
