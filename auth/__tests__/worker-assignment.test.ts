import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: (...args: any[]) => mockUserFindMany(...args),
    },
  },
}));

import {
  getAllowedRolesForAssignment,
  validateWorkerAssignment,
} from "@/lib/worker-assignment";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAllowedRolesForAssignment", () => {
  it("should return [USER, ADMIN] for SUPER_ADMIN", () => {
    expect(getAllowedRolesForAssignment("SUPER_ADMIN")).toEqual(["USER", "ADMIN"]);
  });

  it("should return [USER] for ADMIN", () => {
    expect(getAllowedRolesForAssignment("ADMIN")).toEqual(["USER"]);
  });

  it("should return [USER] for USER", () => {
    expect(getAllowedRolesForAssignment("USER")).toEqual(["USER"]);
  });
});

describe("validateWorkerAssignment", () => {
  it("should return valid for empty workerIds", async () => {
    const result = await validateWorkerAssignment([], "USER", "user-1");
    expect(result.valid).toBe(true);
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it("should return valid when no invalid workers are found", async () => {
    mockUserFindMany.mockResolvedValue([]);

    const result = await validateWorkerAssignment(
      ["worker-1", "worker-2"],
      "ADMIN",
      "admin-1"
    );
    expect(result.valid).toBe(true);
  });

  it("should return invalid when workers with disallowed roles are found", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "admin-2", role: "ADMIN", name: "Other Admin" },
    ]);

    const result = await validateWorkerAssignment(
      ["admin-2"],
      "ADMIN",
      "admin-1"
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("No puedes asignar");
  });

  it("should allow ADMIN to assign to themselves (excluded from invalid query)", async () => {
    mockUserFindMany.mockResolvedValue([]);

    const result = await validateWorkerAssignment(
      ["admin-1"],
      "ADMIN",
      "admin-1"
    );

    // Check that the query excludes self for admin
    const queryArg = mockUserFindMany.mock.calls[0][0];
    expect(queryArg.where.NOT).toEqual({ id: "admin-1" });
    expect(result.valid).toBe(true);
  });

  it("should allow SUPER_ADMIN to assign to themselves", async () => {
    mockUserFindMany.mockResolvedValue([]);

    const result = await validateWorkerAssignment(
      ["super-1"],
      "SUPER_ADMIN",
      "super-1"
    );

    const queryArg = mockUserFindMany.mock.calls[0][0];
    expect(queryArg.where.NOT).toEqual({ id: "super-1" });
    expect(result.valid).toBe(true);
  });

  it("should NOT allow USER to assign to themselves (no self-exclusion)", async () => {
    mockUserFindMany.mockResolvedValue([]);

    await validateWorkerAssignment(["user-1"], "USER", "user-1");

    const queryArg = mockUserFindMany.mock.calls[0][0];
    // USER should not have the NOT clause — they can't self-assign
    expect(queryArg.where.NOT).toBeUndefined();
  });

  it("should query only for roles not in allowed list", async () => {
    mockUserFindMany.mockResolvedValue([]);

    await validateWorkerAssignment(
      ["worker-1"],
      "SUPER_ADMIN",
      "super-1"
    );

    const queryArg = mockUserFindMany.mock.calls[0][0];
    expect(queryArg.where.role.notIn).toEqual(["USER", "ADMIN"]);
  });
});
