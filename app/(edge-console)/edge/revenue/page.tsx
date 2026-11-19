import type { Metadata } from "next";
import { EdgeRevenueModule } from "@/components/edge/revenue-operations/edge-revenue-module";

export const metadata: Metadata = {
  title: "Revenue | Edge Console",
  description:
    "SaaS business & revenue operations — MRR, retention, assurance, commissions (P11)",
};

/**
 * Edge Admin Console — Revenue Operations (P11).
 * Header chrome lives in EdgeStudioShell inside the module.
 */
export default function EdgeRevenuePage() {
  return (
    <div className="p-6" data-testid="edge-revenue-page">
      <EdgeRevenueModule />
    </div>
  );
}
