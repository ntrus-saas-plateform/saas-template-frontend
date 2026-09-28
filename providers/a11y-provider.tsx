"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePreferences } from "@/providers/preferences-provider";
import { getTheme, isThemeKnown, type AtlasThemeId } from "@/lib/themes";
import { identityApi } from "@/lib/api/identity";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

export type TextScale = "normal" | "large" | "xlarge";
export type FabEdge = "left" | "right";

export type FabPosition = {
  edge: FabEdge;
  y: number;
};

export type A11yState = {
  textScale: TextScale;
  highContrast: boolean;
  dyslexiaMode: boolean;
  largeCursor: boolean;
  underlineLinks: boolean;
  reducedMotion: boolean;
  fabPosition: FabPosition;
  setTextScale: (v: TextScale) => void;
  setHighContrast: (v: boolean) => void;
  setDyslexiaMode: (v: boolean) => void;
  setLargeCursor: (v: boolean) => void;
  setUnderlineLinks: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setFabPosition: (v: FabPosition) => void;
  applyAtlasTheme: (id: AtlasThemeId) => void;
  reset: () => void;
};

const STORAGE_KEY = "edge.a11y";
const PREV_THEME_KEY = "edge.a11y.previousTheme";
export const DEFAULT_FAB_POSITION: FabPosition = { edge: "right", y: -1 };

type Stored = {
  textScale: TextScale;
  highContrast: boolean;
  dyslexiaMode: boolean;
  largeCursor: boolean;
  underlineLinks: boolean;
  fabPosition: FabPosition;
};

const DEFAULTS: Stored = {
  textScale: "normal",
  highContrast: false,
  dyslexiaMode: false,
  largeCursor: false,
  underlineLinks: false,
  fabPosition: DEFAULT_FAB_POSITION,
};

function readStored(): Stored {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Stored>) };
  } catch {
    return DEFAULTS;
  }
}

function applyDom(state: {
  textScale: TextScale;
  dyslexiaMode: boolean;
  largeCursor: boolean;
  underlineLinks: boolean;
  reducedMotion: boolean;
}) {
  const root = document.documentElement;
  if (state.textScale === "normal") delete root.dataset.textScale;
  else root.dataset.textScale = state.textScale;
  root.dataset.dyslexia = state.dyslexiaMode ? "true" : "false";
  root.dataset.largeCursor = state.largeCursor ? "true" : "false";
  root.dataset.underlineLinks = state.underlineLinks ? "true" : "false";
  root.dataset.reducedMotion = state.reducedMotion ? "true" : "false";
}

const A11yContext = createContext<A11yState | null>(null);

