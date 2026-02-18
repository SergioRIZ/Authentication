import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const { mockAuth, mockPrismaUser, mockPrismaTask } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrismaUser: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  mockPrismaTask: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: mockPrismaUser,
    task: mockPrismaTask,
  },
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(),
  getAuditIp: vi.fn(() => "127.0.0.1"),
  getAuditUserAgent: vi.fn(() => "test-agent"),
}));

import { PATCH, DELETE } from "@/app/api/tasks/route";

// --- Helpers ---

function makePatchRequest(body: object): Request {
  return new Request("http://localhost/api/tasks", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(taskId: string): Request {
  return new Request(`http://localhost/api/tasks?id=${taskId}`, {
    method: "DELETE",
  });
}

// --- Test data ---

const ADMIN_USER = { id: "admin-1", role: "ADMIN" };
const SUPER_ADMIN_USER = { id: "super-1", role: "SUPER_ADMIN" };
const CREATOR_USER = { id: "creator-1", role: "USER" };
const ASSIGNED_USER = { id: "assigned-1", role: "USER" };
const UNRELATED_USER = { id: "unrelated-1", role: "USER" };

const TASK = {
  id: "task-1",
  title: "Test Task",
  description: null,
  status: "PENDING",
  priority: "MEDIUM",
  dueDate: null,
  startDate: null,
  completedAt: null,
  customerId: null,
  createdById: CREATOR_USER.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const TASK_WITH_WORKERS = {
  ...TASK,
  workers: [{ id: ASSIGNED_USER.id }],
};

const UPDATED_TASK_RESPONSE = {
  ...TASK,
  title: "Updated Title",
  workers: [],
  createdBy: { id: CREATOR_USER.id, name: "Creator", email: "creator@test.com" },
  customer: null,
};

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/tasks - Authorization", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ id: "task-1", title: "New" }));
    expect(res.status).toBe(401);
  });

  it("should return 404 if user not found in DB", async () => {
    mockAuth.mockResolvedValue({ user: { email: "ghost@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ id: "task-1", title: "New" }));
    expect(res.status).toBe(404);
  });

  it("should return 404 if task does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    mockPrismaTask.findUnique.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ id: "nonexistent", title: "New" }));
    expect(res.status).toBe(404);
  });

  it("should return 403 if user is not admin, creator, or assigned worker", async () => {
    mockAuth.mockResolvedValue({ user: { email: "unrelated@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(UNRELATED_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK_WITH_WORKERS);

    const res = await PATCH(makePatchRequest({ id: "task-1", title: "Hacked" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("No tienes permiso para editar esta tarea");
  });

  it("should allow admin to update any task", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK_WITH_WORKERS);
    mockPrismaTask.update.mockResolvedValue(UPDATED_TASK_RESPONSE);

    const res = await PATCH(makePatchRequest({ id: "task-1", title: "Updated Title" }));
    expect(res.status).toBe(200);
  });

  it("should allow super_admin to update any task", async () => {
    mockAuth.mockResolvedValue({ user: { email: "super@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(SUPER_ADMIN_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK_WITH_WORKERS);
    mockPrismaTask.update.mockResolvedValue(UPDATED_TASK_RESPONSE);

    const res = await PATCH(makePatchRequest({ id: "task-1", title: "Updated Title" }));
    expect(res.status).toBe(200);
  });

  it("should allow creator to update their own task", async () => {
    mockAuth.mockResolvedValue({ user: { email: "creator@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(CREATOR_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK_WITH_WORKERS);
    mockPrismaTask.update.mockResolvedValue(UPDATED_TASK_RESPONSE);

    const res = await PATCH(makePatchRequest({ id: "task-1", title: "Updated Title" }));
    expect(res.status).toBe(200);
  });

  it("should allow assigned worker to update the task", async () => {
    mockAuth.mockResolvedValue({ user: { email: "assigned@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ASSIGNED_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK_WITH_WORKERS);
    mockPrismaTask.update.mockResolvedValue(UPDATED_TASK_RESPONSE);

    const res = await PATCH(makePatchRequest({ id: "task-1", title: "Updated Title" }));
    expect(res.status).toBe(200);
  });

  it("should NOT allow assigned worker to change workerIds", async () => {
    mockAuth.mockResolvedValue({ user: { email: "assigned@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ASSIGNED_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK_WITH_WORKERS);
    mockPrismaTask.update.mockResolvedValue(UPDATED_TASK_RESPONSE);

    await PATCH(makePatchRequest({ id: "task-1", workerIds: ["some-other"] }));

    const updateCall = mockPrismaTask.update.mock.calls[0][0];
    expect(updateCall.data.workers).toBeUndefined();
  });

  it("should allow creator to change workerIds", async () => {
    mockAuth.mockResolvedValue({ user: { email: "creator@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(CREATOR_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK_WITH_WORKERS);
    mockPrismaUser.findMany.mockResolvedValue([]);
    mockPrismaTask.update.mockResolvedValue(UPDATED_TASK_RESPONSE);

    await PATCH(makePatchRequest({ id: "task-1", workerIds: [ASSIGNED_USER.id] }));

    const updateCall = mockPrismaTask.update.mock.calls[0][0];
    expect(updateCall.data.workers).toBeDefined();
    expect(updateCall.data.workers.set).toEqual([{ id: ASSIGNED_USER.id }]);
  });

  it("should set completedAt when status changes to COMPLETED", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK_WITH_WORKERS);
    mockPrismaTask.update.mockResolvedValue(UPDATED_TASK_RESPONSE);

    await PATCH(makePatchRequest({ id: "task-1", status: "COMPLETED" }));

    const updateCall = mockPrismaTask.update.mock.calls[0][0];
    expect(updateCall.data.completedAt).toBeInstanceOf(Date);
  });

  it("should clear completedAt when status changes away from COMPLETED", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    const completedTask = { ...TASK_WITH_WORKERS, status: "COMPLETED" };
    mockPrismaTask.findUnique.mockResolvedValue(completedTask);
    mockPrismaTask.update.mockResolvedValue(UPDATED_TASK_RESPONSE);

    await PATCH(makePatchRequest({ id: "task-1", status: "PENDING" }));

    const updateCall = mockPrismaTask.update.mock.calls[0][0];
    expect(updateCall.data.completedAt).toBeNull();
  });

  it("should return 400 for invalid data (Zod error)", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);

    // Missing id field
    const res = await PATCH(makePatchRequest({ title: "No ID" }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks - Authorization", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest("task-1"));
    expect(res.status).toBe(401);
  });

  it("should return 400 if no task ID provided", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);

    const res = await DELETE(
      new Request("http://localhost/api/tasks", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
  });

  it("should return 404 if task does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    mockPrismaTask.findUnique.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("should return 403 if regular user is not creator", async () => {
    mockAuth.mockResolvedValue({ user: { email: "unrelated@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(UNRELATED_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK);

    const res = await DELETE(makeDeleteRequest("task-1"));
    expect(res.status).toBe(403);
  });

  it("should return 403 if assigned worker (not creator) tries to delete", async () => {
    mockAuth.mockResolvedValue({ user: { email: "assigned@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ASSIGNED_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK);

    const res = await DELETE(makeDeleteRequest("task-1"));
    expect(res.status).toBe(403);
  });

  it("should allow admin to delete any task", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK);
    mockPrismaTask.delete.mockResolvedValue(TASK);

    const res = await DELETE(makeDeleteRequest("task-1"));
    expect(res.status).toBe(200);
  });

  it("should allow super_admin to delete any task", async () => {
    mockAuth.mockResolvedValue({ user: { email: "super@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(SUPER_ADMIN_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK);
    mockPrismaTask.delete.mockResolvedValue(TASK);

    const res = await DELETE(makeDeleteRequest("task-1"));
    expect(res.status).toBe(200);
  });

  it("should allow creator to delete their own task", async () => {
    mockAuth.mockResolvedValue({ user: { email: "creator@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(CREATOR_USER);
    mockPrismaTask.findUnique.mockResolvedValue(TASK);
    mockPrismaTask.delete.mockResolvedValue(TASK);

    const res = await DELETE(makeDeleteRequest("task-1"));
    expect(res.status).toBe(200);
  });
});
