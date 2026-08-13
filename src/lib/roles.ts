import type { Role } from "@/lib/types";

export const ROLES: Role[] = ["student", "teacher", "parent", "admin"];

export const DEMO_EMAILS: Record<Role, string> = {
  admin: "admin@ember12.za",
  student: "student@ember12.za",
  teacher: "teacher@ember12.za",
  parent: "parent@ember12.za",
};

export function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}

export function roleLabel(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
