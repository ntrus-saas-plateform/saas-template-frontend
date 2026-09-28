"use client";

import Keycloak from "keycloak-js";
import type { AuthSession, AuthUser, KeycloakPublicConfig } from "@/lib/auth/types";

let keycloakSingleton: Keycloak | null = null;
let initPromise: Promise<boolean> | null = null;

function getKeycloak(config: KeycloakPublicConfig): Keycloak {
  if (!keycloakSingleton) {
    keycloakSingleton = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });
  }
  return keycloakSingleton;
}

function mapUser(kc: Keycloak): AuthUser {
  const p = kc.tokenParsed as
    | { sub?: string; preferred_username?: string; email?: string; name?: string }
    | undefined;
  return {
    id: p?.sub,
    username: p?.preferred_username,
    email: p?.email,
    name: p?.name ?? p?.preferred_username,
  };
}

export async function initKeycloakSession(
  config: KeycloakPublicConfig,
): Promise<Omit<AuthSession, "status"> & { authenticated: boolean }> {
  const kc = getKeycloak(config);
  if (!initPromise) {
    initPromise = kc.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
      silentCheckSsoRedirectUri:
        typeof window !== "undefined"
          ? `${window.location.origin}/silent-check-sso.html`
          : undefined,
    });
  }
  const authenticated = await initPromise;

  return {
    authenticated,
    user: authenticated ? mapUser(kc) : null,
    getAccessToken: async () => {
      if (!kc.authenticated) return undefined;
      try {
        await kc.updateToken(30);
      } catch {
        return undefined;
      }
      return kc.token;
    },
    login: async () => {
      await kc.login({ redirectUri: window.location.origin });
    },
    logout: async () => {
      await kc.logout({ redirectUri: window.location.origin });
    },
    refreshToken: async () => {
      if (!kc.authenticated) return false;
      try {
        await kc.updateToken(-1);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function resetKeycloakSingleton() {
  keycloakSingleton = null;
  initPromise = null;
}
