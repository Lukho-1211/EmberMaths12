import { AppShell } from "@/components/app-shell";
import type { ReactNode } from "react";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <AppShell role="student">{children}</AppShell>;
}
