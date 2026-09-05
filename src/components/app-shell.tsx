"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  Award,
  BookOpen,
  ClipboardCheck,
  FileStack,
  Home,
  LogOut,
  MessagesSquare,
  School,
  Settings,
  Trophy,
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
    { href: "/admin/achievers", label: "Top Achievers", icon: Trophy },
  ],
  student: [
    { href: "/student", label: "Dashboard", icon: Home },
    { href: "/student/learn", label: "Learn", icon: BookOpen },
    { href: "/student/past-papers", label: "Past papers", icon: FileStack },
    { href: "/student/badges", label: "Badges", icon: Award },
    { href: "/student/achievers", label: "Top Achievers", icon: Trophy },
    { href: "/student/settings", label: "Settings", icon: Settings },
  ],
  teacher: [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/classes", label: "Classes", icon: School },
    { href: "/teacher/progress", label: "Progress", icon: ClipboardCheck },
    { href: "/teacher/achievers", label: "Top Achievers", icon: Trophy },
    { href: "/teacher/lessons", label: "Lessons", icon: BookOpen },
    { href: "/teacher/messages", label: "Parent Messages", icon: MessagesSquare },
    { href: "/teacher/settings", label: "Settings", icon: Settings },
  ],
  parent: [
    { href: "/parent", label: "Progress", icon: GraduationCap },
    { href: "/parent/settings", label: "Settings", icon: Settings },
  ],
};

function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-surface text-foreground" aria-busy="true" aria-label="Loading">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col bg-[#14213d] md:flex">
          <div className="border-b border-white/10 px-5 py-6">
            <div className="h-7 w-40 animate-pulse rounded bg-white/15" />
            <div className="mt-2 h-3 w-16 animate-pulse rounded bg-white/10" />
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-md bg-white/10"
                style={{ width: `${72 + (i % 3) * 10}%` }}
              />
            ))}
          </nav>
          <div className="m-3 h-9 animate-pulse rounded-md bg-white/10" />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:px-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Signed in</p>
              <div className="mt-1 h-5 w-36 animate-pulse rounded bg-border" />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden h-7 w-40 animate-pulse rounded-full bg-border md:block" />
              <div className="h-8 w-20 animate-pulse rounded-md bg-border" />
            </div>
          </header>
          <main className="flex-1 space-y-4 px-4 py-6 md:px-8">
            <div className="h-9 w-56 animate-pulse rounded bg-border" />
            <div className="h-4 w-80 max-w-full animate-pulse rounded bg-border" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-28 animate-pulse rounded-xl bg-border" />
              <div className="h-28 animate-pulse rounded-xl bg-border" />
              <div className="h-28 animate-pulse rounded-xl bg-border sm:col-span-2 lg:col-span-1" />
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-border" />
          </main>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { user, ready, logout, signingOut } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7314/ingest/544156a0-1eaf-4d8c-a641-963e0cde3691',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e7039'},body:JSON.stringify({sessionId:'3e7039',runId:'pre-fix',hypothesisId:'E',location:'app-shell.tsx:gate',message:'AppShell gate',data:{ready,hasUser:Boolean(user),userRole:user?.role ?? null,expectedRole:role,signingOut,pathname,willRedirectToLogin:ready && !user && !signingOut,willRedirectToOwnPortal:ready && Boolean(user) && user?.role !== role},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!ready) return;
    if (!user) {
      // Logout clears the session then hard-navigates home; skip role-login redirect.
      if (signingOut) return;
      router.replace(`/login/${role}`);
      return;
    }
    if (user.role !== role) {
      router.replace(`/${user.role}`);
    }
  }, [ready, user, role, router, signingOut]);

  if (!ready || !user || user.role !== role) {
    return <AppShellSkeleton />;
  }

  const items = NAV[role];

  function handleLogout() {
    void logout().then(() => {
      window.location.assign("/");
    });
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col bg-[#14213d] text-white md:flex">
          <div className="border-b border-white/10 px-5 py-6">
            <Link href={`/${role}`} className="font-display text-2xl">
              Ember Maths<span className="text-ember-gold">12</span>
            </Link>
            <p className="mt-1 text-xs uppercase tracking-widest text-white/70">{role}</p>
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
                      ? "bg-ember-gold font-semibold text-[#14213d]"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
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
            onClick={handleLogout}
            className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} /> Log out
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:px-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Signed in</p>
              <p className="font-semibold text-foreground">{user.name}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex flex-wrap items-center gap-2 md:hidden">
                {(() => {
                  const primary = items.slice(0, 3);
                  const settingsItem = items.find((item) => item.href.endsWith("/settings"));
                  const mobileItems =
                    settingsItem && !primary.some((item) => item.href === settingsItem.href)
                      ? [...primary, settingsItem]
                      : primary;
                  return mobileItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md bg-[#14213d] px-2 py-1 text-xs text-white"
                    >
                      {item.label}
                    </Link>
                  ));
                })()}
              </div>
              <span className="hidden rounded-full bg-ember-gold/20 px-3 py-1 text-xs font-semibold text-foreground md:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
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
      <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl text-foreground">{title}</h1>
      {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
    </div>
  );
}
