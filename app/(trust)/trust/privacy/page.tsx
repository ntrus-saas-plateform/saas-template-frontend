import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité | Okapi Trust",
  description: "Privacy et traitement des données Okapi",
};

export default function TrustPrivacyPage() {
  return (
    <article className="space-y-6 rounded-none bg-[var(--bg-surface)] p-8 shadow-[0_20px_60px_rgba(15,28,46,0.12)]">
      <h1 className="text-3xl font-semibold tracking-tight">Confidentialité</h1>
      <p className="text-[var(--text-muted)]">
        Consentement technique validé sur les parcours acquisition. Le DPA
        beachhead et la revue juridique juridictionnelle complètent ce cadre.
      </p>
      <p className="type-sm">
        Voir aussi le{" "}
        <Link className="underline" href="/trust/support">
          support
        </Link>{" "}
        pour les demandes d&apos;accès / effacement.
      </p>
    </article>
  );
}
