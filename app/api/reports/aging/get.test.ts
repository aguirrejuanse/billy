import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "./get";

vi.mock("@/lib/auth");
vi.mock("@/db");

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";

type MockDb = { select: ReturnType<typeof vi.fn> };

const mockUser = {
  id: "a1b2c3d4-e5f6-4789-ab12-cd34ef567890",
  clerkId: "clerk_123",
  name: "Test User",
  email: "test@test.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockVendorA = { id: "b2c3d4e5-f6a7-4890-bc23-de45fa678901", name: "Acme Corp" };
const mockVendorB = { id: "c3d4e5f6-a7b8-4901-cd34-ef5678901234", name: "Zeta LLC" };

function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeRow(
  overrides: Partial<{ dueDate: string; amount: string; vendorId: string; vendorName: string }> = {}
) {
  return {
    dueDate: daysAgo(0),
    amount: "100.00",
    vendorId: mockVendorA.id,
    vendorName: mockVendorA.name,
    ...overrides,
  };
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

function mockDbSelect(rows = [makeRow()], shouldReject = false) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: shouldReject
      ? vi.fn().mockRejectedValue(new Error("DB failure"))
      : vi.fn().mockResolvedValue(rows),
  };
  (db as unknown as MockDb).select = vi.fn().mockReturnValue(chain);
}

const makeRequest = () => new NextRequest(new URL("http://localhost/api/reports/aging"));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/reports/aging", () => {
  describe("authentication", () => {
    it("returns 401 when unauthenticated", async () => {
      mockAuth(false);

      const res = await GET(makeRequest());
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("happy path — response shape", () => {
    it("returns 200 with data.rows and data.summary", async () => {
      mockAuth();
      mockDbSelect([makeRow({ amount: "200.00" })]);

      const res = await GET(makeRequest());
      expect(res.status).toBe(200);

      const { data } = await res.json();
      expect(data).toHaveProperty("rows");
      expect(data).toHaveProperty("summary");
      expect(data.rows).toHaveLength(1);
      expect(data.summary).toMatchObject({
        totalOutstanding: expect.any(Number),
        totalOverdue: expect.any(Number),
        overdueBillCount: expect.any(Number),
      });
    });

    it("returns empty rows and zero summary when no open bills exist", async () => {
      mockAuth();
      mockDbSelect([]);

      const res = await GET(makeRequest());
      expect(res.status).toBe(200);

      const { data } = await res.json();
      expect(data.rows).toEqual([]);
      expect(data.summary).toEqual({ totalOutstanding: 0, totalOverdue: 0, overdueBillCount: 0 });
    });
  });

  describe("bucketing logic", () => {
    it.each([
      [0, "current", null],
      [1, "days1_30", "current"],
      [30, "days1_30", null],
      [31, "days31_60", "days1_30"],
      [60, "days31_60", null],
      [61, "days61_90", "days31_60"],
      [90, "days61_90", null],
      [91, "days90plus", "days61_90"],
    ] as const)("buckets a bill due %i days ago as %s", async (n, bucket, zeroBucket) => {
      mockAuth();
      mockDbSelect([makeRow({ dueDate: daysAgo(n) })]);

      const { data } = await (await GET(makeRequest())).json();
      expect(data.rows[0][bucket]).toBe(100);
      if (zeroBucket) expect(data.rows[0][zeroBucket]).toBe(0);
    });
  });

  describe("aggregation", () => {
    it("accumulates multiple bills from the same vendor into one row", async () => {
      mockAuth();
      mockDbSelect([makeRow(), makeRow({ amount: "200.00", dueDate: daysAgo(45) })]);

      const { data } = await (await GET(makeRequest())).json();
      expect(data.rows).toHaveLength(1);
      expect(data.rows[0].total).toBe(300);
      expect(data.rows[0].current).toBe(100);
      expect(data.rows[0].days31_60).toBe(200);
    });

    it("creates separate rows for different vendors", async () => {
      mockAuth();
      mockDbSelect([
        makeRow({ vendorId: mockVendorA.id, vendorName: mockVendorA.name }),
        makeRow({ vendorId: mockVendorB.id, vendorName: mockVendorB.name, amount: "200.00" }),
      ]);

      const { data } = await (await GET(makeRequest())).json();
      expect(data.rows).toHaveLength(2);
    });

    it("sorts rows alphabetically by vendorName", async () => {
      mockAuth();
      mockDbSelect([
        makeRow({ vendorId: mockVendorB.id, vendorName: mockVendorB.name }),
        makeRow({ vendorId: mockVendorA.id, vendorName: mockVendorA.name }),
      ]);

      const { data } = await (await GET(makeRequest())).json();
      expect(data.rows[0].vendorName).toBe("Acme Corp");
      expect(data.rows[1].vendorName).toBe("Zeta LLC");
    });
  });

  describe("summary calculation", () => {
    it("totalOutstanding equals sum of all row totals", async () => {
      mockAuth();
      mockDbSelect([
        makeRow({ vendorId: mockVendorA.id, vendorName: mockVendorA.name, amount: "100.00" }),
        makeRow({ vendorId: mockVendorB.id, vendorName: mockVendorB.name, amount: "250.00" }),
      ]);

      const { data } = await (await GET(makeRequest())).json();
      expect(data.summary.totalOutstanding).toBe(350);
    });

    it("totalOverdue excludes the current bucket", async () => {
      mockAuth();
      mockDbSelect([makeRow(), makeRow({ dueDate: daysAgo(15), amount: "200.00" })]);

      const { data } = await (await GET(makeRequest())).json();
      expect(data.summary.totalOutstanding).toBe(300);
      expect(data.summary.totalOverdue).toBe(200);
    });

    it("overdueBillCount counts only bills with days > 0", async () => {
      mockAuth();
      mockDbSelect([
        makeRow({ dueDate: daysAgo(0) }),
        makeRow({ dueDate: daysAgo(5) }),
        makeRow({ dueDate: daysAgo(40) }),
      ]);

      const { data } = await (await GET(makeRequest())).json();
      expect(data.summary.overdueBillCount).toBe(2);
    });

    it("totalOutstanding is always >= totalOverdue", async () => {
      mockAuth();
      mockDbSelect([
        makeRow({ amount: "500.00" }),
        makeRow({ dueDate: daysAgo(10), amount: "100.00" }),
      ]);

      const { data } = await (await GET(makeRequest())).json();
      expect(data.summary.totalOutstanding).toBeGreaterThanOrEqual(data.summary.totalOverdue);
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
