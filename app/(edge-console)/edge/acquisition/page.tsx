import type { Metadata } from "next";
import { EdgeAcquisitionModule } from "@/components/edge/acquisition/edge-acquisition-module";

export const metadata: Metadata = {
  title: "Acquisition | Edge Console",
  description:
    "Subscription acquisition CX — products, forms, applications and funnel (P10)",
};

/**
 * Edge Admin Console — Acquisition CX (P10).
 */
export default function EdgeAcquisitionPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-acquisition-page">
      <div>
        <h1 className="text-2xl font-semibold">Acquisition</h1>
        <p className="text-sm text-muted-foreground">
          Customer experience &amp; subscription acquisition. Counts and funnel
          come from the API only — never fabricated conversion rates.
        </p>
      </div>
      <EdgeAcquisitionModule />
    </div>
  );
}
