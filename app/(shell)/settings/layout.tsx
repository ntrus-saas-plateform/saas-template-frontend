import { Suspense } from "react";
import SettingsNavLayout from "@/components/settings/settings-nav-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Suspense fallback={null}>
        <SettingsNavLayout>{children}</SettingsNavLayout>
      </Suspense>
    </div>
  );
}
