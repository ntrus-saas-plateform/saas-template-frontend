import type { Metadata } from "next";
import { EdgeAcquisitionModule } from "@/components/edge/acquisition/edge-acquisition-module";

export const metadata: Metadata = {
  title: "Acquisition | Edge Console",
  description:
    "Subscription acquisition CX — products, forms, applications and funnel (P10)",
};

/**
 * Edge Admin Console — Acquisition CX (P10).
 * Header chrome lives in EdgeStudioShell inside the module.
 */
export default function EdgeAcquisitionPage() {
  return (
    <div className="p-6" data-testid="edge-acquisition-page">
      <EdgeAcquisitionModule />
    </div>
  );
}
