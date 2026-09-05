import type { Role } from "@/lib/types";

export const ROLES: Role[] = ["student", "teacher", "parent", "admin"];

/** Roles that may self-register via public /signup. Admin is invite-only. */
export const PUBLIC_SIGNUP_ROLES: Role[] = ["student", "teacher", "parent"];

export function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}

export function isPublicSignupRole(value: string): value is Role {
  return (PUBLIC_SIGNUP_ROLES as string[]).includes(value);
}

export function roleLabel(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
