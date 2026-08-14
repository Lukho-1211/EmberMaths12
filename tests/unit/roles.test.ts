import { describe, expect, it } from "vitest";
import { DEMO_EMAILS, isRole, roleLabel, ROLES } from "@/lib/roles";

describe("roles", () => {
  it("lists all portal roles", () => {
    expect(ROLES).toEqual(["student", "teacher", "parent", "admin"]);
  });

  it("narrows valid role strings", () => {
    expect(isRole("student")).toBe(true);
    expect(isRole("admin")).toBe(true);
    expect(isRole("guest")).toBe(false);
    expect(isRole("")).toBe(false);
  });

  it("capitalizes role labels", () => {
    expect(roleLabel("student")).toBe("Student");
    expect(roleLabel("admin")).toBe("Admin");
  });

  it("exposes demo emails per role", () => {
    expect(DEMO_EMAILS.student).toBe("student@ember12.za");
    expect(DEMO_EMAILS.teacher).toBe("teacher@ember12.za");
    expect(DEMO_EMAILS.parent).toBe("parent@ember12.za");
    expect(DEMO_EMAILS.admin).toBe("admin@ember12.za");
  });
});
