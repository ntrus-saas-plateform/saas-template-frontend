"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { edgeApi } from "@/lib/api/edge";
import { useEdgeSession } from "@/providers/edge-session-provider";
import type {
  EdgeActiveWorkspace,
  EdgeAdministrator,
  EdgeWorkspaceOption,
} from "@/types/edge";

type EdgePlatformState = {
  me: EdgeAdministrator | null;
  permissions: string[];
  workspaces: EdgeWorkspaceOption[];
  activeWorkspace: EdgeActiveWorkspace | null;
  activeVerticalId: string | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  switchWorkspace: (verticalId: string) => Promise<void>;
};

const EdgePlatformContext = createContext<EdgePlatformState | null>(null);

export function EdgePlatformProvider({ children }: { children: ReactNode }) {
  const session = useEdgeSession();
  const queryClient = useQueryClient();
  const authenticated = session.status === "authenticated";

  const bootQuery = useQuery({
    queryKey: ["edge", "bootstrap"],
    enabled: authenticated,
    queryFn: async () => {
      const { data } = await edgeApi.bootstrap();
      return data;
    },
    staleTime: 30_000,
  });

  const switchWorkspace = useCallback(
    async (verticalId: string) => {
      await edgeApi.switchWorkspace(verticalId);
      await queryClient.invalidateQueries({ queryKey: ["edge"] });
      await session.refresh();
    },
    [queryClient, session],
  );

  const refetch = useCallback(async () => {
    await bootQuery.refetch();
  }, [bootQuery]);

  const value: EdgePlatformState = useMemo(() => {
    const bootError: Error | null = bootQuery.isError
      ? bootQuery.error instanceof Error
        ? bootQuery.error
        : new Error("Edge bootstrap failed")
      : null;

    return {
      me: bootQuery.data?.me ?? null,
      permissions: bootQuery.data?.permissions ?? [],
      workspaces: bootQuery.data?.workspaces ?? [],
      activeWorkspace: bootQuery.data?.activeWorkspace ?? null,
      activeVerticalId:
        bootQuery.data?.activeVerticalId ??
        bootQuery.data?.activeWorkspace?.vertical?.id ??
        bootQuery.data?.activeWorkspace?.session?.verticalId ??
        null,
      isLoading: authenticated && bootQuery.isLoading,
      isError: bootQuery.isError,
      error: bootError,
      refetch,
      switchWorkspace,
    };
  }, [authenticated, bootQuery, refetch, switchWorkspace]);

  return (
    <EdgePlatformContext.Provider value={value}>
      {children}
    </EdgePlatformContext.Provider>
  );
}

export function useEdgePlatform(): EdgePlatformState {
  const ctx = useContext(EdgePlatformContext);
  if (!ctx) {
    throw new Error("useEdgePlatform must be used within EdgePlatformProvider");
  }
  return ctx;
}
