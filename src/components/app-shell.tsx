"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  Award,
  BookOpen,
  ClipboardCheck,
  Home,
  LogOut,
  MessagesSquare,
  ScanLine,
  School,
  Users,
  LayoutDashboard,
  GraduationCap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const NAV: Record<Role, { href: string; label: string; icon: typeof Home }[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/terms", label: "Terms & Lessons", icon: BookOpen },
    { href: "/admin/users", label: "Users & Teachers", icon: Users },
    { href: "/admin/groups", label: "Study Groups", icon: School },
    { href: "/admin/pass-fail", label: "Pass / Fail", icon: ClipboardCheck },
  ],
  student: [
    { href: "/student", label: "Dashboard", icon: Home },
    { href: "/student/learn", label: "Learn", icon: BookOpen },
    { href: "/student/badges", label: "Badges", icon: Award },
    { href: "/student/scan", label: "Scan & Correct", icon: ScanLine },
  ],
  teacher: [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/classes", label: "Classes", icon: School },
    { href: "/teacher/lessons", label: "Lessons", icon: BookOpen },
    { href: "/teacher/messages", label: "Parent Messages", icon: MessagesSquare },
  ],
  parent: [
    { href: "/parent", label: "Progress", icon: GraduationCap },
  ],
};

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { user, ready, logout } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?role=${role}`);
      return;
    }
    if (user.role !== role) {
      router.replace(`/${user.role}`);
    }
  }, [ready, user, role, router]);

  if (!ready || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
        Loading EmberMaths12…
      </div>
    );
  }

  const items = NAV[role];

  return (
    <div className="min-h-screen bg-surface text-ember-navy">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col bg-ember-navy text-ember-white md:flex">
          <div className="border-b border-white/10 px-5 py-6">
            <Link href={`/${role}`} className="font-display text-2xl">
              EmberMaths<span className="text-ember-gold">12</span>
            </Link>
            <p className="mt-1 text-xs uppercase tracking-widest text-ember-gray/80">{role}</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-ember-gold text-ember-navy font-semibold"
                      : "text-ember-gray hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ember-gray hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} /> Log out
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-ember-white px-4 py-3 md:px-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Signed in</p>
              <p className="font-semibold">{user.name}</p>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              {items.slice(0, 4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md bg-ember-navy px-2 py-1 text-xs text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <span className="hidden rounded-full bg-ember-gold/20 px-3 py-1 text-xs font-semibold text-ember-navy md:inline">
              {user.email}
            </span>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-ember-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-ember-navy">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl text-ember-navy">{title}</h1>
      {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
    </div>
  );
}
