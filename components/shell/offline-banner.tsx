"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { Alert } from "@/components/ui/alert";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;

  return (
    <div className="border-b border-amber-500/30 px-4 py-2">
      <Alert tone="warning" title="You're offline">
        <span className="inline-flex items-center gap-2">
          <WifiOff className="size-3.5" aria-hidden />
          Changes may not sync until the connection returns.
        </span>
      </Alert>
    </div>
  );
}
