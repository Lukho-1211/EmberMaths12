import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/types";

declare module "next-auth" {
  interface User {
    role: Role;
    province?: string;
    municipality?: string;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      province?: string;
      municipality?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    province?: string;
    municipality?: string;
  }
}
