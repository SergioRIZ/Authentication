import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

describe("registerSchema", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass1!",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("should accept registration without name", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass1!",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "SecurePass1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Ab1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without uppercase", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "securepass1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without lowercase", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SECUREPASS1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without number", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without symbol", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject too-long password", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "A".repeat(101) + "a1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short name", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass1!",
      name: "A",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "anypassword",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("should accept valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("should accept valid reset data", () => {
    const result = resetPasswordSchema.safeParse({
      token: "some-token",
      password: "NewSecure1!",
      confirmPassword: "NewSecure1!",
    });
    expect(result.success).toBe(true);
  });

  it("should reject mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "some-token",
      password: "NewSecure1!",
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject weak password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "some-token",
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });
});
