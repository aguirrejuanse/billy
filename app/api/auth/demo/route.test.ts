import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ set: mockSet }),
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/demo", () => {
  it("returns 503 when DEMO_CLERK_ID is not configured", async () => {
    const original = process.env.DEMO_CLERK_ID;
    delete process.env.DEMO_CLERK_ID;

    const res = await POST();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("Demo not configured");

    process.env.DEMO_CLERK_ID = original;
  });

  it("sets demo-session cookie and returns 204 when configured", async () => {
    process.env.DEMO_CLERK_ID = "user_demo123";

    const res = await POST();
    expect(res.status).toBe(204);

    expect(mockSet).toHaveBeenCalledWith(
      "demo-session",
      "true",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });
});
