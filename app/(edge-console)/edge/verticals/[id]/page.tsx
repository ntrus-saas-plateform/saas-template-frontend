"use client";

import { useParams } from "next/navigation";
import { EdgeVerticalDetailStudio } from "@/components/edge/verticals/edge-verticals-studio";

export default function EdgeVerticalDetailPage() {
  const params = useParams<{ id: string }>();
  return <EdgeVerticalDetailStudio verticalId={params.id} />;
}
