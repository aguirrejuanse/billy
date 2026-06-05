import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server");
vi.mock("@/db");
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
import { db } from "@/db";
import { getAuthenticatedUser } from "./auth";

type FindFirstFn = ReturnType<typeof vi.fn>;
type InsertFn = ReturnType<typeof vi.fn>;

type MockDb = {
  query: { users: { findFirst: FindFirstFn } };
  insert: InsertFn;
};

const mockUser = {
  id: "a1b2c3d4-e5f6-4789-ab12-cd34ef567890",
  clerkId: "clerk_123",
  name: "Juan Aguirre",
  email: "juan@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockClerkUser = {
  firstName: "Juan",
  lastName: "Aguirre",
  emailAddresses: [{ emailAddress: "juan@example.com" }],
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function mockCookies(demoSession: boolean) {
  vi.mocked(cookies).mockResolvedValue({
    get: vi
      .fn()
      .mockImplementation((name: string) =>
        name === "demo-session" ? { value: demoSession ? "true" : "false" } : undefined
      ),
  } as unknown as CookieStore);
}

function mockAuthSession(clerkId: string | null = "clerk_123") {
  vi.mocked(auth).mockResolvedValue({ userId: clerkId } as ReturnType<typeof auth> extends Promise<
    infer T
  >
    ? T
    : never);
}

function mockDbFindFirst(user: typeof mockUser | null) {
  const mocked = db as unknown as MockDb;
  mocked.query = { users: { findFirst: vi.fn().mockResolvedValue(user) } };
}

function mockDbInsert(returning: typeof mockUser | null) {
  const mocked = db as unknown as MockDb;
  mocked.insert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(returning ? [returning] : []),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCookies(false);
});

describe("getAuthenticatedUser", () => {
  describe("no Clerk session", () => {
    it("returns 401 when clerkId is null", async () => {
      mockAuthSession(null);
      const findFirstSpy = vi.fn();
      (db as unknown as MockDb).query = { users: { findFirst: findFirstSpy } };

      const result = await getAuthenticatedUser();

      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(401);
      const body = await result.error!.json();
      expect(body.error).toBe("Unauthorized");
      expect(findFirstSpy).not.toHaveBeenCalled();
    });
  });

  describe("existing user in DB", () => {
    it("returns user when found by clerkId", async () => {
      mockAuthSession();
      mockDbFindFirst(mockUser);

      const result = await getAuthenticatedUser();

      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
    });

    it("does not call currentUser or insert when user exists", async () => {
      mockAuthSession();
      mockDbFindFirst(mockUser);
      const insertSpy = vi.fn();
      (db as unknown as MockDb).insert = insertSpy;

      await getAuthenticatedUser();

      expect(currentUser).not.toHaveBeenCalled();
      expect(insertSpy).not.toHaveBeenCalled();
    });
  });

  describe("new user — upsert flow", () => {
    it("creates user on first login and returns it", async () => {
      mockAuthSession();
      mockDbFindFirst(null);
      vi.mocked(currentUser).mockResolvedValue(mockClerkUser as ClerkUser);
      mockDbInsert(mockUser);

      const result = await getAuthenticatedUser();

      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
    });

    it("builds name from firstName + lastName", async () => {
      mockAuthSession();
      mockDbFindFirst(null);
      vi.mocked(currentUser).mockResolvedValue({
        firstName: "Maria",
        lastName: "Lopez",
        emailAddresses: [{ emailAddress: "maria@example.com" }],
      } as ClerkUser);

      const insertedUser = { ...mockUser, name: "Maria Lopez", email: "maria@example.com" };
      mockDbInsert(insertedUser);

      const result = await getAuthenticatedUser();

      expect(result.user?.name).toBe("Maria Lopez");
    });

    it("falls back to email as name when firstName and lastName are empty", async () => {
      mockAuthSession();
      mockDbFindFirst(null);
      vi.mocked(currentUser).mockResolvedValue({
        firstName: null,
        lastName: null,
        emailAddresses: [{ emailAddress: "noname@example.com" }],
      } as ClerkUser);

      const insertedUser = { ...mockUser, name: "noname@example.com", email: "noname@example.com" };
      mockDbInsert(insertedUser);

      const result = await getAuthenticatedUser();

      expect(result.user?.name).toBe("noname@example.com");
    });

    it("returns 401 when currentUser() returns null (session expired mid-request)", async () => {
      mockAuthSession();
      mockDbFindFirst(null);
      vi.mocked(currentUser).mockResolvedValue(null);

      const result = await getAuthenticatedUser();

      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(401);
    });

    it("refetches from DB when insert returns nothing (race condition)", async () => {
      mockAuthSession();

      const mocked = db as unknown as MockDb;
      // first findFirst: miss; second findFirst: hit (race condition winner already inserted)
      const findFirst = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);
      mocked.query = { users: { findFirst } };

      vi.mocked(currentUser).mockResolvedValue(mockClerkUser as ClerkUser);
      mockDbInsert(null); // onConflictDoNothing returns []

      const result = await getAuthenticatedUser();

      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
      expect(findFirst).toHaveBeenCalledTimes(2);
    });

    it("returns 404 when insert returns nothing and refetch also misses", async () => {
      mockAuthSession();
      mockDbFindFirst(null);
      vi.mocked(currentUser).mockResolvedValue(mockClerkUser as ClerkUser);
      mockDbInsert(null);

      const result = await getAuthenticatedUser();

      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(404);
    });
  });

  describe("demo session", () => {
    const DEMO_CLERK_ID = "user_demo123";

    beforeEach(() => {
      process.env.DEMO_CLERK_ID = DEMO_CLERK_ID;
      mockCookies(true);
    });

    it("uses DEMO_CLERK_ID from env instead of calling auth()", async () => {
      mockDbFindFirst(mockUser);

      await getAuthenticatedUser();

      expect(auth).not.toHaveBeenCalled();
    });

    it("returns user found by DEMO_CLERK_ID", async () => {
      mockDbFindFirst(mockUser);

      const result = await getAuthenticatedUser();

      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
    });

    it("returns 401 when DEMO_CLERK_ID env var is missing", async () => {
      delete process.env.DEMO_CLERK_ID;
      mockAuthSession(null);

      const result = await getAuthenticatedUser();

      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(401);
    });

    it("returns 404 when demo user is not in DB", async () => {
      mockDbFindFirst(null);
      vi.mocked(currentUser).mockResolvedValue(null);

      const result = await getAuthenticatedUser();

      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(401);
    });
  });
});
