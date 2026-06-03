import { auth } from "./auth";

/**
 * Ensures that the current user has one of the allowed roles.
 * Throws an error if unauthorized. Use this inside Server Actions.
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHORIZED: Not logged in");
  }

  const role = session.user.role as string;

  if (!allowedRoles.includes(role)) {
    throw new Error(`FORBIDDEN: Role ${role} is not authorized for this action.`);
  }

  return session.user;
}

/**
 * Returns a strictly typed Prisma filter object to ensure users can only
 * query their own data or data related to their role.
 * 
 * Example usage:
 * prisma.student.findMany({ where: await getRoleScopedWhereClause('student') })
 */
export async function getRoleScopedWhereClause(modelType: "student" | "attendance" | "fee") {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = session.user.role as string;
  const userId = session.user.id;

  // Admins get unrestricted access (empty where clause)
  if (role === "ADMIN") return {};

  if (modelType === "student") {
    if (role === "STUDENT") return { userId };
    // A teacher might only see students in their classes - logic would be expanded here
    if (role === "TEACHER") return {}; 
    if (role === "PARENT") return { parent: { userId } };
  }

  if (modelType === "attendance") {
    if (role === "STUDENT") return { student: { userId } };
    if (role === "PARENT") return { student: { parent: { userId } } };
  }

  if (modelType === "fee") {
    if (role === "STUDENT") return { student: { userId } };
    if (role === "PARENT") return { student: { parent: { userId } } };
  }

  // Fallback: deny all by searching for impossible ID
  return { id: "UNAUTHORIZED_DENY_ALL" };
}
