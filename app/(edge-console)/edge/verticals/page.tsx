"use client";

import { Suspense } from "react";
import { EdgeVerticalsListStudio } from "@/components/edge/verticals/edge-verticals-studio";
import { EdgeLoadingState } from "@/components/edge/states";

export default function EdgeVerticalsPage() {
  return (
    <Suspense fallback={<EdgeLoadingState label="Loading verticals…" />}>
      <EdgeVerticalsListStudio />
    </Suspense>
  );
}
