import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing
const mockAuditLogCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: (...args: any[]) => mockAuditLogCreate(...args),
    },
  },
}));

import { logAuditEvent, getAuditIp, getAuditUserAgent } from "@/lib/audit";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("logAuditEvent", () => {
  it("should create an audit log entry with all fields", async () => {
    mockAuditLogCreate.mockResolvedValue({});

    await logAuditEvent({
      userId: "user-123",
      action: "LOGIN_SUCCESS",
      details: "Login from Chrome",
      ipAddress: "1.2.3.4",
      userAgent: "Mozilla/5.0",
    });

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        action: "LOGIN_SUCCESS",
        details: "Login from Chrome",
        ipAddress: "1.2.3.4",
        userAgent: "Mozilla/5.0",
      },
    });
  });

  it("should handle null userId", async () => {
    mockAuditLogCreate.mockResolvedValue({});

    await logAuditEvent({
      userId: null,
      action: "LOGIN_FAILED",
    });

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: null,
        action: "LOGIN_FAILED",
        details: null,
        ipAddress: null,
        userAgent: null,
      },
    });
  });

  it("should handle undefined optional fields (defaults to null)", async () => {
    mockAuditLogCreate.mockResolvedValue({});

    await logAuditEvent({
      action: "REGISTER",
    });

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: null,
        action: "REGISTER",
        details: null,
        ipAddress: null,
        userAgent: null,
      },
    });
  });

  it("should truncate userAgent to 500 characters", async () => {
    mockAuditLogCreate.mockResolvedValue({});
    const longAgent = "X".repeat(600);

    await logAuditEvent({
      action: "LOGIN_SUCCESS",
      userAgent: longAgent,
    });

    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.userAgent).toHaveLength(500);
  });

  it("should not throw when prisma create fails (fire-and-forget)", async () => {
    mockAuditLogCreate.mockRejectedValue(new Error("DB down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Should not throw
    await logAuditEvent({
      action: "LOGIN_SUCCESS",
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("getAuditIp", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.1, 70.41.3.18" },
    });
    expect(getAuditIp(request)).toBe("203.0.113.1");
  });

  it("should return null when no x-forwarded-for header", () => {
    const request = new Request("http://localhost");
    expect(getAuditIp(request)).toBeNull();
  });

  it("should trim whitespace from IP", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "  10.0.0.1  " },
    });
    expect(getAuditIp(request)).toBe("10.0.0.1");
  });

  it("should handle single IP (no commas)", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });
    expect(getAuditIp(request)).toBe("192.168.1.1");
  });
});

describe("getAuditUserAgent", () => {
  it("should extract user-agent header", () => {
    const request = new Request("http://localhost", {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0)" },
    });
    expect(getAuditUserAgent(request)).toBe("Mozilla/5.0 (Windows NT 10.0)");
  });

  it("should return null when no user-agent header", () => {
    const request = new Request("http://localhost");
    expect(getAuditUserAgent(request)).toBeNull();
  });
});
