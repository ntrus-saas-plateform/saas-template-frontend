import type { ReactNode } from "react";
import Link from "next/link";

const NAV = [
  { href: "/trust/security", label: "Sécurité" },
  { href: "/trust/privacy", label: "Confidentialité" },
  { href: "/trust/support", label: "Support" },
  { href: "/trust/status", label: "Statut" },
] as const;

export default function TrustLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen text-[var(--text-primary)]"
      style={{
        background:
          "linear-gradient(165deg, #0f1c2e 0%, #1a2f45 38%, #f3f6f9 38%)",
      }}
    >
      <header className="mx-auto flex w-full max-w-4xl flex-wrap items-end justify-between gap-4 px-6 pb-10 pt-10">
        <div>
          <Link
            href="/trust/security"
            className="block text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight text-white"
            style={{ fontFamily: "var(--font-signin-display), Georgia, serif" }}
          >
            Okapi
          </Link>
          <p className="mt-2 max-w-md type-sm text-white/75">
            Trust center — sécurité, confidentialité, support et statut
            d&apos;exploitation.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 type-sm text-white/85">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-4xl px-6 pb-20">{children}</main>
      <footer className="border-t border-[var(--border)] bg-[var(--bg-surface)] px-6 py-8 type-sm text-[var(--text-muted)]">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-4">
          <Link href="/acquire">Acquisition</Link>
          <Link href="/trust/privacy">Privacy</Link>
          <Link href="/trust/security">Security</Link>
        </div>
      </footer>
    </div>
  );
}
