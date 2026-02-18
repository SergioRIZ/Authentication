import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const { mockAuth, mockPrismaUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrismaUser: {
    findUnique: vi.fn(),
    update: vi.fn(),
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

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(),
  getAuditIp: vi.fn(() => "127.0.0.1"),
  getAuditUserAgent: vi.fn(() => "test-agent"),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetInSeconds: 900 }),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue("$2a$12$newhash"),
  },
}));

import { POST } from "@/app/api/change-password/route";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 4, resetInSeconds: 900 });
});

describe("POST /api/change-password", () => {
  it("should return 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetInSeconds: 600 });

    const res = await POST(makeRequest({
      currentPassword: "OldPass1!",
      newPassword: "NewSecure1!",
      confirmPassword: "NewSecure1!",
    }));

    expect(res.status).toBe(429);
  });

  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({
      currentPassword: "OldPass1!",
      newPassword: "NewSecure1!",
      confirmPassword: "NewSecure1!",
    }));

    expect(res.status).toBe(401);
  });

  it("should return 404 if user not found", async () => {
    mockAuth.mockResolvedValue({ user: { email: "ghost@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({
      currentPassword: "OldPass1!",
      newPassword: "NewSecure1!",
      confirmPassword: "NewSecure1!",
    }));

    expect(res.status).toBe(404);
  });

  it("should return 400 if user has no password (Google OAuth)", async () => {
    mockAuth.mockResolvedValue({ user: { email: "google@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue({ id: "user-1", password: null });

    const res = await POST(makeRequest({
      currentPassword: "OldPass1!",
      newPassword: "NewSecure1!",
      confirmPassword: "NewSecure1!",
    }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Google");
  });

  it("should return 400 if current password is incorrect", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue({ id: "user-1", password: "$2a$12$oldhash" });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const res = await POST(makeRequest({
      currentPassword: "WrongPass1!",
      newPassword: "NewSecure1!",
      confirmPassword: "NewSecure1!",
    }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("contraseña actual");
  });

  it("should return 400 if passwords don't match", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });

    const res = await POST(makeRequest({
      currentPassword: "OldPass1!",
      newPassword: "NewSecure1!",
      confirmPassword: "Different1!",
    }));

    expect(res.status).toBe(400);
  });

  it("should return 400 if new password is weak", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });

    const res = await POST(makeRequest({
      currentPassword: "OldPass1!",
      newPassword: "weak",
      confirmPassword: "weak",
    }));

    expect(res.status).toBe(400);
  });

  it("should successfully change password with valid data", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue({ id: "user-1", password: "$2a$12$oldhash" });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    mockPrismaUser.update.mockResolvedValue({});

    const res = await POST(makeRequest({
      currentPassword: "OldPass1!",
      newPassword: "NewSecure1!",
      confirmPassword: "NewSecure1!",
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("actualizada");
    expect(mockPrismaUser.update).toHaveBeenCalled();
  });
});
