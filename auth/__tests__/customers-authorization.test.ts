import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks (vi.hoisted ensures these exist before vi.mock factories run) ---

const { mockAuth, mockPrismaUser, mockPrismaCustomer } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrismaUser: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  mockPrismaCustomer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: mockPrismaUser,
    customer: mockPrismaCustomer,
  },
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(),
  getAuditIp: vi.fn(() => "127.0.0.1"),
  getAuditUserAgent: vi.fn(() => "test-agent"),
}));

import { PATCH, DELETE } from "@/app/api/customers/route";

// --- Helpers ---

function makePatchRequest(body: object): Request {
  return new Request("http://localhost/api/customers", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(customerId: string): Request {
  return new Request(
    `http://localhost/api/customers?id=${customerId}`,
    { method: "DELETE" }
  );
}

// --- Test data ---

const ADMIN_USER = { id: "admin-1", role: "ADMIN" };
const SUPER_ADMIN_USER = { id: "super-1", role: "SUPER_ADMIN" };
const CREATOR_USER = { id: "creator-1", role: "USER" };
const ASSIGNED_USER = { id: "assigned-1", role: "USER" };
const UNRELATED_USER = { id: "unrelated-1", role: "USER" };

const CUSTOMER = {
  id: "customer-1",
  name: "Test Customer",
  email: null,
  phone: null,
  dni: null,
  address: null,
  notes: null,
  category: "REGULAR",
  status: "ACTIVE",
  createdById: CREATOR_USER.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const CUSTOMER_WITH_WORKERS = {
  ...CUSTOMER,
  workers: [{ id: ASSIGNED_USER.id }],
};

const UPDATED_CUSTOMER_RESPONSE = {
  ...CUSTOMER,
  name: "Updated Name",
  workers: [],
  createdBy: { id: CREATOR_USER.id, name: "Creator", email: "creator@test.com" },
};

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/customers - Authorization", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ id: "customer-1", name: "New" }));
    expect(res.status).toBe(401);
  });

  it("should return 403 if user is not admin, creator, or assigned worker", async () => {
    mockAuth.mockResolvedValue({ user: { email: "unrelated@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(UNRELATED_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER_WITH_WORKERS);

    const res = await PATCH(makePatchRequest({ id: "customer-1", name: "Hacked" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("No tienes permiso para editar este cliente");
  });

  it("should allow admin to update any customer", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER_WITH_WORKERS);
    mockPrismaCustomer.update.mockResolvedValue(UPDATED_CUSTOMER_RESPONSE);

    const res = await PATCH(makePatchRequest({ id: "customer-1", name: "Updated Name" }));
    expect(res.status).toBe(200);
  });

  it("should allow super_admin to update any customer", async () => {
    mockAuth.mockResolvedValue({ user: { email: "super@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(SUPER_ADMIN_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER_WITH_WORKERS);
    mockPrismaCustomer.update.mockResolvedValue(UPDATED_CUSTOMER_RESPONSE);

    const res = await PATCH(makePatchRequest({ id: "customer-1", name: "Updated Name" }));
    expect(res.status).toBe(200);
  });

  it("should allow creator to update their own customer", async () => {
    mockAuth.mockResolvedValue({ user: { email: "creator@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(CREATOR_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER_WITH_WORKERS);
    mockPrismaCustomer.update.mockResolvedValue(UPDATED_CUSTOMER_RESPONSE);

    const res = await PATCH(makePatchRequest({ id: "customer-1", name: "Updated Name" }));
    expect(res.status).toBe(200);
  });

  it("should allow assigned worker to update the customer", async () => {
    mockAuth.mockResolvedValue({ user: { email: "assigned@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ASSIGNED_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER_WITH_WORKERS);
    mockPrismaCustomer.update.mockResolvedValue(UPDATED_CUSTOMER_RESPONSE);

    const res = await PATCH(makePatchRequest({ id: "customer-1", name: "Updated Name" }));
    expect(res.status).toBe(200);
  });

  it("should NOT allow assigned worker to change workerIds", async () => {
    mockAuth.mockResolvedValue({ user: { email: "assigned@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ASSIGNED_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER_WITH_WORKERS);
    mockPrismaCustomer.update.mockResolvedValue(UPDATED_CUSTOMER_RESPONSE);

    await PATCH(
      makePatchRequest({ id: "customer-1", workerIds: ["some-other-user"] })
    );

    // The update call should NOT include workers in the data
    const updateCall = mockPrismaCustomer.update.mock.calls[0][0];
    expect(updateCall.data.workers).toBeUndefined();
  });

  it("should allow creator to change workerIds", async () => {
    mockAuth.mockResolvedValue({ user: { email: "creator@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(CREATOR_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER_WITH_WORKERS);
    // validateWorkerAssignment queries prisma.user.findMany — return empty (all valid)
    mockPrismaUser.findMany.mockResolvedValue([]);
    mockPrismaCustomer.update.mockResolvedValue(UPDATED_CUSTOMER_RESPONSE);

    await PATCH(
      makePatchRequest({ id: "customer-1", workerIds: [ASSIGNED_USER.id] })
    );

    const updateCall = mockPrismaCustomer.update.mock.calls[0][0];
    expect(updateCall.data.workers).toBeDefined();
    expect(updateCall.data.workers.set).toEqual([{ id: ASSIGNED_USER.id }]);
  });

  it("should allow admin to change workerIds", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER_WITH_WORKERS);
    mockPrismaUser.findMany.mockResolvedValue([]);
    mockPrismaCustomer.update.mockResolvedValue(UPDATED_CUSTOMER_RESPONSE);

    await PATCH(
      makePatchRequest({ id: "customer-1", workerIds: [ASSIGNED_USER.id] })
    );

    const updateCall = mockPrismaCustomer.update.mock.calls[0][0];
    expect(updateCall.data.workers).toBeDefined();
  });
});

describe("DELETE /api/customers - Authorization", () => {
  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest("customer-1"));
    expect(res.status).toBe(401);
  });

  it("should return 403 if user is not admin or creator", async () => {
    mockAuth.mockResolvedValue({ user: { email: "unrelated@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(UNRELATED_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER);

    const res = await DELETE(makeDeleteRequest("customer-1"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("No tienes permiso para eliminar este cliente");
  });

  it("should return 403 if assigned worker (not creator) tries to delete", async () => {
    mockAuth.mockResolvedValue({ user: { email: "assigned@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ASSIGNED_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER);

    const res = await DELETE(makeDeleteRequest("customer-1"));
    expect(res.status).toBe(403);
  });

  it("should allow admin to delete any customer", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER);
    mockPrismaCustomer.delete.mockResolvedValue(CUSTOMER);

    const res = await DELETE(makeDeleteRequest("customer-1"));
    expect(res.status).toBe(200);
  });

  it("should allow super_admin to delete any customer", async () => {
    mockAuth.mockResolvedValue({ user: { email: "super@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(SUPER_ADMIN_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER);
    mockPrismaCustomer.delete.mockResolvedValue(CUSTOMER);

    const res = await DELETE(makeDeleteRequest("customer-1"));
    expect(res.status).toBe(200);
  });

  it("should allow creator to delete their own customer", async () => {
    mockAuth.mockResolvedValue({ user: { email: "creator@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(CREATOR_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(CUSTOMER);
    mockPrismaCustomer.delete.mockResolvedValue(CUSTOMER);

    const res = await DELETE(makeDeleteRequest("customer-1"));
    expect(res.status).toBe(200);
  });

  it("should return 400 if no customer ID provided", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);

    const res = await DELETE(
      new Request("http://localhost/api/customers", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
  });

  it("should return 404 if customer does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockPrismaUser.findUnique.mockResolvedValue(ADMIN_USER);
    mockPrismaCustomer.findUnique.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest("nonexistent"));
    expect(res.status).toBe(404);
  });
});
