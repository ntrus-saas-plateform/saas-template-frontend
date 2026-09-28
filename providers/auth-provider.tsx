"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createBffAuthSessionHandlers, readBffSession } from "@/lib/auth/bff-client";
import { initKeycloakSession } from "@/lib/auth/keycloak";
import { isBffAuthMode } from "@/lib/auth/mode";
import { readKeycloakConfig, type AuthSession } from "@/lib/auth/types";

const AuthContext = createContext<AuthSession | null>(null);

const unconfigured: AuthSession = {
  status: "unconfigured",
  user: null,
  getAccessToken: async () => undefined,
  login: async () => {},
  logout: async () => {},
  refreshToken: async () => false,
};

const loadingSession: AuthSession = {
  ...unconfigured,
  status: "loading",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(loadingSession);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (isBffAuthMode()) {
        const config = readKeycloakConfig();
        if (!config) {
          if (!cancelled) setSession(unconfigured);
          return;
        }
        const handlers = createBffAuthSessionHandlers();
        try {
          const s = await readBffSession();
          if (cancelled) return;
          setSession({
            ...handlers,
            status: s.authenticated ? "authenticated" : "anonymous",
            user: s.user,
            login: handlers.login,
            logout: handlers.logout,
            refreshToken: handlers.refreshToken,
            getAccessToken: handlers.getAccessToken,
          });
        } catch {
          if (cancelled) return;
          setSession({
            ...handlers,
            status: "anonymous",
            user: null,
          });
        }
        return;
      }

      const config = readKeycloakConfig();
      if (!config) {
        if (!cancelled) setSession(unconfigured);
        return;
      }

      try {
        const kc = await initKeycloakSession(config);
        if (cancelled) return;
        setSession({
          status: kc.authenticated ? "authenticated" : "anonymous",
          user: kc.user,
          getAccessToken: kc.getAccessToken,
          login: kc.login,
          logout: kc.logout,
          refreshToken: kc.refreshToken,
        });
      } catch {
        if (cancelled) return;
        setSession({
          ...unconfigured,
          status: "anonymous",
          login: async () => {
            const again = await initKeycloakSession(config);
            await again.login();
          },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => session, [session]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthSession {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
