import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Public acquisition shell (decision 2A) — outside edge-console.
 */
export default function AcquirePublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen text-[var(--text-primary)]"
      style={{
        background:
          "radial-gradient(1200px 600px at 10% -10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent), radial-gradient(900px 500px at 90% 0%, color-mix(in srgb, var(--secondary) 12%, transparent), transparent), linear-gradient(180deg, #0b1220 0%, #122033 45%, #f8fafc 45%)",
      }}
    >
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pb-8 pt-8">
        <Link
          href="/acquire"
          className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-white"
          style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
        >
          Okapi
        </Link>
        <nav className="flex items-center gap-4 type-sm text-white/80">
          <Link href="/acquire" className="hover:text-white">
            Produits
          </Link>
          <Link href="/acquire/portal" className="hover:text-white">
            Portail
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 pb-16">{children}</main>
      <footer className="border-t border-[var(--border)] bg-[var(--bg-surface)] px-6 py-8 type-sm text-[var(--text-muted)]">
        <div className="mx-auto max-w-5xl">
          Okapi — acquisition publique. Compteurs et statuts uniquement depuis l&apos;API.
        </div>
      </footer>
    </div>
  );
}
