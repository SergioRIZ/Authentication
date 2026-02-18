import { describe, it, expect } from "vitest";
import {
  customerSchema,
  updateCustomerSchema,
} from "@/lib/validations/customer";
import { taskSchema, updateTaskSchema } from "@/lib/validations/task";

// ─── Customer Schema ──────────────────────────────────────────

describe("customerSchema", () => {
  it("should accept valid customer with all fields", () => {
    const result = customerSchema.safeParse({
      name: "Empresa ABC",
      email: "contacto@empresa.com",
      phone: "+34 612 345 678",
      dni: "12345678A",
      address: "Calle Mayor 1, Madrid",
      notes: "Cliente importante",
      category: "PREMIUM",
      status: "ACTIVE",
      workerIds: ["worker-1"],
    });
    expect(result.success).toBe(true);
  });

  it("should accept minimal customer (only name)", () => {
    const result = customerSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("REGULAR");
      expect(result.data.status).toBe("ACTIVE");
      expect(result.data.workerIds).toEqual([]);
    }
  });

  it("should reject name shorter than 2 characters", () => {
    const result = customerSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });

  it("should reject name longer than 100 characters", () => {
    const result = customerSchema.safeParse({ name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("should accept empty string for optional email", () => {
    const result = customerSchema.safeParse({ name: "Test", email: "" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const result = customerSchema.safeParse({ name: "Test", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("should reject phone longer than 20 characters", () => {
    const result = customerSchema.safeParse({
      name: "Test",
      phone: "1".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("should reject dni longer than 20 characters", () => {
    const result = customerSchema.safeParse({
      name: "Test",
      dni: "X".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("should reject address longer than 200 characters", () => {
    const result = customerSchema.safeParse({
      name: "Test",
      address: "A".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("should reject notes longer than 1000 characters", () => {
    const result = customerSchema.safeParse({
      name: "Test",
      notes: "N".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("should only accept valid categories", () => {
    expect(customerSchema.safeParse({ name: "Test", category: "PREMIUM" }).success).toBe(true);
    expect(customerSchema.safeParse({ name: "Test", category: "REGULAR" }).success).toBe(true);
    expect(customerSchema.safeParse({ name: "Test", category: "OCCASIONAL" }).success).toBe(true);
    expect(customerSchema.safeParse({ name: "Test", category: "VIP" }).success).toBe(false);
  });

  it("should only accept valid statuses", () => {
    expect(customerSchema.safeParse({ name: "Test", status: "ACTIVE" }).success).toBe(true);
    expect(customerSchema.safeParse({ name: "Test", status: "INACTIVE" }).success).toBe(true);
    expect(customerSchema.safeParse({ name: "Test", status: "DELETED" }).success).toBe(false);
  });
});

describe("updateCustomerSchema", () => {
  it("should require an id field", () => {
    const result = updateCustomerSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(false);
  });

  it("should accept id with partial fields", () => {
    const result = updateCustomerSchema.safeParse({
      id: "customer-1",
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("should accept id alone (all other fields optional)", () => {
    const result = updateCustomerSchema.safeParse({ id: "customer-1" });
    expect(result.success).toBe(true);
  });

  it("should reject empty id", () => {
    const result = updateCustomerSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});

// ─── Task Schema ──────────────────────────────────────────────

describe("taskSchema", () => {
  it("should accept valid task with all fields", () => {
    const result = taskSchema.safeParse({
      title: "Fix login bug",
      description: "The login form crashes on submit",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: "2025-12-31",
      startDate: "2025-06-01",
      customerId: "customer-1",
      workerIds: ["worker-1", "worker-2"],
    });
    expect(result.success).toBe(true);
  });

  it("should accept minimal task (only title)", () => {
    const result = taskSchema.safeParse({ title: "Do stuff" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("PENDING");
      expect(result.data.priority).toBe("MEDIUM");
      expect(result.data.workerIds).toEqual([]);
    }
  });

  it("should reject title shorter than 2 characters", () => {
    const result = taskSchema.safeParse({ title: "A" });
    expect(result.success).toBe(false);
  });

  it("should reject title longer than 200 characters", () => {
    const result = taskSchema.safeParse({ title: "T".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("should reject description longer than 2000 characters", () => {
    const result = taskSchema.safeParse({
      title: "Test",
      description: "D".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("should accept empty string for description", () => {
    const result = taskSchema.safeParse({ title: "Test", description: "" });
    expect(result.success).toBe(true);
  });

  it("should only accept valid statuses", () => {
    expect(taskSchema.safeParse({ title: "Test", status: "PENDING" }).success).toBe(true);
    expect(taskSchema.safeParse({ title: "Test", status: "IN_PROGRESS" }).success).toBe(true);
    expect(taskSchema.safeParse({ title: "Test", status: "COMPLETED" }).success).toBe(true);
    expect(taskSchema.safeParse({ title: "Test", status: "CANCELLED" }).success).toBe(false);
  });

  it("should only accept valid priorities", () => {
    expect(taskSchema.safeParse({ title: "Test", priority: "LOW" }).success).toBe(true);
    expect(taskSchema.safeParse({ title: "Test", priority: "MEDIUM" }).success).toBe(true);
    expect(taskSchema.safeParse({ title: "Test", priority: "HIGH" }).success).toBe(true);
    expect(taskSchema.safeParse({ title: "Test", priority: "URGENT" }).success).toBe(false);
  });

  it("should accept empty string for optional date fields", () => {
    const result = taskSchema.safeParse({
      title: "Test",
      dueDate: "",
      startDate: "",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty string for customerId", () => {
    const result = taskSchema.safeParse({
      title: "Test",
      customerId: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateTaskSchema", () => {
  it("should require an id field", () => {
    const result = updateTaskSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(false);
  });

  it("should accept id with partial fields", () => {
    const result = updateTaskSchema.safeParse({
      id: "task-1",
      status: "COMPLETED",
    });
    expect(result.success).toBe(true);
  });

  it("should accept id alone", () => {
    const result = updateTaskSchema.safeParse({ id: "task-1" });
    expect(result.success).toBe(true);
  });

  it("should reject empty id", () => {
    const result = updateTaskSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