export function A11yProvider({ children }: { children: ReactNode }) {
  const prefs = usePreferences();
  const { apiBaseReady } = usePlatform();
  const client = useApiClient();
  const [state, setState] = useState<Stored>(DEFAULTS);
  const persistTimer = useRef<number | null>(null);
  const hydratedApi = useRef(false);

  useEffect(() => {
    setState(readStored());
  }, []);

  const persist = useCallback(
    (next: Stored, atlasTheme = prefs.atlasTheme) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (!apiBaseReady) return;
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
      persistTimer.current = window.setTimeout(() => {
        void identityApi(client)
          .users.preferences.patch({
            "accessibility.textScale": next.textScale,
            "accessibility.highContrast": next.highContrast,
            "accessibility.dyslexiaMode": next.dyslexiaMode,
            "accessibility.largeCursor": next.largeCursor,
            "accessibility.underlineLinks": next.underlineLinks,
            "accessibility.reducedMotion": prefs.reducedMotion,
            "accessibility.fabEdge": next.fabPosition.edge,
            "accessibility.fabY": next.fabPosition.y,
            "ui.atlasTheme": atlasTheme,
            "ui.theme": getTheme(atlasTheme).mode,
          })
          .catch(() => undefined);
      }, 400);
    },
    [apiBaseReady, client, prefs.reducedMotion, prefs.atlasTheme],
  );

  const commit = useCallback(
    (patch: Partial<Stored>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  useEffect(() => {
    applyDom({
      textScale: state.textScale,
      dyslexiaMode: state.dyslexiaMode,
      largeCursor: state.largeCursor,
      underlineLinks: state.underlineLinks,
      reducedMotion: prefs.reducedMotion,
    });
  }, [state, prefs.reducedMotion]);

  useEffect(() => {
    if (!apiBaseReady || hydratedApi.current) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await identityApi(client).users.preferences.get();
        if (cancelled) return;
        const settings = res.data?.settings ?? {};
        setState((prev) => {
          const next = { ...prev };
          const scale = settings["accessibility.textScale"];
          if (scale === "normal" || scale === "large" || scale === "xlarge") {
            next.textScale = scale;
          }
          if (typeof settings["accessibility.highContrast"] === "boolean") {
            next.highContrast = settings["accessibility.highContrast"];
          }
          if (typeof settings["accessibility.dyslexiaMode"] === "boolean") {
            next.dyslexiaMode = settings["accessibility.dyslexiaMode"];
          }
          if (typeof settings["accessibility.largeCursor"] === "boolean") {
            next.largeCursor = settings["accessibility.largeCursor"];
          }
          if (typeof settings["accessibility.underlineLinks"] === "boolean") {
            next.underlineLinks = settings["accessibility.underlineLinks"];
          }
          const edge = settings["accessibility.fabEdge"];
          const y = settings["accessibility.fabY"];
          if (edge === "left" || edge === "right") {
            next.fabPosition = {
              edge,
              y: typeof y === "number" ? y : Number(y) || 0,
            };
          } else {
            const pos = settings["accessibility.fabPosition"];
            if (pos && typeof pos === "object") {
              const p = pos as FabPosition;
              if (p.edge === "left" || p.edge === "right") {
                next.fabPosition = { edge: p.edge, y: Number(p.y) || 0 };
              }
            }
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      } catch {
        /* keep local */
      } finally {
        hydratedApi.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBaseReady, client]);

  const setTextScale = useCallback(
    (v: TextScale) => commit({ textScale: v }),
    [commit],
  );

  const setHighContrast = useCallback(
    (v: boolean) => {
      const current = prefs.atlasTheme;
      let nextTheme: AtlasThemeId = current;
      if (v) {
        localStorage.setItem(PREV_THEME_KEY, current);
        nextTheme = getTheme(current).mode === "dark" ? "a11y-dark" : "a11y-light";
      } else {
        const prev = localStorage.getItem(PREV_THEME_KEY);
        nextTheme =
          prev &&
          isThemeKnown(prev) &&
          prev !== "a11y-light" &&
          prev !== "a11y-dark"
            ? prev
            : "corp-light";
      }
      prefs.setAtlasTheme(nextTheme);
      commit({ highContrast: v });
      persist({ ...state, highContrast: v }, nextTheme);
    },
    [commit, persist, prefs, state],
  );

  const applyAtlasTheme = useCallback(
    (id: AtlasThemeId) => {
      const hc = id === "a11y-light" || id === "a11y-dark";
      prefs.setAtlasTheme(id);
      commit({ highContrast: hc });
      persist({ ...state, highContrast: hc }, id);
    },
    [commit, persist, prefs, state],
  );

  const setDyslexiaMode = useCallback(
    (v: boolean) => commit({ dyslexiaMode: v }),
    [commit],
  );
  const setLargeCursor = useCallback(
    (v: boolean) => commit({ largeCursor: v }),
    [commit],
  );
  const setUnderlineLinks = useCallback(
    (v: boolean) => commit({ underlineLinks: v }),
    [commit],
  );
  const setReducedMotion = useCallback(
    (v: boolean) => {
      prefs.setReducedMotion(v);
      persist({ ...state, highContrast: state.highContrast });
    },
    [persist, prefs, state],
  );
  const setFabPosition = useCallback(
    (v: FabPosition) => commit({ fabPosition: v }),
    [commit],
  );

  const reset = useCallback(() => {
    setState(DEFAULTS);
    persist(DEFAULTS);
    prefs.setReducedMotion(false);
    if (prefs.atlasTheme === "a11y-light" || prefs.atlasTheme === "a11y-dark") {
      const prev = localStorage.getItem(PREV_THEME_KEY);
      prefs.setAtlasTheme(prev && isThemeKnown(prev) ? prev : "corp-light");
    }
  }, [persist, prefs]);

  const highContrast =
    state.highContrast ||
    prefs.atlasTheme === "a11y-light" ||
    prefs.atlasTheme === "a11y-dark";

  const value = useMemo<A11yState>(
    () => ({
      textScale: state.textScale,
      highContrast,
      dyslexiaMode: state.dyslexiaMode,
      largeCursor: state.largeCursor,
      underlineLinks: state.underlineLinks,
      reducedMotion: prefs.reducedMotion,
      fabPosition: state.fabPosition,
      setTextScale,
      setHighContrast,
      setDyslexiaMode,
      setLargeCursor,
      setUnderlineLinks,
      setReducedMotion,
      setFabPosition,
      applyAtlasTheme,
      reset,
    }),
    [
      state,
      highContrast,
      prefs.reducedMotion,
      setTextScale,
      setHighContrast,
      setDyslexiaMode,
      setLargeCursor,
      setUnderlineLinks,
      setReducedMotion,
      setFabPosition,
      applyAtlasTheme,
      reset,
    ],
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11y() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useA11y must be used within A11yProvider");
  return ctx;
}
