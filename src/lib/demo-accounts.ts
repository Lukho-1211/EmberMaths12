import type { Role } from "@/lib/types";

export const DEMO_PASSWORD = "ember12";

/** Core demo accounts seeded into Supabase Auth for local/CI login. */
export const DEMO_SCHOOL_NAME = "Ember Maths Academy";

export const DEMO_DB_USERS: {
  id: string;
  name: string;
  email: string;
  role: Role;
  province?: string;
  municipality?: string;
  grade?: string;
  schoolName?: string;
  phone?: string;
  parentEmail?: string;
  createdAt: string;
}[] = [
  {
    id: "admin-1",
    name: "Thandi Admin",
    email: "admin@ember12.za",
    role: "admin",
    phone: "+27 11 555 0001",
    createdAt: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "teacher-1",
    name: "Mr. Naidoo",
    email: "teacher@ember12.za",
    role: "teacher",
    schoolName: DEMO_SCHOOL_NAME,
    phone: "+27 11 555 0200",
    createdAt: "2026-01-06T08:00:00.000Z",
  },
  {
    id: "student-1",
    name: "Lerato Molefe",
    email: "student@ember12.za",
    role: "student",
    province: "Gauteng",
    municipality: "City of Johannesburg",
    grade: "12",
    schoolName: DEMO_SCHOOL_NAME,
    phone: "+27 82 555 0101",
    parentEmail: "parent@ember12.za",
    createdAt: "2026-01-07T08:00:00.000Z",
  },
  {
    id: "parent-1",
    name: "Mrs. Molefe",
    email: "parent@ember12.za",
    role: "parent",
    phone: "+27 82 555 0102",
    createdAt: "2026-01-07T11:00:00.000Z",
  },
];
