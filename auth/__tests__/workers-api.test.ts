import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRequest = () => new NextRequest("http://localhost/api/workers");

// --- Mocks ---

const { mockAuth, mockPrismaUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrismaUser: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: mockPrismaUser,
  },
}));

import { GET } from "@/app/api/workers/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/workers", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(mockRequest());
    expect(res.status).toBe(401);
  });

  it("should return 404 if user not found in DB", async () => {
    mockAuth.mockResolvedValue({ user: { email: "ghost@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const res = await GET(mockRequest());
    expect(res.status).toBe(404);
  });

  it("should return workers for regular USER (only USER role)", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue({ id: "user-1", role: "USER" });
    mockPrismaUser.findMany.mockResolvedValue([
      { id: "w1", name: "Worker 1", email: "w1@test.com", role: "USER" },
    ]);

    const res = await GET(mockRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.workers).toHaveLength(1);

    // Check the query used allowed roles = ["USER"] and no self-inclusion
    const queryArg = mockPrismaUser.findMany.mock.calls[0][0];
    expect(queryArg.where.OR).toEqual([{ role: { in: ["USER"] } }]);
  });

  it("should return workers for ADMIN (USER role + self)", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    mockPrismaUser.findMany.mockResolvedValue([
      { id: "w1", name: "Worker 1", email: "w1@test.com", role: "USER" },
      { id: "admin-1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
    ]);

    const res = await GET(mockRequest());
    expect(res.status).toBe(200);

    // Should include self-assignment option
    const queryArg = mockPrismaUser.findMany.mock.calls[0][0];
    const orConditions = queryArg.where.OR;
    expect(orConditions).toContainEqual({ role: { in: ["USER"] } });
    expect(orConditions).toContainEqual({ id: "admin-1" });
  });

  it("should return workers for SUPER_ADMIN (USER + ADMIN roles + self)", async () => {
    mockAuth.mockResolvedValue({ user: { email: "super@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue({ id: "super-1", role: "SUPER_ADMIN" });
    mockPrismaUser.findMany.mockResolvedValue([]);

    const res = await GET(mockRequest());
    expect(res.status).toBe(200);

    const queryArg = mockPrismaUser.findMany.mock.calls[0][0];
    const orConditions = queryArg.where.OR;
    expect(orConditions).toContainEqual({ role: { in: ["USER", "ADMIN"] } });
    expect(orConditions).toContainEqual({ id: "super-1" });
  });

  it("should only return verified users", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue({ id: "user-1", role: "USER" });
    mockPrismaUser.findMany.mockResolvedValue([]);

    await GET(mockRequest());

    const queryArg = mockPrismaUser.findMany.mock.calls[0][0];
    expect(queryArg.where.emailVerified).toEqual({ not: null });
  });
});
