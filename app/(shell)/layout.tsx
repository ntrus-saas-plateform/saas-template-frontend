"use client";

import { AuthGate } from "@/components/shell/auth-gate";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate>{children}</AuthGate>;
}
