import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const { mockPrismaUser, mockPrismaToken } = vi.hoisted(() => ({
  mockPrismaUser: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  mockPrismaToken: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: mockPrismaUser,
    emailVerificationToken: mockPrismaToken,
  },
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/email-validation", () => ({
  validateEmailForRegistration: vi.fn().mockResolvedValue({ valid: true }),
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
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
  },
}));

import { POST } from "@/app/api/register/route";
import { validateEmailForRegistration } from "@/lib/email-validation";
import { rateLimit } from "@/lib/rate-limit";

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 4, resetInSeconds: 900 });
  vi.mocked(validateEmailForRegistration).mockResolvedValue({ valid: true });
});

describe("POST /api/register", () => {
  it("should return 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetInSeconds: 600 });

    const res = await POST(makeRequest({
      email: "test@example.com",
      password: "SecurePass1!",
    }));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("600");
  });

  it("should return 400 for invalid input (Zod validation)", async () => {
    const res = await POST(makeRequest({
      email: "not-an-email",
      password: "weak",
    }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Datos inválidos");
  });

  it("should return 400 for disposable email", async () => {
    vi.mocked(validateEmailForRegistration).mockResolvedValue({
      valid: false,
      reason: "Dominio de email no permitido",
    });

    const res = await POST(makeRequest({
      email: "test@mailinator.com",
      password: "SecurePass1!",
    }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Dominio de email no permitido");
  });

  it("should return 400 if user already exists", async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ id: "existing" });

    const res = await POST(makeRequest({
      email: "existing@example.com",
      password: "SecurePass1!",
    }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("El usuario ya existe");
  });

  it("should create user successfully with valid data", async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue({
      id: "new-user",
      email: "new@example.com",
      name: "New User",
    });
    mockPrismaToken.create.mockResolvedValue({});

    const res = await POST(makeRequest({
      email: "New@Example.com",
      password: "SecurePass1!",
      name: "New User",
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe("new@example.com");
  });

  it("should normalize email to lowercase", async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue({
      id: "new-user",
      email: "new@example.com",
      name: null,
    });
    mockPrismaToken.create.mockResolvedValue({});

    const res = await POST(makeRequest({
      email: "NEW@EXAMPLE.COM",
      password: "SecurePass1!",
    }));

    expect(res.status).toBe(201);
    // Verify the findUnique was called with normalized email
    const findCall = mockPrismaUser.findUnique.mock.calls[0][0];
    expect(findCall.where.email).toBe("new@example.com");
  });

  it("should accept registration without name", async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue({
      id: "new-user",
      email: "test@example.com",
      name: null,
    });
    mockPrismaToken.create.mockResolvedValue({});

    const res = await POST(makeRequest({
      email: "test@example.com",
      password: "SecurePass1!",
    }));

    expect(res.status).toBe(201);
  });

  it("should reject password without uppercase", async () => {
    const res = await POST(makeRequest({
      email: "test@example.com",
      password: "securepass1!",
    }));
    expect(res.status).toBe(400);
  });

  it("should reject password without symbol", async () => {
    const res = await POST(makeRequest({
      email: "test@example.com",
      password: "SecurePass1",
    }));
    expect(res.status).toBe(400);
  });
});
