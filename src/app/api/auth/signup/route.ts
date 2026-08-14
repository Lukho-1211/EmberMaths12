import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isValidMunicipality } from "@/lib/sa-geography";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["admin", "student", "teacher", "parent"];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const input = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    province?: string;
    municipality?: string;
  };

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const role = input.role as Role | undefined;
  const province = typeof input.province === "string" ? input.province.trim() : undefined;
  const municipality =
    typeof input.municipality === "string" ? input.municipality.trim() : undefined;

  if (!name || !email || !password || !role || !ROLES.includes(role)) {
    return NextResponse.json(
      { ok: false, error: "Name, email, password, and a valid role are required." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }
  if (role === "student") {
    if (!province || !municipality) {
      return NextResponse.json(
        { ok: false, error: "Province and municipality are required for students." },
        { status: 400 },
      );
    }
    if (!isValidMunicipality(province, municipality)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please select a valid municipality for the chosen province.",
        },
        { status: 400 },
      );
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const id = `${role}-${crypto.randomUUID().slice(0, 8)}`;
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      passwordHash,
      role,
      province: role === "student" ? province : null,
      municipality: role === "student" ? municipality : null,
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      province: user.province ?? undefined,
      municipality: user.municipality ?? undefined,
      createdAt: user.createdAt.toISOString(),
    },
  });
}
