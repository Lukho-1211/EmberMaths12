import type { Role } from "@/lib/types";

export const ROLES: Role[] = ["student", "teacher", "parent", "admin"];

export function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}

export function roleLabel(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
