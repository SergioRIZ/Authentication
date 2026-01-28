import { describe, it, expect } from "vitest";
import { isDisposableEmail } from "@/lib/email-validation";

describe("isDisposableEmail", () => {
  it("should detect known disposable email domains", () => {
    expect(isDisposableEmail("test@mailinator.com")).toBe(true);
    expect(isDisposableEmail("test@guerrillamail.com")).toBe(true);
    expect(isDisposableEmail("test@tempmail.com")).toBe(true);
    expect(isDisposableEmail("test@yopmail.com")).toBe(true);
    expect(isDisposableEmail("test@throwaway.email")).toBe(true);
    expect(isDisposableEmail("test@10minutemail.com")).toBe(true);
    expect(isDisposableEmail("test@maildrop.cc")).toBe(true);
    expect(isDisposableEmail("test@trashmail.com")).toBe(true);
  });

  it("should allow legitimate email domains", () => {
    expect(isDisposableEmail("test@gmail.com")).toBe(false);
    expect(isDisposableEmail("test@outlook.com")).toBe(false);
    expect(isDisposableEmail("test@yahoo.com")).toBe(false);
    expect(isDisposableEmail("test@hotmail.com")).toBe(false);
    expect(isDisposableEmail("test@protonmail.com")).toBe(false);
    expect(isDisposableEmail("user@company.com")).toBe(false);
  });

  it("should handle case insensitivity via domain extraction", () => {
    // isDisposableEmail lowercases the domain before checking
    expect(isDisposableEmail("test@MAILINATOR.COM")).toBe(true);
    expect(isDisposableEmail("test@mailinator.com")).toBe(true);
  });

  it("should handle invalid email formats gracefully", () => {
    expect(isDisposableEmail("noemail")).toBe(false);
    expect(isDisposableEmail("")).toBe(false);
    expect(isDisposableEmail("@")).toBe(false);
  });
});
