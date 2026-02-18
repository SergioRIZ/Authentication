import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const { mockAuth, mockPrismaUser, mockPrismaToken } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrismaUser: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockPrismaToken: {
    deleteMany: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
  invalidateRoleCache: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: mockPrismaUser,
    emailVerificationToken: mockPrismaToken,
  },
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(),
  getAuditIp: vi.fn(() => "127.0.0.1"),
  getAuditUserAgent: vi.fn(() => "test-agent"),
}));

import { GET, PATCH, PUT, DELETE } from "@/app/api/admin/users/route";

function makePatchRequest(body: object): Request {
  return new Request("http://localhost/api/admin/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePutRequest(body: object): Request {
  return new Request("http://localhost/api/admin/users", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(userId: string): Request {
  return new Request(`http://localhost/api/admin/users?userId=${userId}`, {
    method: "DELETE",
  });
}

const ADMIN = { id: "admin-1", role: "ADMIN" };
const SUPER_ADMIN = { id: "super-1", role: "SUPER_ADMIN" };
const REGULAR_USER = { id: "user-1", role: "USER" };

beforeEach(() => {
  vi.clearAllMocks();
});

// --- GET ---

describe("GET /api/admin/users", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("should return 403 for regular users", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(REGULAR_USER);

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("should return user list for admin", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN);
    mockPrismaUser.findMany.mockResolvedValue([
      { id: "1", email: "a@test.com", role: "USER" },
      { id: "2", email: "b@test.com", role: "ADMIN" },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.users).toHaveLength(2);
    expect(body.currentUserRole).toBe("ADMIN");
  });
});

// --- PATCH (role change) ---

describe("PATCH /api/admin/users - Role change", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PATCH(makePatchRequest({ userId: "user-1", role: "ADMIN" }));
    expect(res.status).toBe(401);
  });

  it("should return 403 for regular users", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(REGULAR_USER);

    const res = await PATCH(makePatchRequest({ userId: "user-2", role: "ADMIN" }));
    expect(res.status).toBe(403);
  });

  it("should return 400 if admin tries to modify own role", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(ADMIN) // current user
      .mockResolvedValueOnce({ role: "ADMIN", email: "admin@test.com" }); // target

    const res = await PATCH(makePatchRequest({ userId: "admin-1", role: "USER" }));
    expect(res.status).toBe(400);
  });

  it("should return 403 if ADMIN tries to modify another ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(ADMIN) // current user
      .mockResolvedValueOnce({ role: "ADMIN", email: "admin2@test.com" }); // target

    const res = await PATCH(makePatchRequest({ userId: "admin-2", role: "USER" }));
    expect(res.status).toBe(403);
  });

  it("should return 403 if ADMIN tries to assign ADMIN role", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(ADMIN)
      .mockResolvedValueOnce({ role: "USER", email: "user@test.com" });

    const res = await PATCH(makePatchRequest({ userId: "user-1", role: "ADMIN" }));
    expect(res.status).toBe(403);
  });

  it("should allow SUPER_ADMIN to change any user role", async () => {
    mockAuth.mockResolvedValue({ user: { email: "super@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(SUPER_ADMIN)
      .mockResolvedValueOnce({ role: "USER", email: "user@test.com" });
    mockPrismaUser.update.mockResolvedValue({
      id: "user-1",
      email: "user@test.com",
      name: "User",
      role: "ADMIN",
    });

    const res = await PATCH(makePatchRequest({ userId: "user-1", role: "ADMIN" }));
    expect(res.status).toBe(200);
  });

  it("should return 404 if target user not found", async () => {
    mockAuth.mockResolvedValue({ user: { email: "super@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(SUPER_ADMIN)
      .mockResolvedValueOnce(null);

    const res = await PATCH(makePatchRequest({ userId: "nonexistent", role: "ADMIN" }));
    expect(res.status).toBe(404);
  });
});

// --- PUT (verify user) ---

describe("PUT /api/admin/users - Verify user", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makePutRequest({ userId: "user-1" }));
    expect(res.status).toBe(401);
  });

  it("should return 403 for regular users", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(REGULAR_USER);

    const res = await PUT(makePutRequest({ userId: "user-2" }));
    expect(res.status).toBe(403);
  });

  it("should return 404 if target user not found", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(ADMIN)
      .mockResolvedValueOnce(null);

    const res = await PUT(makePutRequest({ userId: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("should return 400 if user is already verified", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(ADMIN)
      .mockResolvedValueOnce({ email: "user@test.com", emailVerified: new Date() });

    const res = await PUT(makePutRequest({ userId: "user-1" }));
    expect(res.status).toBe(400);
  });

  it("should successfully verify unverified user", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(ADMIN)
      .mockResolvedValueOnce({ email: "user@test.com", emailVerified: null });
    mockPrismaUser.update.mockResolvedValue({
      id: "user-1",
      email: "user@test.com",
      name: "User",
      emailVerified: new Date(),
    });
    mockPrismaToken.deleteMany.mockResolvedValue({ count: 1 });

    const res = await PUT(makePutRequest({ userId: "user-1" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.message).toContain("verificado");
  });
});

// --- DELETE ---

describe("DELETE /api/admin/users", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("user-1"));
    expect(res.status).toBe(401);
  });

  it("should return 403 for regular users", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(REGULAR_USER);

    const res = await DELETE(makeDeleteRequest("user-2"));
    expect(res.status).toBe(403);
  });

  it("should return 400 if admin tries to delete themselves", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN);

    const res = await DELETE(makeDeleteRequest("admin-1"));
    expect(res.status).toBe(400);
  });

  it("should return 400 if no userId provided", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN);

    const res = await DELETE(
      new Request("http://localhost/api/admin/users", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
  });

  it("should return 404 if target user not found", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(ADMIN)
      .mockResolvedValueOnce(null);

    const res = await DELETE(makeDeleteRequest("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("should return 403 if ADMIN tries to delete another ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(ADMIN)
      .mockResolvedValueOnce({ role: "ADMIN", email: "admin2@test.com" });

    const res = await DELETE(makeDeleteRequest("admin-2"));
    expect(res.status).toBe(403);
  });

  it("should allow ADMIN to delete regular user", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(ADMIN)
      .mockResolvedValueOnce({ role: "USER", email: "user@test.com" });
    mockPrismaUser.delete.mockResolvedValue({});

    const res = await DELETE(makeDeleteRequest("user-1"));
    expect(res.status).toBe(200);
  });

  it("should allow SUPER_ADMIN to delete ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: { email: "super@test.com" } });
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(SUPER_ADMIN)
      .mockResolvedValueOnce({ role: "ADMIN", email: "admin@test.com" });
    mockPrismaUser.delete.mockResolvedValue({});

    const res = await DELETE(makeDeleteRequest("admin-1"));
    expect(res.status).toBe(200);
  });
});
