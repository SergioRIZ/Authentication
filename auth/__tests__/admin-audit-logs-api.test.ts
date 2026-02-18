import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const { mockAuth, mockPrismaUser, mockAuditLog } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrismaUser: {
    findUnique: vi.fn(),
  },
  mockAuditLog: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: mockPrismaUser,
    auditLog: mockAuditLog,
  },
}));

import { GET } from "@/app/api/admin/audit-logs/route";

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/admin/audit-logs");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

const ADMIN = { role: "ADMIN" };
const REGULAR_USER = { role: "USER" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/audit-logs", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("should return 403 for regular users", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(REGULAR_USER);

    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("should return audit logs for admin", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN);
    mockAuditLog.findMany.mockResolvedValue([
      { id: "log-1", action: "LOGIN_SUCCESS", user: { email: "user@test.com" } },
    ]);
    mockAuditLog.count.mockResolvedValue(1);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.logs).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("should support pagination parameters", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN);
    mockAuditLog.findMany.mockResolvedValue([]);
    mockAuditLog.count.mockResolvedValue(100);

    const res = await GET(makeRequest({ page: "2", limit: "10" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.limit).toBe(10);
    expect(body.pagination.totalPages).toBe(10);
  });

  it("should filter by action", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN);
    mockAuditLog.findMany.mockResolvedValue([]);
    mockAuditLog.count.mockResolvedValue(0);

    await GET(makeRequest({ action: "LOGIN_SUCCESS" }));

    const findCall = mockAuditLog.findMany.mock.calls[0][0];
    expect(findCall.where.action).toBe("LOGIN_SUCCESS");
  });

  it("should filter by userId", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN);
    mockAuditLog.findMany.mockResolvedValue([]);
    mockAuditLog.count.mockResolvedValue(0);

    await GET(makeRequest({ userId: "user-123" }));

    const findCall = mockAuditLog.findMany.mock.calls[0][0];
    expect(findCall.where.userId).toBe("user-123");
  });

  it("should cap limit at 100", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN);
    mockAuditLog.findMany.mockResolvedValue([]);
    mockAuditLog.count.mockResolvedValue(0);

    await GET(makeRequest({ limit: "500" }));

    const findCall = mockAuditLog.findMany.mock.calls[0][0];
    expect(findCall.take).toBe(100);
  });
});
