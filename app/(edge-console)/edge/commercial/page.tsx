"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

type Tab =
  | "catalog"
  | "markets"
  | "icps"
  | "packages"
  | "plans"
  | "addons"
  | "pricing"
  | "enterprise"
  | "personas"
  | "configurator";

const TABS: { id: Tab; label: string; permission: string }[] = [
  { id: "catalog", label: "Catalog", permission: "platform:commercial:catalog:read" },
  { id: "markets", label: "Markets", permission: "platform:commercial:markets:read" },
  { id: "icps", label: "ICPs", permission: "platform:commercial:icp:manage" },
  { id: "packages", label: "Packages", permission: "platform:commercial:packages:read" },
  { id: "plans", label: "Plans", permission: "platform:commercial:plans:read" },
  { id: "addons", label: "Add-ons", permission: "platform:commercial:catalog:read" },
  { id: "pricing", label: "Pricing", permission: "platform:pricing:read" },
  { id: "enterprise", label: "Enterprise", permission: "platform:commercial:plans:read" },
  { id: "personas", label: "Personas", permission: "platform:commercial:personas:manage" },
  {
    id: "configurator",
    label: "Configurator",
    permission: "platform:commercial:catalog:read",
  },
];

export default function EdgeCommercialPage() {
  const queryClient = useQueryClient();
  const { permissions, activeVerticalId } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const anyAllowed =
    !permissionKnown ||
    TABS.some((t) => hasEdgePermission(permissions, t.permission));

  const [tab, setTab] = useState<Tab>("catalog");
  const [productId, setProductId] = useState("");
  const [catalogView, setCatalogView] = useState("GLOBAL");
  const [formError, setFormError] = useState<string | null>(null);

  const [marketCode, setMarketCode] = useState("");
  const [marketName, setMarketName] = useState("");
  const [marketVerticalId, setMarketVerticalId] = useState(
    activeVerticalId ?? "",
  );

  const [planCode, setPlanCode] = useState("");
  const [planName, setPlanName] = useState("");
  const [planTier, setPlanTier] = useState("PROFESSIONAL");

  const [icpCode, setIcpCode] = useState("");
  const [icpName, setIcpName] = useState("");
  const [icpVerticalId, setIcpVerticalId] = useState(activeVerticalId ?? "");

  const [pkgCode, setPkgCode] = useState("");
  const [pkgName, setPkgName] = useState("");

  const [addonCode, setAddonCode] = useState("");
  const [addonName, setAddonName] = useState("");

  const [entCode, setEntCode] = useState("");
  const [entName, setEntName] = useState("");
  const [entDeploymentMode, setEntDeploymentMode] = useState("DEDICATED");

  const [entryPlanId, setEntryPlanId] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");

  const [bookCode, setBookCode] = useState("");
  const [bookName, setBookName] = useState("");
  const [bookCurrency, setBookCurrency] = useState("USD");

  const [previewAmount, setPreviewAmount] = useState("");
  const [previewCurrency, setPreviewCurrency] = useState("USD");
  const [previewQty, setPreviewQty] = useState("1");
  const [previewModel, setPreviewModel] = useState("PER_USER");
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const [configPlanId, setConfigPlanId] = useState("");
  const [configResult, setConfigResult] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["edge", "products", "commercial"],
    enabled: anyAllowed,
    queryFn: async () => {
      const { data } = await edgeApi.listProducts({ limit: 100 });
      return data ?? [];
    },
  });

  const catalogQuery = useQuery({
    queryKey: ["edge", "commercial", "catalog", catalogView, productId || "all"],
    enabled: anyAllowed && tab === "catalog",
    queryFn: async () => {
      const { data } = await edgeApi.getCommercialCatalog({
        view: catalogView,
        productId: productId || undefined,
      });
      return data as {
        view: string;
        note?: string;
        plans?: { id: string; code: string; name: string; status: string }[];
        packages?: { id: string; code: string; name: string; status: string }[];
        addons?: { id: string; code: string; name: string; status: string }[];
        priceBooks?: { id: string; code: string; currency: string; status: string }[];
        enterpriseTemplates?: {
          id: string;
          code: string;
          name: string;
          status: string;
        }[];
      };
    },
  });

  const marketsQuery = useQuery({
    queryKey: ["edge", "commercial", "markets"],
    enabled: anyAllowed && tab === "markets",
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialMarkets({ limit: 100 });
      return data;
    },
  });

  const enterpriseQuery = useQuery({
    queryKey: ["edge", "commercial", "enterprise", productId || "all"],
    enabled: anyAllowed && tab === "enterprise",
    queryFn: async () => {
      const { data } = await edgeApi.listEnterpriseTemplates(
        productId || undefined,
      );
      return (data as { id: string; code: string; name: string; status: string }[]) ?? [];
    },
  });

  const personasQuery = useQuery({
    queryKey: ["edge", "commercial", "personas", productId || "all"],
    enabled: anyAllowed && tab === "personas",
    queryFn: async () => {
      const { data } = await edgeApi.listPersonas(productId || undefined);
      return (
        (data as {
          id: string;
          code: string;
          name: string;
          roleLabel: string;
          status: string;
        }[]) ?? []
      );
    },
  });

  const icpsQuery = useQuery({
    queryKey: ["edge", "commercial", "icps", productId || "all"],
    enabled: anyAllowed && tab === "icps",
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialIcps(productId || undefined);
      return data ?? [];
    },
  });

  const packagesQuery = useQuery({
    queryKey: ["edge", "commercial", "packages", productId || "all"],
    enabled: anyAllowed && tab === "packages",
    queryFn: async () => {
      const { data } = await edgeApi.listSolutionPackages(
        productId || undefined,
      );
      return data ?? [];
    },
  });

  const plansQuery = useQuery({
    queryKey: ["edge", "commercial", "plans", productId || "all"],
    enabled: anyAllowed && tab === "plans",
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialPlans(
        productId || undefined,
      );
      return data ?? [];
    },
  });

  const addonsQuery = useQuery({
    queryKey: ["edge", "commercial", "addons", productId || "all"],
    enabled: anyAllowed && tab === "addons",
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialAddons(
        productId || undefined,
      );
      return data ?? [];
    },
  });

  const booksQuery = useQuery({
    queryKey: ["edge", "commercial", "price-books", productId || "all"],
    enabled: anyAllowed && tab === "pricing",
    queryFn: async () => {
      const { data } = await edgeApi.listPriceBooks(productId || undefined);
      return data ?? [];
    },
  });

  const createMarket = useMutation({
    mutationFn: async () =>
      edgeApi.createCommercialMarket({
        code: marketCode.trim(),
        name: marketName.trim(),
        verticalId: marketVerticalId,
      }),
    onSuccess: async () => {
      setMarketCode("");
      setMarketName("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "markets"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Failed to create market",
      );
    },
  });

  const createPlan = useMutation({
    mutationFn: async () =>
      edgeApi.createCommercialPlan({
        code: planCode.trim(),
        name: planName.trim(),
        productId,
        planTier,
      }),
    onSuccess: async () => {
      setPlanCode("");
      setPlanName("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "plans"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Failed to create plan",
      );
    },
  });

  const createIcp = useMutation({
    mutationFn: async () =>
      edgeApi.createCommercialIcp({
        code: icpCode.trim(),
        name: icpName.trim(),
        productId,
        verticalId: icpVerticalId,
      }),
    onSuccess: async () => {
      setIcpCode("");
      setIcpName("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "icps"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Failed to create ICP",
      );
    },
  });

  const createPackage = useMutation({
    mutationFn: async () =>
      edgeApi.createSolutionPackage({
        code: pkgCode.trim(),
        name: pkgName.trim(),
        productId,
      }),
    onSuccess: async () => {
      setPkgCode("");
      setPkgName("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "packages"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Failed to create package",
      );
    },
  });

  const createAddon = useMutation({
    mutationFn: async () =>
      edgeApi.createCommercialAddon({
        code: addonCode.trim(),
        name: addonName.trim(),
        productId,
      }),
    onSuccess: async () => {
      setAddonCode("");
      setAddonName("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "addons"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Failed to create add-on",
      );
    },
  });

  const addEntry = useMutation({
    mutationFn: async () =>
      edgeApi.addPriceBookEntry(selectedBookId, {
        commercialItemType: "PLAN",
        commercialItemId: entryPlanId,
        amount: entryAmount.trim(),
      }),
    onSuccess: async () => {
      setEntryAmount("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "price-books"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Failed to add price entry",
      );
    },
  });

  const createEnterprise = useMutation({
    mutationFn: async () =>
      edgeApi.createEnterpriseTemplate({
        code: entCode.trim(),
        name: entName.trim(),
        productId,
        deploymentProfile: { mode: entDeploymentMode.trim() || "DEDICATED" },
      }),
    onSuccess: async () => {
      setEntCode("");
      setEntName("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "enterprise"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError
          ? err.message
          : "Failed to create enterprise template",
      );
    },
  });

  const publishPackage = useMutation({
    mutationFn: async (packageId: string) =>
      edgeApi.publishSolutionPackage(packageId),
    onSuccess: async () => {
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "packages"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Failed to publish package",
      );
    },
  });

  const publishAddon = useMutation({
    mutationFn: async (addonId: string) =>
      edgeApi.publishCommercialAddon(addonId),
    onSuccess: async () => {
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "addons"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Failed to publish add-on",
      );
    },
  });

  const publishEnterprise = useMutation({
    mutationFn: async (templateId: string) =>
      edgeApi.publishEnterpriseTemplate(templateId),
    onSuccess: async () => {
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "enterprise"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError
          ? err.message
          : "Failed to publish enterprise template",
      );
    },
  });

  const evaluateOffer = useMutation({
    mutationFn: async (input: { offerType: string; offerId: string }) =>
      edgeApi.evaluateOfferReadiness(input.offerType, input.offerId),
    onSuccess: async (_data, vars) => {
      setFormError(null);
      setConfigResult(
        `Readiness ${vars.offerType}/${vars.offerId}: evaluated`,
      );
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError
          ? err.message
          : "Failed to evaluate readiness",
      );
    },
  });

  const createBook = useMutation({
    mutationFn: async () =>
      edgeApi.createPriceBook({
        code: bookCode.trim(),
        name: bookName.trim(),
        productId,
        currency: bookCurrency.trim().toUpperCase(),
      }),
    onSuccess: async () => {
      setBookCode("");
      setBookName("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "price-books"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError
          ? err.message
          : "Failed to create price book",
      );
    },
  });

  const configureOffer = useMutation({
    mutationFn: async () =>
      edgeApi.configureCommercialOffer({
        productId,
        planId: configPlanId,
        mode: "MANUAL_CONFIGURATION",
      }),
    onSuccess: (res) => {
      const data = res.data as {
        decision?: string;
        grantsEntitlements?: boolean;
        unsatisfied?: string[];
      };
      setConfigResult(
        `Decision: ${data.decision ?? "?"} · entitlements granted: ${
          data.grantsEntitlements === false ? "no" : "?"
        } · unsatisfied: ${(data.unsatisfied ?? []).length}`,
      );
      setFormError(null);
    },
    onError: (err) => {
      setConfigResult(null);
      setFormError(
        err instanceof EdgeApiError ? err.message : "Configuration failed",
      );
    },
  });

  const previewPrice = useMutation({
    mutationFn: async () =>
      edgeApi.previewCommercialPrice({
        baseAmount: previewAmount.trim(),
        currency: previewCurrency.trim().toUpperCase(),
        quantity: Number(previewQty) || 1,
        modelType: previewModel,
      }),
    onSuccess: (res) => {
      const data = res.data as { amount?: string; currency?: string };
      setPreviewResult(
        data?.amount && data?.currency
          ? `${data.amount} ${data.currency}`
          : JSON.stringify(res.data),
      );
      setFormError(null);
    },
    onError: (err) => {
      setPreviewResult(null);
      setFormError(
        err instanceof EdgeApiError ? err.message : "Preview failed",
      );
    },
  });

  const products = useMemo(
    () => productsQuery.data ?? [],
    [productsQuery.data],
  );

  if (!anyAllowed) {
    return (
      <EdgeForbiddenState description="Requires commercial catalog permissions." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Commercial catalog
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Market intelligence, ICPs, solution packages, plans, add-ons and
          price books — governed against P1 products and capabilities. No
          invented prices or market sizes.
        </p>
      </header>

      <div className="flex flex-wrap gap-[var(--space-2)]">
        {TABS.map((t) => {
          const allowed =
            !permissionKnown ||
            hasEdgePermission(permissions, t.permission);
          return (
            <button
              key={t.id}
              type="button"
              disabled={!allowed}
              onClick={() => {
                setTab(t.id);
                setFormError(null);
              }}
              className={`min-h-[var(--touch-min)] rounded-[var(--radius-sm)] px-[var(--space-3)] type-sm ${
                tab === t.id
                  ? "bg-[var(--primary)] text-[var(--on-primary)] font-semibold"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
              } disabled:opacity-40`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {(tab === "catalog" ||
        tab === "icps" ||
        tab === "packages" ||
        tab === "plans" ||
        tab === "addons" ||
        tab === "pricing" ||
        tab === "enterprise" ||
        tab === "personas" ||
        tab === "configurator") && (
        <label className="block max-w-md space-y-1 type-sm text-[var(--text-secondary)]">
          <span className="block type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Product filter
          </span>
          <select
            className={fieldControlClass}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {formError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {formError}
        </p>
      ) : null}

      {tab === "catalog" ? (
        <section className="space-y-[var(--space-4)]">
          <label className="block max-w-md space-y-1 type-sm">
            <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Catalog view
            </span>
            <select
              className={fieldControlClass}
              value={catalogView}
              onChange={(e) => setCatalogView(e.target.value)}
            >
              {["GLOBAL", "PRODUCT", "PUBLISHED", "INTERNAL", "VERTICAL"].map(
                (v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ),
              )}
            </select>
          </label>
          {catalogQuery.isLoading ? (
            <EdgeLoadingState />
          ) : catalogQuery.isError ? (
            <EdgeErrorState description="Unable to load catalog projection." />
          ) : (
            <div className="space-y-[var(--space-3)]">
              <p className="type-sm text-[var(--text-secondary)]">
                {catalogQuery.data?.note}
              </p>
              <p className="type-xs text-[var(--text-muted)]">
                Plans {catalogQuery.data?.plans?.length ?? 0} · Packages{" "}
                {catalogQuery.data?.packages?.length ?? 0} · Add-ons{" "}
                {catalogQuery.data?.addons?.length ?? 0} · Price books{" "}
                {catalogQuery.data?.priceBooks?.length ?? 0} · Enterprise{" "}
                {catalogQuery.data?.enterpriseTemplates?.length ?? 0}
              </p>
              <ul className="divide-y divide-[var(--border)]">
                {(catalogQuery.data?.plans ?? []).map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 py-[var(--space-3)]"
                  >
                    <span className="type-sm">
                      {p.name}{" "}
                      <span className="text-[var(--text-muted)]">({p.code})</span>
                    </span>
                    <Badge
                      tone={p.status === "PUBLISHED" ? "success" : "default"}
                    >
                      {p.status}
                    </Badge>
                  </li>
                ))}
              </ul>
              {(catalogQuery.data?.plans?.length ?? 0) === 0 ? (
                <EdgeEmptyState
                  title="Empty catalog view"
                  description="No commercial items match this projection yet."
                />
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {tab === "markets" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:commercial:markets:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createMarket.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Register market</h2>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={marketCode}
                onChange={(e) => setMarketCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={marketName}
                onChange={(e) => setMarketName(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Vertical ID"
                value={marketVerticalId}
                onChange={(e) => setMarketVerticalId(e.target.value)}
                required
              />
              <Button type="submit" disabled={createMarket.isPending}>
                Create market
              </Button>
            </form>
          </EdgePermissionGate>
          {marketsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : marketsQuery.isError ? (
            <EdgeErrorState
              description="Unable to load commercial markets."
              onRetry={() => marketsQuery.refetch()}
            />
          ) : (marketsQuery.data?.items?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No markets yet"
              description="Markets stay empty until research is registered. Unknown TAM/SAM remains unknown."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {marketsQuery.data?.items.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium text-[var(--text-primary)]">
                      {m.name}
                    </p>
                    <p className="type-xs text-[var(--text-muted)]">{m.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge>{m.marketStatus}</Badge>
                    <Badge tone="warning">{m.researchStatus}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "icps" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:commercial:icp:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!productId || !icpVerticalId) {
                  setFormError("Select a product and vertical for the ICP.");
                  return;
                }
                createIcp.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create ICP</h2>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={icpCode}
                onChange={(e) => setIcpCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={icpName}
                onChange={(e) => setIcpName(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Vertical ID"
                value={icpVerticalId}
                onChange={(e) => setIcpVerticalId(e.target.value)}
                required
              />
              <Button type="submit" disabled={createIcp.isPending}>
                Create ICP
              </Button>
            </form>
          </EdgePermissionGate>
          {icpsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : icpsQuery.isError ? (
            <EdgeErrorState description="Unable to load ICPs." />
          ) : (icpsQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No ICPs"
              description="Ideal customer profiles are product-scoped and versioned."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {icpsQuery.data?.map((icp) => (
                <li
                  key={icp.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{icp.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {icp.code} · v{icp.version}
                    </p>
                  </div>
                  <Badge>{icp.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "packages" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:commercial:packages:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!productId) {
                  setFormError("Select a product before creating a package.");
                  return;
                }
                createPackage.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create solution package</h2>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={pkgCode}
                onChange={(e) => setPkgCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                required
              />
              <Button type="submit" disabled={createPackage.isPending}>
                Create package
              </Button>
            </form>
          </EdgePermissionGate>
          {packagesQuery.isLoading ? (
            <EdgeLoadingState />
          ) : packagesQuery.isError ? (
            <EdgeErrorState description="Unable to load packages." />
          ) : (packagesQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No solution packages"
              description="Packages compose P1 capabilities for a single product."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {packagesQuery.data?.map((pkg) => (
                <li
                  key={pkg.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{pkg.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {pkg.code} · v{pkg.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{pkg.status}</Badge>
                    <EdgePermissionGate permission="platform:commercial:readiness:evaluate">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={evaluateOffer.isPending}
                        onClick={() =>
                          evaluateOffer.mutate({
                            offerType: "PACKAGE",
                            offerId: pkg.id,
                          })
                        }
                      >
                        Evaluate
                      </Button>
                    </EdgePermissionGate>
                    {pkg.status !== "PUBLISHED" ? (
                      <EdgePermissionGate permission="platform:commercial:offers:publish">
                        <Button
                          type="button"
                          size="sm"
                          disabled={publishPackage.isPending}
                          onClick={() => publishPackage.mutate(pkg.id)}
                        >
                          Publish
                        </Button>
                      </EdgePermissionGate>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "plans" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:commercial:plans:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!productId) {
                  setFormError("Select a product before creating a plan.");
                  return;
                }
                createPlan.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create plan</h2>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                required
              />
              <select
                className={fieldControlClass}
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value)}
              >
                {["LITE", "PROFESSIONAL", "BUSINESS", "ENTERPRISE", "CUSTOM"].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ),
                )}
              </select>
              <Button type="submit" disabled={createPlan.isPending}>
                Create plan
              </Button>
            </form>
          </EdgePermissionGate>
          {plansQuery.isLoading ? (
            <EdgeLoadingState />
          ) : plansQuery.isError ? (
            <EdgeErrorState description="Unable to load plans." />
          ) : (plansQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No commercial plans"
              description="Plans are per product. Publication requires commercial readiness."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {plansQuery.data?.map((plan) => (
                <li
                  key={plan.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{plan.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {plan.code} · {plan.planTier} · v{plan.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={plan.status === "PUBLISHED" ? "success" : "default"}
                    >
                      {plan.status}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/edge/commercial/plans/${plan.id}`}>
                        Open
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "addons" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:commercial:addons:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!productId) {
                  setFormError("Select a product before creating an add-on.");
                  return;
                }
                createAddon.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create add-on</h2>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={addonCode}
                onChange={(e) => setAddonCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={addonName}
                onChange={(e) => setAddonName(e.target.value)}
                required
              />
              <Button type="submit" disabled={createAddon.isPending}>
                Create add-on
              </Button>
            </form>
          </EdgePermissionGate>
          {addonsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : addonsQuery.isError ? (
            <EdgeErrorState description="Unable to load add-ons." />
          ) : (addonsQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No add-ons"
              description="Add-ons belong to one product and cannot cross product boundaries."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {addonsQuery.data?.map((addon) => (
                <li
                  key={addon.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{addon.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {addon.code} · {addon.addonType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{addon.status}</Badge>
                    <EdgePermissionGate permission="platform:commercial:readiness:evaluate">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={evaluateOffer.isPending}
                        onClick={() =>
                          evaluateOffer.mutate({
                            offerType: "ADDON",
                            offerId: addon.id,
                          })
                        }
                      >
                        Evaluate
                      </Button>
                    </EdgePermissionGate>
                    {addon.status !== "PUBLISHED" ? (
                      <EdgePermissionGate permission="platform:commercial:offers:publish">
                        <Button
                          type="button"
                          size="sm"
                          disabled={publishAddon.isPending}
                          onClick={() => publishAddon.mutate(addon.id)}
                        >
                          Publish
                        </Button>
                      </EdgePermissionGate>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "pricing" ? (
        <section className="space-y-[var(--space-5)]">
          <EdgePermissionGate permission="platform:pricing:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!productId) {
                  setFormError("Select a product before creating a price book.");
                  return;
                }
                createBook.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create price book</h2>
              <p className="type-xs text-[var(--text-muted)]">
                Currency is mandatory. Amounts use decimal precision — enter only
                validated commercial decisions, never invented tariffs.
              </p>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={bookCode}
                onChange={(e) => setBookCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="ISO currency (e.g. USD)"
                value={bookCurrency}
                onChange={(e) => setBookCurrency(e.target.value)}
                required
                maxLength={3}
              />
              <Button type="submit" disabled={createBook.isPending}>
                Create price book
              </Button>
            </form>
          </EdgePermissionGate>

          <EdgePermissionGate permission="platform:pricing:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!selectedBookId || !entryPlanId || !entryAmount.trim()) {
                  setFormError(
                    "Price book, plan id and decimal amount are required.",
                  );
                  return;
                }
                addEntry.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Add price entry</h2>
              <p className="type-xs text-[var(--text-muted)]">
                Enter only validated commercial amounts — never invent tariffs.
              </p>
              <select
                className={fieldControlClass}
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                required
              >
                <option value="">Select price book</option>
                {(booksQuery.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} ({b.currency})
                  </option>
                ))}
              </select>
              <input
                className={fieldControlClass}
                placeholder="Plan ID"
                value={entryPlanId}
                onChange={(e) => setEntryPlanId(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Amount (decimal string)"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                required
              />
              <Button type="submit" disabled={addEntry.isPending}>
                Add entry
              </Button>
            </form>
          </EdgePermissionGate>

          {booksQuery.isLoading ? (
            <EdgeLoadingState />
          ) : booksQuery.isError ? (
            <EdgeErrorState description="Unable to load price books." />
          ) : (booksQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No price books"
              description="Geographic price books stay empty until local pricing decisions are recorded."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {booksQuery.data?.map((book) => (
                <li
                  key={book.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{book.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {book.code} · {book.currency}
                      {book.geographicScope
                        ? ` · ${book.geographicScope}`
                        : ""}
                    </p>
                  </div>
                  <Badge>{book.status}</Badge>
                </li>
              ))}
            </ul>
          )}

          <form
            className="grid max-w-xl gap-[var(--space-3)] border-t border-[var(--border)] pt-[var(--space-4)]"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              previewPrice.mutate();
            }}
          >
            <h2 className="type-md font-semibold">Pricing preview</h2>
            <p className="type-xs text-[var(--text-muted)]">
              Deterministic calculation only — does not create invoices or
              subscriptions.
            </p>
            <input
              className={fieldControlClass}
              placeholder="Base amount (decimal string)"
              value={previewAmount}
              onChange={(e) => setPreviewAmount(e.target.value)}
              required
            />
            <input
              className={fieldControlClass}
              placeholder="Currency"
              value={previewCurrency}
              onChange={(e) => setPreviewCurrency(e.target.value)}
              required
              maxLength={3}
            />
            <input
              className={fieldControlClass}
              placeholder="Quantity"
              value={previewQty}
              onChange={(e) => setPreviewQty(e.target.value)}
              required
            />
            <select
              className={fieldControlClass}
              value={previewModel}
              onChange={(e) => setPreviewModel(e.target.value)}
            >
              {[
                "FLAT_FEE",
                "PER_USER",
                "PER_LOCATION",
                "PER_DEVICE",
                "PER_TRANSACTION",
                "ONE_TIME",
                "RECURRING",
                "HYBRID",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={previewPrice.isPending}>
              Preview
            </Button>
            {previewResult ? (
              <p className="type-sm text-[var(--text-primary)]">
                Result: {previewResult}
              </p>
            ) : null}
          </form>
        </section>
      ) : null}

      {tab === "enterprise" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:commercial:plans:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!productId) {
                  setFormError(
                    "Select a product before creating an enterprise template.",
                  );
                  return;
                }
                createEnterprise.mutate();
              }}
            >
              <h2 className="type-md font-semibold">
                Create enterprise template
              </h2>
              <p className="type-xs text-[var(--text-muted)]">
                Deployment profile is required for readiness. Enterprise is
                negotiated — not automatically On-Premise.
              </p>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={entCode}
                onChange={(e) => setEntCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={entName}
                onChange={(e) => setEntName(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Deployment mode"
                value={entDeploymentMode}
                onChange={(e) => setEntDeploymentMode(e.target.value)}
                required
              />
              <Button type="submit" disabled={createEnterprise.isPending}>
                Create enterprise template
              </Button>
            </form>
          </EdgePermissionGate>
          {enterpriseQuery.isLoading ? (
            <EdgeLoadingState />
          ) : enterpriseQuery.isError ? (
            <EdgeErrorState description="Unable to load enterprise templates." />
          ) : (enterpriseQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No enterprise templates"
              description="Enterprise is a negotiated commercial model — not automatically On-Premise."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {enterpriseQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{row.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">{row.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{row.status}</Badge>
                    <EdgePermissionGate permission="platform:commercial:readiness:evaluate">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={evaluateOffer.isPending}
                        onClick={() =>
                          evaluateOffer.mutate({
                            offerType: "ENTERPRISE_TEMPLATE",
                            offerId: row.id,
                          })
                        }
                      >
                        Evaluate
                      </Button>
                    </EdgePermissionGate>
                    {row.status !== "PUBLISHED" ? (
                      <EdgePermissionGate permission="platform:commercial:offers:publish">
                        <Button
                          type="button"
                          size="sm"
                          disabled={publishEnterprise.isPending}
                          onClick={() => publishEnterprise.mutate(row.id)}
                        >
                          Publish
                        </Button>
                      </EdgePermissionGate>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "personas" ? (
        <section>
          {personasQuery.isLoading ? (
            <EdgeLoadingState />
          ) : personasQuery.isError ? (
            <EdgeErrorState description="Unable to load personas." />
          ) : (personasQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No personas"
              description="Personas are role models, not CRM contacts."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {personasQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{row.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {row.code} · {row.roleLabel}
                    </p>
                  </div>
                  <Badge>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "configurator" ? (
        <section className="space-y-[var(--space-4)]">
          <p className="type-sm text-[var(--text-secondary)]">
            Deterministic eligibility check. Never grants entitlements or
            creates subscriptions.
          </p>
          <form
            className="grid max-w-xl gap-[var(--space-3)]"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (!productId || !configPlanId) {
                setFormError("Select a product and plan id.");
                return;
              }
              configureOffer.mutate();
            }}
          >
            <input
              className={fieldControlClass}
              placeholder="Plan ID"
              value={configPlanId}
              onChange={(e) => setConfigPlanId(e.target.value)}
              required
            />
            <Button type="submit" disabled={configureOffer.isPending}>
              Evaluate configuration
            </Button>
            {configResult ? (
              <p className="type-sm text-[var(--text-primary)]">{configResult}</p>
            ) : null}
          </form>
        </section>
      ) : null}
    </div>
  );
}
