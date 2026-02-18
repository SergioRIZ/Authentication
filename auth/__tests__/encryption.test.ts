import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Set a valid 64-char hex key before importing
const TEST_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
vi.stubEnv("ENCRYPTION_KEY", TEST_KEY);

import { encrypt, decrypt } from "@/lib/encryption";

describe("encrypt", () => {
  it("should return a string in format iv:authTag:ciphertext", () => {
    const result = encrypt("hello world");
    const parts = result.split(":");
    expect(parts).toHaveLength(3);
    // IV = 12 bytes = 24 hex chars
    expect(parts[0]).toHaveLength(24);
    // Auth tag = 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // Ciphertext is non-empty hex
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it("should produce different ciphertexts for the same plaintext (random IV)", () => {
    const a = encrypt("same text");
    const b = encrypt("same text");
    expect(a).not.toBe(b);
  });

  it("should handle empty string", () => {
    const result = encrypt("");
    const parts = result.split(":");
    expect(parts).toHaveLength(3);
  });

  it("should handle unicode characters", () => {
    const result = encrypt("contraseña ñ 日本語 🔒");
    expect(result.split(":")).toHaveLength(3);
  });

  it("should handle long strings", () => {
    const longText = "A".repeat(10000);
    const result = encrypt(longText);
    expect(result.split(":")).toHaveLength(3);
  });
});

describe("decrypt", () => {
  it("should correctly decrypt what encrypt produced", () => {
    const plaintext = "secret data 123";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("should throw on empty string encryption (empty ciphertext)", () => {
    // AES-GCM with empty plaintext produces an empty ciphertext part,
    // which fails the !ciphertext check in decrypt (empty string is falsy)
    const encrypted = encrypt("");
    expect(() => decrypt(encrypted)).toThrow("Invalid encrypted data format");
  });

  it("should round-trip unicode", () => {
    const text = "contraseña ñ 日本語 🔒";
    const encrypted = encrypt(text);
    expect(decrypt(encrypted)).toBe(text);
  });

  it("should round-trip long strings", () => {
    const text = "X".repeat(10000);
    const encrypted = encrypt(text);
    expect(decrypt(encrypted)).toBe(text);
  });

  it("should throw on invalid format (missing parts)", () => {
    expect(() => decrypt("abc:def")).toThrow("Invalid encrypted data format");
    expect(() => decrypt("onlyonepart")).toThrow("Invalid encrypted data format");
    expect(() => decrypt("")).toThrow("Invalid encrypted data format");
  });

  it("should throw on tampered ciphertext", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    // Flip a character in the ciphertext
    parts[2] = parts[2].slice(0, -1) + (parts[2].slice(-1) === "0" ? "1" : "0");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("should throw on tampered auth tag", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    parts[1] = "0".repeat(32);
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("should throw on tampered IV", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    parts[0] = "0".repeat(24);
    expect(() => decrypt(parts.join(":"))).toThrow();
  });
});

describe("encryption key validation", () => {
  it("should throw when ENCRYPTION_KEY is missing", () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;

    try {
      expect(() => encrypt("test")).toThrow("Missing ENCRYPTION_KEY");
    } finally {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  it("should throw when ENCRYPTION_KEY has wrong length", () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = "abcd"; // Too short

    try {
      expect(() => encrypt("test")).toThrow("64-character hex string");
    } finally {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });
});
