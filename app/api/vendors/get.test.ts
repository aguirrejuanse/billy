import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/auth");
vi.mock("@/db");
vi.mock("@/db/filters");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";

type MockDb = {
  query: { vendors: { findMany: ReturnType<typeof vi.fn> } };
};

const mockUser = {
  id: "a1b2c3d4-e5f6-4789-ab12-cd34ef567890",
  clerkId: "clerk_123",
  name: "Test User",
  email: "test@test.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockVendorRows = [
  {
    id: "b2c3d4e5-f6a7-4890-bc23-de45fa678901",
    name: "Acme Corp",
    email: "billing@acme.com",
    ownerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    paymentMethods: [{ method: "ach" }, { method: "wire" }],
  },
];

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

function mockDbFindMany(rows = mockVendorRows) {
  const mocked = db as unknown as MockDb;
  mocked.query = {
    vendors: { findMany: vi.fn().mockResolvedValue(rows) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/vendors", () => {
  describe("authentication", () => {
    it("returns 401 when unauthenticated", async () => {
      mockAuth(false);

      const res = await GET();
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("happy path", () => {
    it("returns 200 with vendors and mapped paymentMethods", async () => {
      mockAuth();
      mockDbFindMany();

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        id: mockVendorRows[0].id,
        name: "Acme Corp",
        email: "billing@acme.com",
        paymentMethods: ["ach", "wire"],
      });
    });

    it("returns 200 with empty array when no vendors", async () => {
      mockAuth();
      mockDbFindMany([]);

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("returns 500 when db throws", async () => {
      mockAuth();

      const mocked = db as unknown as MockDb;
      mocked.query = {
        vendors: { findMany: vi.fn().mockRejectedValue(new Error("DB failure")) },
      };

      const res = await GET();
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
