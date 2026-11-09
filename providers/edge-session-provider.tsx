"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { edgeApi } from "@/lib/api/edge";
import { isEdgeBffConfigured } from "@/lib/edge-bff/keycloak";

export type EdgeAuthStatus =
  | "loading"
  | "authenticated"
  | "anonymous"
  | "unconfigured";

export type EdgeSessionUser = {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  picture?: string;
};

type EdgeSessionState = {
  status: EdgeAuthStatus;
  user: EdgeSessionUser | null;
  hasWorkspaceSession: boolean;
  activeVerticalId: string | null;
  login: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const EdgeSessionContext = createContext<EdgeSessionState | null>(null);

function edgeConfiguredOnClient(): boolean {
  const url =
    process.env.NEXT_PUBLIC_EDGE_KEYCLOAK_URL ||
    process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const realm =
    process.env.NEXT_PUBLIC_EDGE_KEYCLOAK_REALM || "edge-admin";
  const clientId =
    process.env.NEXT_PUBLIC_EDGE_KEYCLOAK_CLIENT_ID || "edge-admin-web";
  return Boolean(url && realm && clientId);
}

export function EdgeSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<EdgeAuthStatus>("loading");
  const [user, setUser] = useState<EdgeSessionUser | null>(null);
  const [hasWorkspaceSession, setHasWorkspaceSession] = useState(false);
  const [activeVerticalId, setActiveVerticalId] = useState<string | null>(null);

  const applySession = useCallback(
    (data: {
      authenticated: boolean;
      user: EdgeSessionUser | null;
      hasWorkspaceSession?: boolean;
      activeVerticalId?: string | null;
    }) => {
      setStatus(data.authenticated ? "authenticated" : "anonymous");
      setUser(data.user);
      setHasWorkspaceSession(Boolean(data.hasWorkspaceSession));
      setActiveVerticalId(data.activeVerticalId ?? null);
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!edgeConfiguredOnClient()) {
      setStatus("unconfigured");
      setUser(null);
      setHasWorkspaceSession(false);
      setActiveVerticalId(null);
      return;
    }
    try {
      const { data } = await edgeApi.session();
      applySession(data);
    } catch {
      setStatus("anonymous");
      setUser(null);
      setHasWorkspaceSession(false);
      setActiveVerticalId(null);
    }
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!edgeConfiguredOnClient()) {
        if (!cancelled) {
          setStatus("unconfigured");
          setUser(null);
        }
        return;
      }
      try {
        const { data } = await edgeApi.session();
        if (cancelled) return;
        applySession(data);
      } catch {
        if (cancelled) return;
        setStatus("anonymous");
        setUser(null);
        setHasWorkspaceSession(false);
        setActiveVerticalId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = useCallback(() => {
    // OAuth must leave the SPA document; router.push is insufficient for BFF login.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full navigation to Route Handler
    window.location.assign("/api/edge-auth/login");
  }, []);

  const logout = useCallback(async () => {
    try {
      const logoutUrl = await edgeApi.logout();
      // Full navigation required after HttpOnly session destroy (may be Keycloak URL).
      window.location.assign(logoutUrl);
    } catch {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- fallback hard navigation
      window.location.assign("/edge/login");
    }
  }, []);

  const value = useMemo<EdgeSessionState>(
    () => ({
      status,
      user,
      hasWorkspaceSession,
      activeVerticalId,
      login,
      logout,
      refresh,
    }),
    [
      status,
      user,
      hasWorkspaceSession,
      activeVerticalId,
      login,
      logout,
      refresh,
    ],
  );

  return (
    <EdgeSessionContext.Provider value={value}>
      {children}
    </EdgeSessionContext.Provider>
  );
}

export function useEdgeSession(): EdgeSessionState {
  const ctx = useContext(EdgeSessionContext);
  if (!ctx) {
    throw new Error("useEdgeSession must be used within EdgeSessionProvider");
  }
  return ctx;
}

/** Server-safe helper re-export for tests / diagnostics. */
export { isEdgeBffConfigured };
