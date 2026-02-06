import { prisma } from "./prisma";

/**
 * Audit log action types for tracking security-relevant events.
 */
export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_BLOCKED_LOCKOUT"
  | "LOGOUT"
  | "REGISTER"
  | "EMAIL_VERIFIED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "ACCOUNT_DELETED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED"
  | "ROLE_CHANGED"
  | "PROFILE_UPDATED"
  | "TWO_FACTOR_ENABLED"
  | "TWO_FACTOR_DISABLED"
  | "TWO_FACTOR_FAILED"
  | "USER_VERIFIED_BY_ADMIN"
  | "CUSTOMER_CREATED"
  | "CUSTOMER_UPDATED"
  | "CUSTOMER_DELETED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TASK_STATUS_CHANGED";

interface AuditLogParams {
  userId?: string | null;
  action: AuditAction;
  details?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Record an audit log entry.
 * Fire-and-forget to avoid slowing down the request.
 */
export async function logAuditEvent({
  userId,
  action,
  details,
  ipAddress,
  userAgent,
}: AuditLogParams): Promise<void> {
  try {
    await (prisma as any).auditLog.create({
      data: {
        userId: userId || null,
        action,
        details: details || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.substring(0, 500) : null,
      },
    });
  } catch (error) {
    // Never let audit logging break the application flow
    console.error("Audit log error:", error);
  }
}

/**
 * Extract IP address from request headers.
 */
export function getAuditIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return null;
}

/**
 * Extract User-Agent from request headers.
 */
export function getAuditUserAgent(request: Request): string | null {
  return request.headers.get("user-agent");
}
