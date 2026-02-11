import { prisma } from "./prisma";
import { type Role } from "@prisma/client";

/**
 * Get the roles that a user is allowed to assign workers from,
 * based on their own role in the hierarchy.
 */
export function getAllowedRolesForAssignment(userRole: string): Role[] {
  if (userRole === "SUPER_ADMIN") {
    return ["USER", "ADMIN"];
  }
  // Both USER and ADMIN can only assign to USER
  return ["USER"];
}

/**
 * Validate that worker IDs only include users with allowed roles.
 * ADMIN and SUPER_ADMIN can also assign to themselves
 * (but not others with same/higher role).
 */
export async function validateWorkerAssignment(
  workerIds: string[],
  userRole: string,
  currentUserId: string
): Promise<{ valid: boolean; error?: string }> {
  if (!workerIds || workerIds.length === 0) {
    return { valid: true };
  }

  const allowedRoles = getAllowedRolesForAssignment(userRole);
  const canAssignToSelf = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const invalidWorkers = await prisma.user.findMany({
    where: {
      id: { in: workerIds },
      role: { notIn: allowedRoles },
      // ADMIN and SUPER_ADMIN can assign to themselves
      ...(canAssignToSelf ? { NOT: { id: currentUserId } } : {}),
    },
    select: { id: true, role: true, name: true },
  });

  if (invalidWorkers.length > 0) {
    return {
      valid: false,
      error: "No puedes asignar usuarios con roles superiores o iguales al tuyo",
    };
  }

  return { valid: true };
}
