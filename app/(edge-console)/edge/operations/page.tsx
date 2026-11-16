import type { Metadata } from "next";
import { EdgeOperationsModule } from "@/components/edge/platform-operations/edge-operations-module";

export const metadata: Metadata = {
  title: "Operations | Edge Console",
  description:
    "Platform Operations Center — service catalog and operational overview (P9)",
};

/**
 * Edge Admin Console — Platform Operations Center (P9).
 */
export default function EdgeOperationsPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-operations-page">
      <div>
        <h1 className="text-2xl font-semibold">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Platform service catalog and operations overview. Health, alerts and
          incidents are shown as unavailable until P9.2+ integrations exist —
          never fabricated.
        </p>
      </div>
      <EdgeOperationsModule />
    </div>
  );
}
