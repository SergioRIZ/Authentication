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

import { GET, PATCH } from "@/app/api/profile/route";

function makePatchRequest(body: object): Request {
  return new Request("http://localhost/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- GET /api/profile ---

describe("GET /api/profile", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("should return 404 if user not found in DB", async () => {
    mockAuth.mockResolvedValue({ user: { email: "ghost@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("should return user profile for authenticated user", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@test.com",
      name: "Test User",
      image: null,
      createdAt: new Date("2025-01-01"),
    };

    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(mockUser);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.email).toBe("user@test.com");
    expect(body.user.name).toBe("Test User");
  });
});

// --- PATCH /api/profile ---

describe("PATCH /api/profile", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ name: "New Name" }));
    expect(res.status).toBe(401);
  });

  it("should update user name", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.update.mockResolvedValue({
      id: "user-1",
      email: "user@test.com",
      name: "Updated Name",
      image: null,
    });

    const res = await PATCH(makePatchRequest({ name: "Updated Name" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.name).toBe("Updated Name");
  });

  it("should update user image with HTTPS URL", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.update.mockResolvedValue({
      id: "user-1",
      email: "user@test.com",
      name: "User",
      image: "https://example.com/photo.jpg",
    });

    const res = await PATCH(makePatchRequest({
      image: "https://example.com/photo.jpg",
    }));
    expect(res.status).toBe(200);
  });

  it("should reject non-HTTPS image URL", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });

    const res = await PATCH(makePatchRequest({
      image: "http://example.com/photo.jpg",
    }));
    expect(res.status).toBe(400);
  });

  it("should reject name shorter than 2 characters", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });

    const res = await PATCH(makePatchRequest({ name: "A" }));
    expect(res.status).toBe(400);
  });

  it("should allow setting image to null", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@test.com" } });
    mockPrismaUser.update.mockResolvedValue({
      id: "user-1",
      email: "user@test.com",
      name: "User",
      image: null,
    });

    const res = await PATCH(makePatchRequest({ image: null }));
    expect(res.status).toBe(200);
  });
});
