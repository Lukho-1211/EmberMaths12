import { AppShell } from "@/components/app-shell";
import type { ReactNode } from "react";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <AppShell role="teacher">{children}</AppShell>;
}
