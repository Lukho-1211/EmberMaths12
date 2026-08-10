import { AppShell } from "@/components/app-shell";
import type { ReactNode } from "react";

export default function ParentLayout({ children }: { children: ReactNode }) {
  return <AppShell role="parent">{children}</AppShell>;
}
