import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/auth");
vi.mock("@/db");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";

type MockDb = {
  query: { vendors: { findFirst: ReturnType<typeof vi.fn> } };
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

const mockVendorRow = {
  id: "b2c3d4e5-f6a7-4890-bc23-de45fa678901",
  name: "Acme Corp",
  email: "billing@acme.com",
  ownerId: mockUser.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validBody = {
  name: "Acme Corp",
  email: "billing@acme.com",
  paymentMethods: ["ach"],
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vendors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeRawRequest(rawBody: string) {
  return new NextRequest("http://localhost/api/vendors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody,
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

function makeMockTx() {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockVendorRow]),
      }),
    }),
  };
}

function mockDb({ existing = null }: { existing?: typeof mockVendorRow | null } = {}) {
  const mocked = db as unknown as MockDb;
  mocked.query = {
    vendors: { findFirst: vi.fn().mockResolvedValue(existing) },
  };
  mocked.transaction = vi.fn().mockImplementation(async (fn) => fn(makeMockTx()));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/vendors", () => {
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
      const res = await POST(makeRawRequest("not-json{{{"));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Invalid JSON body");
    });

    it("returns 422 for missing name", async () => {
      mockAuth();
      mockDb();

      const res = await POST(makeRequest({ email: "billing@acme.com", paymentMethods: ["ach"] }));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(typeof body.error).toBe("string");
    });

    it("returns 422 for missing paymentMethods", async () => {
      mockAuth();
      mockDb();

      const res = await POST(makeRequest({ name: "Acme Corp", email: "billing@acme.com" }));
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(typeof body.error).toBe("string");
    });
  });

  describe("business logic", () => {
    it("returns 409 when vendor name already exists for this user", async () => {
      mockAuth();
      mockDb({ existing: mockVendorRow });

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.error).toBe("Vendor name already exists");
    });

    it("returns 201 with created vendor including paymentMethods", async () => {
      mockAuth();
      mockDb();

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.data).toMatchObject({
        id: mockVendorRow.id,
        name: mockVendorRow.name,
        email: mockVendorRow.email,
        ownerId: mockUser.id,
        paymentMethods: ["ach"],
      });
    });

    it("returns 500 when db.transaction throws", async () => {
      mockAuth();

      const mocked = db as unknown as MockDb;
      mocked.query = {
        vendors: { findFirst: vi.fn().mockResolvedValue(null) },
      };
      mocked.transaction = vi.fn().mockRejectedValue(new Error("DB failure"));

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
