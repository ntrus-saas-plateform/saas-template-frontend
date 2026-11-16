import type { Metadata } from "next";
import { EdgeRevenueModule } from "@/components/edge/revenue-operations/edge-revenue-module";

export const metadata: Metadata = {
  title: "Revenue | Edge Console",
  description:
    "SaaS business & revenue operations — MRR, retention, assurance, commissions (P11)",
};

/**
 * Edge Admin Console — Revenue Operations (P11).
 */
export default function EdgeRevenuePage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-revenue-page">
      <div>
        <h1 className="text-2xl font-semibold">Revenue</h1>
        <p className="text-sm text-muted-foreground">
          Business &amp; revenue operations. Metrics come from stored snapshots
          only — never fabricated. Contracted ≠ invoiced ≠ collected; GRR
          excludes expansion.
        </p>
      </div>
      <EdgeRevenueModule />
    </div>
  );
}
