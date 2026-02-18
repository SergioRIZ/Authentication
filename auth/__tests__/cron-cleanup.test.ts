import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const { mockEmailToken, mockPasswordToken } = vi.hoisted(() => ({
  mockEmailToken: {
    deleteMany: vi.fn(),
  },
  mockPasswordToken: {
    deleteMany: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailVerificationToken: mockEmailToken,
    passwordResetToken: mockPasswordToken,
  },
}));

import { POST } from "@/app/api/cron/cleanup-tokens/route";

function makeRequest(secret?: string): Request {
  const headers: Record<string, string> = {};
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new Request("http://localhost/api/cron/cleanup-tokens", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
});

describe("POST /api/cron/cleanup-tokens", () => {
  it("should return 401 if no authorization header", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("should return 401 if wrong secret", async () => {
    const res = await POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("should return 401 if CRON_SECRET is not set", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const res = await POST(makeRequest("any-secret"));
    expect(res.status).toBe(401);
  });

  it("should delete expired tokens with valid secret", async () => {
    mockEmailToken.deleteMany.mockResolvedValue({ count: 3 });
    mockPasswordToken.deleteMany.mockResolvedValue({ count: 1 });

    const res = await POST(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.deleted.emailVerificationTokens).toBe(3);
    expect(body.deleted.passwordResetTokens).toBe(1);
  });

  it("should query for tokens expired before now", async () => {
    mockEmailToken.deleteMany.mockResolvedValue({ count: 0 });
    mockPasswordToken.deleteMany.mockResolvedValue({ count: 0 });

    const beforeCall = new Date();
    await POST(makeRequest("test-cron-secret"));

    const emailQuery = mockEmailToken.deleteMany.mock.calls[0][0];
    const passwordQuery = mockPasswordToken.deleteMany.mock.calls[0][0];

    // expiresAt should be less than "now"
    expect(emailQuery.where.expiresAt.lt).toBeInstanceOf(Date);
    expect(passwordQuery.where.expiresAt.lt).toBeInstanceOf(Date);
    expect(emailQuery.where.expiresAt.lt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
  });

  it("should handle zero expired tokens", async () => {
    mockEmailToken.deleteMany.mockResolvedValue({ count: 0 });
    mockPasswordToken.deleteMany.mockResolvedValue({ count: 0 });

    const res = await POST(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.deleted.emailVerificationTokens).toBe(0);
    expect(body.deleted.passwordResetTokens).toBe(0);
  });
});
