import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { PATCH } from "./route";

vi.mock("@/lib/auth");
vi.mock("@/db");
vi.mock("@/lib/utils");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { isValidUuid } from "@/lib/utils";
import type { Vendor } from "@/db/schema";

type MockDb = {
  query: {
    vendors: { findFirst: ReturnType<typeof vi.fn> };
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

const mockVendorRow: Vendor = {
  id: "b2c3d4e5-f6a7-4890-bc23-de45fa678901",
  name: "Acme Corp",
  email: "billing@acme.com",
  ownerId: mockUser.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const VENDOR_ID = mockVendorRow.id;

function makeRequest(body: unknown, id = VENDOR_ID) {
  return new NextRequest(`http://localhost/api/vendors/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(id = VENDOR_ID) {
  return { params: Promise.resolve({ id }) };
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

const updatedRow = { ...mockVendorRow, name: "New Name" };

function makeMockTx() {
  return {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedRow]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    query: {
      vendorPaymentMethods: {
        findMany: vi.fn().mockResolvedValue([{ method: "ach" }]),
      },
    },
  };
}

function mockDb({ vendor = mockVendorRow }: { vendor?: typeof mockVendorRow | null } = {}) {
  const mocked = db as unknown as MockDb;
  mocked.query = {
    vendors: { findFirst: vi.fn().mockResolvedValue(vendor) },
  };
  mocked.transaction = vi.fn().mockImplementation(async (fn) => fn(makeMockTx()));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isValidUuid).mockReturnValue(true);
});

describe("PATCH /api/vendors/:id", () => {
  describe("authentication", () => {
    it("returns 401 when unauthenticated", async () => {
      mockAuth(false);

      const res = await PATCH(makeRequest({ name: "New Name" }), makeParams());
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("param validation", () => {
    it("returns 422 for invalid UUID param", async () => {
      mockAuth();
      vi.mocked(isValidUuid).mockReturnValue(false);

      const res = await PATCH(
        makeRequest({ name: "New Name" }, "not-a-uuid"),
        makeParams("not-a-uuid")
      );
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body.error).toBe("Invalid vendor id");
    });
  });

  describe("business logic", () => {
    it("returns 404 when vendor not found", async () => {
      mockAuth();
      mockDb({ vendor: null });

      const res = await PATCH(makeRequest({ name: "New Name" }), makeParams());
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe("Vendor not found");
    });

    it("returns 403 when vendor is global (ownerId null)", async () => {
      mockAuth();
      mockDb({ vendor: { ...mockVendorRow, ownerId: null } });

      const res = await PATCH(makeRequest({ name: "New Name" }), makeParams());
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.error).toBe("Cannot edit a global vendor");
    });

    it("returns 404 when vendor belongs to another user", async () => {
      mockAuth();
      mockDb({ vendor: { ...mockVendorRow, ownerId: "other-user-id" } });

      const res = await PATCH(makeRequest({ name: "New Name" }), makeParams());
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe("Vendor not found");
    });
  });

  describe("request validation", () => {
    it("returns 400 for invalid JSON body", async () => {
      mockAuth();

      const req = new NextRequest(`http://localhost/api/vendors/${VENDOR_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      });
      const res = await PATCH(req, makeParams());
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Invalid JSON body");
    });

    it("returns 422 for empty body", async () => {
      mockAuth();
      mockDb();

      const res = await PATCH(makeRequest({}), makeParams());
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body.error).toBe("At least one field required");
    });
  });

  describe("happy path", () => {
    it("returns 200 with updated vendor when updating name", async () => {
      mockAuth();
      mockDb();

      const res = await PATCH(makeRequest({ name: "New Name" }), makeParams());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toMatchObject({
        id: VENDOR_ID,
        name: "New Name",
      });
    });

    it("returns 200 with updated paymentMethods", async () => {
      mockAuth();
      mockDb();

      const res = await PATCH(
        makeRequest({ name: "New Name", paymentMethods: ["ach"] }),
        makeParams()
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.paymentMethods).toEqual(["ach"]);
    });
  });

  describe("error handling", () => {
    it("returns 500 when db.transaction throws", async () => {
      mockAuth();
      mockDb();
      const mocked = db as unknown as MockDb;
      mocked.transaction = vi.fn().mockRejectedValue(new Error("DB failure"));

      const res = await PATCH(makeRequest({ name: "New Name" }), makeParams());
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
