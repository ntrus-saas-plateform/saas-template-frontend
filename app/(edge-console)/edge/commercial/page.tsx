"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { ListOrUuidField } from "@/components/edge/list-or-uuid-field";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import {
  EdgeStudioShell,
  useStudioSectionParam,
  type StudioSectionGroup,
} from "@/components/edge/studio";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

type Tab =
  | "catalog"
  | "markets"
  | "segments"
  | "icps"
  | "packages"
  | "plans"
  | "addons"
  | "pricing"
  | "enterprise"
  | "personas"
  | "configurator";

/** Capabilité liée renvoyée par GET plan/package/addon (restrictions = quotas JSONB). */
type OfferCapabilityRow = {
  capabilityId: string;
  capabilityCode?: string;
  inclusionType?: string;
  restrictions?: Record<string, unknown> | null;
};

/** Entry de price book telle que renvoyée par GET price-books/:id/entries. */
type PriceEntryRow = {
  id: string;
  amount: string;
  currency: string;
  commercialItemType?: string;
  conditions?: Record<string, unknown> | null;
};

const INCLUSION_TYPES = [
  "INCLUDED",
  "OPTIONAL",
  "RESTRICTED",
  "NOT_INCLUDED",
  "ADD_ON_REQUIRED",
  "ENTERPRISE_NEGOTIATED",
] as const;

const TABS: { id: Tab; label: string; permission: string }[] = [
  { id: "catalog", label: "Catalog", permission: "platform:commercial:catalog:read" },
  { id: "markets", label: "Markets", permission: "platform:commercial:markets:read" },
  { id: "segments", label: "Segments", permission: "platform:commercial:catalog:read" },
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

const COMMERCIAL_SECTION_IDS = TABS.map((t) => t.id) as Tab[];

const COMMERCIAL_STUDIO_GROUPS: { title: string; itemIds: Tab[] }[] = [
  { title: "Catalog offers", itemIds: ["catalog", "addons", "configurator"] },
  { title: "Markets/ICP", itemIds: ["markets", "segments", "icps"] },
  { title: "Packages/Plans", itemIds: ["packages", "plans", "pricing", "enterprise"] },
  { title: "Research", itemIds: ["personas"] },
];

export default function EdgeCommercialPage() {
  return (
    <Suspense fallback={<EdgeLoadingState label="Loading commercial studio…" />}>
      <EdgeCommercialStudio />
    </Suspense>
  );
}

function EdgeCommercialStudio() {
  const queryClient = useQueryClient();
  const { permissions, activeVerticalId } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const anyAllowed =
    !permissionKnown ||
    TABS.some((t) => hasEdgePermission(permissions, t.permission));

  const [tab, setTab] = useStudioSectionParam<Tab>(
    "catalog",
    COMMERCIAL_SECTION_IDS,
  );
  const [productId, setProductId] = useState("");
  const [catalogView, setCatalogView] = useState("GLOBAL");
  const [formError, setFormError] = useState<string | null>(null);

  const [marketCode, setMarketCode] = useState("");
  const [marketName, setMarketName] = useState("");
  const [marketVerticalId, setMarketVerticalId] = useState(
    activeVerticalId ?? "",
  );
  const [researchMarketId, setResearchMarketId] = useState("");
  const [researchCode, setResearchCode] = useState("");
  const [researchTitle, setResearchTitle] = useState("");
  const [researchProjectId, setResearchProjectId] = useState("");
  const [researchSourceTitle, setResearchSourceTitle] = useState("");
  const [segmentIntelId, setSegmentIntelId] = useState("");
  const [segmentScoreJson, setSegmentScoreJson] = useState('{"fit":0.7}');
  const [capabilityTarget, setCapabilityTarget] = useState({
    offerType: "package" as "package" | "plan" | "addon",
    offerId: "",
    capabilityId: "",
    inclusionType: "INCLUDED",
    numericLimit: "",
  });

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
  const [entryPriceSource, setEntryPriceSource] = useState<
    "MEASURED" | "ESTIMATED" | "NEEDS_RESEARCH"
  >("NEEDS_RESEARCH");
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
  const [wizardProductCode, setWizardProductCode] = useState<
    "SYNTIX_PHARMA" | "OKAPI_RESTAURANT"
  >("SYNTIX_PHARMA");
  const [wizardSites, setWizardSites] = useState("");
  const [wizardUsers, setWizardUsers] = useState("");
  const [wizardNeeds, setWizardNeeds] = useState("");
  const [wizardMode, setWizardMode] = useState<"MANUAL" | "RULE_BASED" | "GUIDED">(
    "GUIDED",
  );
  const [wizardResult, setWizardResult] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["edge", "products", "commercial"],
    enabled: anyAllowed,
    queryFn: async () => {
      const { data } = await edgeApi.listProducts({ limit: 100 });
      return data ?? [];
    },
  });

  const verticalsQuery = useQuery({
    queryKey: ["edge", "verticals", "commercial-pick"],
    enabled: anyAllowed,
    queryFn: async () => {
      const { data } = await edgeApi.listVerticals("page=1&limit=100");
      return data ?? [];
    },
    retry: false,
  });

  const verticalPickOptions = useMemo(
    () =>
      (verticalsQuery.data ?? []).map((v) => ({
        id: v.id,
        label: `${v.code ?? v.slug ?? v.id} — ${v.displayName ?? v.name ?? v.id}`,
      })),
    [verticalsQuery.data],
  );

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

  const researchProjectsQuery = useQuery({
    queryKey: ["edge", "commercial", "research", researchMarketId],
    enabled: tab === "markets" && Boolean(researchMarketId),
    queryFn: async () => {
      const res = await edgeApi.listResearchProjects(researchMarketId);
      return (res as { data?: unknown[] }).data ?? res;
    },
  });

  const segmentIntelQuery = useQuery({
    queryKey: ["edge", "commercial", "segment-intel", segmentIntelId],
    enabled: tab === "segments" && Boolean(segmentIntelId.trim()),
    queryFn: async () => {
      const res = await edgeApi.listSegmentIntelligence(
        segmentIntelId.trim() || undefined,
      );
      return (res as { data?: unknown[] }).data ?? res;
    },
  });

  const segmentsVerticalId = marketVerticalId || activeVerticalId || "";
  const segmentsQuery = useQuery({
    queryKey: ["edge", "commercial", "segments", segmentsVerticalId],
    enabled: anyAllowed && tab === "segments" && Boolean(segmentsVerticalId),
    queryFn: async () => {
      const { data } = await edgeApi.listMarketSegments(segmentsVerticalId);
      return data ?? [];
    },
  });
  const profilesQuery = useQuery({
    queryKey: ["edge", "commercial", "profiles", segmentsVerticalId],
    enabled: anyAllowed && tab === "segments" && Boolean(segmentsVerticalId),
    queryFn: async () => {
      const { data } = await edgeApi.listBusinessProfiles(segmentsVerticalId);
      return data ?? [];
    },
  });
  const operatingModelsQuery = useQuery({
    queryKey: ["edge", "commercial", "operating-models", segmentsVerticalId],
    enabled: anyAllowed && tab === "segments" && Boolean(segmentsVerticalId),
    queryFn: async () => {
      const { data } = await edgeApi.listOperatingModels(segmentsVerticalId);
      return data ?? [];
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
    enabled: anyAllowed && (tab === "plans" || tab === "packages"),
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialPlans(
        productId || undefined,
      );
      return data ?? [];
    },
  });

  const addonsQuery = useQuery({
    queryKey: ["edge", "commercial", "addons", productId || "all"],
    enabled: anyAllowed && (tab === "addons" || tab === "packages"),
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialAddons(
        productId || undefined,
      );
      return data ?? [];
    },
  });

  const capabilitiesQuery = useQuery({
    queryKey: ["edge", "capabilities", "commercial-link"],
    enabled: anyAllowed && tab === "packages",
    queryFn: async () => {
      const { data } = await edgeApi.listCapabilities();
      return data ?? [];
    },
  });

  const capabilityOfferOptions = useMemo(() => {
    const rows =
      capabilityTarget.offerType === "plan"
        ? (plansQuery.data ?? [])
        : capabilityTarget.offerType === "addon"
          ? (addonsQuery.data ?? [])
          : (packagesQuery.data ?? []);
    return rows.map((row) => ({
      id: row.id,
      label: `${row.code ?? row.id} — ${row.name ?? row.id}`,
    }));
  }, [
    capabilityTarget.offerType,
    packagesQuery.data,
    plansQuery.data,
    addonsQuery.data,
  ]);

  const capabilityPickOptions = useMemo(
    () =>
      (capabilitiesQuery.data ?? []).map((cap) => ({
        id: cap.id,
        label: `${cap.code ?? cap.id} — ${cap.name ?? cap.id}`,
      })),
    [capabilitiesQuery.data],
  );

  // Caps déjà liées à l'offre sélectionnée — montre capabilityCode + numericLimit (quota).
  const offerCapabilitiesQuery = useQuery({
    queryKey: [
      "edge",
      "commercial",
      "offer-capabilities",
      capabilityTarget.offerType,
      capabilityTarget.offerId,
    ],
    enabled:
      anyAllowed &&
      tab === "packages" &&
      capabilityTarget.offerId.trim().length > 0,
    queryFn: async (): Promise<OfferCapabilityRow[]> => {
      const { data } =
        capabilityTarget.offerType === "plan"
          ? await edgeApi.getCommercialPlan(capabilityTarget.offerId)
          : capabilityTarget.offerType === "addon"
            ? await edgeApi.getCommercialAddon(capabilityTarget.offerId)
            : await edgeApi.getSolutionPackage(capabilityTarget.offerId);
      return ((data as { capabilities?: OfferCapabilityRow[] })?.capabilities ??
        []) as OfferCapabilityRow[];
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

  // Entries du book sélectionné — montre amount + priceSource (gate G11#3 :
  // un book reste DRAFT tant que ses prix sont NEEDS_RESEARCH).
  const bookEntriesQuery = useQuery({
    queryKey: [
      "edge",
      "commercial",
      "price-book-entries",
      selectedBookId,
    ],
    enabled: anyAllowed && tab === "pricing" && selectedBookId !== "",
    queryFn: async (): Promise<PriceEntryRow[]> => {
      const { data } = await edgeApi.listPriceBookEntries(selectedBookId);
      return (data ?? []) as PriceEntryRow[];
    },
  });

  const discountPoliciesQuery = useQuery({
    queryKey: ["edge", "commercial", "discount-policies", productId || "all"],
    enabled: anyAllowed && tab === "pricing",
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialDiscountPolicies(
        productId || undefined,
      );
      return (data as Record<string, unknown>[]) ?? [];
    },
  });

  const pricingModelsQuery = useQuery({
    queryKey: ["edge", "commercial", "pricing-models", productId || "all"],
    enabled: anyAllowed && tab === "pricing",
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialPricingModels(
        productId || undefined,
      );
      return (data as Record<string, unknown>[]) ?? [];
    },
  });

  const usageMetricsQuery = useQuery({
    queryKey: ["edge", "commercial", "usage-metrics"],
    enabled: anyAllowed && tab === "pricing",
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialUsageMetrics();
      return (data as Record<string, unknown>[]) ?? [];
    },
  });

  const buyingCommitteesQuery = useQuery({
    queryKey: ["edge", "commercial", "buying-committees", productId || "all"],
    enabled: anyAllowed && tab === "personas",
    queryFn: async () => {
      const { data } = await edgeApi.listBuyingCommittees(productId || undefined);
      return (data as Record<string, unknown>[]) ?? [];
    },
  });

  const decisionJourneysQuery = useQuery({
    queryKey: ["edge", "commercial", "decision-journeys", productId || "all"],
    enabled: anyAllowed && tab === "personas",
    queryFn: async () => {
      const { data } = await edgeApi.listDecisionJourneys(productId || undefined);
      return (data as Record<string, unknown>[]) ?? [];
    },
  });

  const [discountCode, setDiscountCode] = useState("");
  const [discountName, setDiscountName] = useState("");
  const [pricingModelCode, setPricingModelCode] = useState("");
  const [pricingModelName, setPricingModelName] = useState("");
  const [pricingModelType, setPricingModelType] = useState("PER_USER");
  const [usageMetricCode, setUsageMetricCode] = useState("");
  const [usageMetricName, setUsageMetricName] = useState("");
  const [committeeCode, setCommitteeCode] = useState("");
  const [committeeName, setCommitteeName] = useState("");
  const [journeyCode, setJourneyCode] = useState("");
  const [journeyName, setJourneyName] = useState("");

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
        priceSource: entryPriceSource,
      }),
    onSuccess: async () => {
      setEntryAmount("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "price-books"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "price-book-entries"],
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

  const createDiscountPolicy = useMutation({
    mutationFn: async () =>
      edgeApi.createCommercialDiscountPolicy({
        code: discountCode.trim(),
        name: discountName.trim(),
        productId: productId || null,
        discountType: "PERCENT",
      }),
    onSuccess: async () => {
      setDiscountCode("");
      setDiscountName("");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "discount-policies"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Discount policy failed",
      );
    },
  });

  const createPricingModel = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error("Select a product first.");
      return edgeApi.createCommercialPricingModel({
        code: pricingModelCode.trim(),
        name: pricingModelName.trim(),
        modelType: pricingModelType,
        productId,
      });
    },
    onSuccess: async () => {
      setPricingModelCode("");
      setPricingModelName("");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "pricing-models"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Pricing model failed",
      );
    },
  });

  const createUsageMetric = useMutation({
    mutationFn: async () =>
      edgeApi.createCommercialUsageMetric({
        code: usageMetricCode.trim(),
        name: usageMetricName.trim(),
      }),
    onSuccess: async () => {
      setUsageMetricCode("");
      setUsageMetricName("");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "usage-metrics"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Usage metric failed",
      );
    },
  });

  const createBuyingCommittee = useMutation({
    mutationFn: async () =>
      edgeApi.createBuyingCommittee({
        code: committeeCode.trim(),
        name: committeeName.trim(),
        productId: productId || null,
      }),
    onSuccess: async () => {
      setCommitteeCode("");
      setCommitteeName("");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "buying-committees"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Buying committee failed",
      );
    },
  });

  const createDecisionJourney = useMutation({
    mutationFn: async () =>
      edgeApi.createDecisionJourney({
        code: journeyCode.trim(),
        name: journeyName.trim(),
        productId: productId || null,
      }),
    onSuccess: async () => {
      setJourneyCode("");
      setJourneyName("");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "decision-journeys"],
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError ? err.message : "Decision journey failed",
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

  const runOfferWizard = useMutation({
    mutationFn: async () => {
      const sitesTrim = wizardSites.trim();
      const usersTrim = wizardUsers.trim();
      const needs = wizardNeeds
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      return edgeApi.runCommercialOfferWizard({
        productCode: wizardProductCode,
        sites: sitesTrim === "" ? null : Number(sitesTrim),
        users: usersTrim === "" ? null : Number(usersTrim),
        needs: needs.length > 0 ? needs : undefined,
        mode: wizardMode,
      });
    },
    onSuccess: (res) => {
      const data = (res.data ?? {}) as {
        resolvedProfileCode?: string | null;
        recommendedPlanCode?: string | null;
        recommendedPackageCode?: string | null;
        eligibilityLabel?: string;
        decision?: string;
        grantsEntitlements?: boolean;
        unsatisfied?: string[];
      };
      const decision = data.decision ?? data.eligibilityLabel ?? "?";
      const grants =
        data.grantsEntitlements === false
          ? "false"
          : data.grantsEntitlements === true
            ? "true"
            : "?";
      const unsatisfiedCount = Array.isArray(data.unsatisfied)
        ? data.unsatisfied.length
        : 0;
      setWizardResult(
        [
          `Profile: ${data.resolvedProfileCode ?? "—"}`,
          `Plan: ${data.recommendedPlanCode ?? "—"}`,
          data.recommendedPackageCode
            ? `Package: ${data.recommendedPackageCode}`
            : null,
          `Decision: ${decision}`,
          `grantsEntitlements: ${grants}`,
          `Unsatisfied: ${unsatisfiedCount}`,
          "No subscription created",
        ]
          .filter(Boolean)
          .join(" · "),
      );
      setFormError(null);
    },
    onError: (err) => {
      setWizardResult(null);
      setFormError(
        err instanceof EdgeApiError ? err.message : "Offer wizard failed",
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

  const studioGroups: StudioSectionGroup[] = useMemo(() => {
    return COMMERCIAL_STUDIO_GROUPS.map((g) => ({
      title: g.title,
      items: g.itemIds
        .map((id) => TABS.find((t) => t.id === id))
        .filter((t): t is (typeof TABS)[number] => Boolean(t))
        .filter(
          (t) =>
            !permissionKnown || hasEdgePermission(permissions, t.permission),
        )
        .map((t) => ({ id: t.id, label: t.label })),
    })).filter((g) => g.items.length > 0);
  }, [permissionKnown, permissions]);

  if (!anyAllowed) {
    return (
      <EdgeForbiddenState description="Requires commercial catalog permissions." />
    );
  }

  return (
    <EdgeStudioShell
      title="Commercial studio"
      description="Market intelligence, ICPs, solution packages, plans, add-ons and price books — governed against P1 products and capabilities. No invented prices or market sizes."
      groups={studioGroups}
      section={tab}
      onSectionChange={(id) => {
        setTab(id as Tab);
        setFormError(null);
      }}
      actions={
        formError ? (
          <p className="type-sm text-[var(--danger)]" role="alert">
            {formError}
          </p>
        ) : null
      }
    >
      {(tab === "catalog" ||
        tab === "segments" ||
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

      {tab === "segments" ? (
        <section className="space-y-[var(--space-4)]">
          <div className="grid max-w-xl gap-[var(--space-3)]">
            <h2 className="type-md font-semibold">Beachhead taxonomy</h2>
            <ListOrUuidField
              value={marketVerticalId}
              onChange={setMarketVerticalId}
              options={verticalPickOptions}
              placeholder="Select vertical (required)"
              fallbackPlaceholder="Vertical ID (required)"
            />
            <p className="type-xs text-[var(--text-muted)]">
              Lists market segments, business profiles and operating models from
              Edge control-plane (Syntix seed via migrate/seed:rgom:syntix).
            </p>
          </div>
          {!segmentsVerticalId ? (
            <EdgeEmptyState
              title="Vertical required"
              description="Select the Pharmacy vertical to load Syntix segments."
            />
          ) : segmentsQuery.isLoading ||
            profilesQuery.isLoading ||
            operatingModelsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : segmentsQuery.isError ? (
            <EdgeErrorState
              description="Unable to load market segments."
              onRetry={() => segmentsQuery.refetch()}
            />
          ) : (
            <div className="grid gap-[var(--space-6)] lg:grid-cols-3">
              <div>
                <h3 className="type-sm font-semibold mb-2">Segments</h3>
                <ul className="divide-y divide-[var(--border)]">
                  {(Array.isArray(segmentsQuery.data)
                    ? segmentsQuery.data
                    : []
                  ).map((s) => (
                    <li key={String(s.id)} className="py-[var(--space-2)]">
                      <p className="type-sm font-medium">{String(s.name)}</p>
                      <p className="type-xs text-[var(--text-muted)] font-mono">
                        {String(s.code)}
                      </p>
                    </li>
                  ))}
                  {!Array.isArray(segmentsQuery.data) ||
                  segmentsQuery.data.length === 0 ? (
                    <li className="type-xs text-[var(--text-muted)]">
                      No segments for this vertical
                    </li>
                  ) : null}
                </ul>
              </div>
              <div>
                <h3 className="type-sm font-semibold mb-2">Profiles</h3>
                <ul className="divide-y divide-[var(--border)]">
                  {(Array.isArray(profilesQuery.data)
                    ? profilesQuery.data
                    : []
                  ).map((p) => (
                    <li key={String(p.id)} className="py-[var(--space-2)]">
                      <p className="type-sm font-medium">{String(p.name)}</p>
                      <p className="type-xs text-[var(--text-muted)] font-mono">
                        {String(p.code)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="type-sm font-semibold mb-2">Operating models</h3>
                <ul className="divide-y divide-[var(--border)]">
                  {(Array.isArray(operatingModelsQuery.data)
                    ? operatingModelsQuery.data
                    : []
                  ).map((o) => (
                    <li key={String(o.id)} className="py-[var(--space-2)]">
                      <p className="type-sm font-medium">{String(o.name)}</p>
                      <p className="type-xs text-[var(--text-muted)] font-mono">
                        {String(o.code)} · {String(o.dimension ?? "—")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="mt-6 space-y-3 rounded-xl border border-[var(--border)] p-4">
            <h3 className="type-sm font-semibold">Segment intelligence score</h3>
            <div className="flex flex-wrap gap-2">
              <input
                className={fieldControlClass}
                placeholder="Market segment ID"
                value={segmentIntelId}
                onChange={(e) => setSegmentIntelId(e.target.value)}
              />
              <textarea
                className={fieldControlClass + " min-h-[3rem] min-w-[12rem] flex-1"}
                value={segmentScoreJson}
                onChange={(e) => setSegmentScoreJson(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                disabled={!segmentIntelId.trim()}
                onClick={() => {
                  let scores: Record<string, number> = {};
                  try {
                    scores = JSON.parse(segmentScoreJson) as Record<
                      string,
                      number
                    >;
                  } catch {
                    setFormError("Invalid scores JSON");
                    return;
                  }
                  void edgeApi
                    .scoreCommercialSegmentIntelligence(
                      segmentIntelId.trim(),
                      { scores },
                    )
                    .then(() => segmentIntelQuery.refetch());
                }}
              >
                Score segment
              </Button>
            </div>
            {segmentIntelId ? (
              <pre className="max-h-40 overflow-auto rounded-lg bg-[var(--surface-muted)] p-2 text-xs">
                {JSON.stringify(segmentIntelQuery.data ?? [], null, 2)}
              </pre>
            ) : null}
          </div>
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
              <ListOrUuidField
                value={marketVerticalId}
                onChange={setMarketVerticalId}
                options={verticalPickOptions}
                placeholder="Select vertical"
                fallbackPlaceholder="Vertical ID"
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setResearchMarketId(m.id)}
                    >
                      Research
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {researchMarketId ? (
            <div className="space-y-3 rounded-xl border border-[var(--border)] p-4">
              <h2 className="type-sm font-semibold">Research projects</h2>
              <form
                className="grid max-w-xl gap-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void edgeApi
                    .createCommercialResearchProject({
                      marketId: researchMarketId,
                      code: researchCode,
                      title: researchTitle,
                    })
                    .then(() => {
                      setResearchCode("");
                      setResearchTitle("");
                      void researchProjectsQuery.refetch();
                    });
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Project code"
                  value={researchCode}
                  onChange={(e) => setResearchCode(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Title"
                  value={researchTitle}
                  onChange={(e) => setResearchTitle(e.target.value)}
                  required
                />
                <Button type="submit" size="sm">
                  Start project
                </Button>
              </form>
              {researchProjectsQuery.isLoading ? (
                <EdgeLoadingState />
              ) : (
                <ul className="divide-y divide-[var(--border)] text-sm">
                  {(Array.isArray(researchProjectsQuery.data)
                    ? researchProjectsQuery.data
                    : []
                  ).map((p) => (
                    <li
                      key={String((p as { id?: string }).id)}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <span>
                        {String((p as { title?: string }).title)} ·{" "}
                        {String((p as { status?: string }).status)}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setResearchProjectId(String((p as { id: string }).id))
                        }
                      >
                        Select
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {researchProjectId ? (
                <div className="flex flex-wrap gap-2">
                  <input
                    className={fieldControlClass}
                    placeholder="Source title"
                    value={researchSourceTitle}
                    onChange={(e) => setResearchSourceTitle(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!researchSourceTitle.trim()}
                    onClick={() =>
                      void edgeApi
                        .addCommercialResearchSource(researchProjectId, {
                          sourceType: "INTERVIEW",
                          title: researchSourceTitle,
                        })
                        .then(() => setResearchSourceTitle(""))
                    }
                  >
                    Add source
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void edgeApi
                        .completeCommercialResearchProject(researchProjectId, {
                          findings: "Completed from console",
                        })
                        .then(() => void researchProjectsQuery.refetch())
                    }
                  >
                    Complete project
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
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
              <ListOrUuidField
                value={icpVerticalId}
                onChange={setIcpVerticalId}
                options={verticalPickOptions}
                placeholder="Select vertical"
                fallbackPlaceholder="Vertical ID"
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
          <EdgePermissionGate permission="platform:commercial:packages:manage">
            <form
              className="flex flex-wrap items-end gap-2 rounded-xl border border-[var(--border)] p-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                const fn =
                  capabilityTarget.offerType === "plan"
                    ? edgeApi.addCommercialPlanCapability
                    : capabilityTarget.offerType === "addon"
                      ? edgeApi.addCommercialAddonCapability
                      : edgeApi.addSolutionPackageCapability;
                const parsedLimit = Number(capabilityTarget.numericLimit);
                const numericLimit =
                  capabilityTarget.numericLimit.trim() !== "" &&
                  Number.isFinite(parsedLimit) &&
                  parsedLimit >= 0
                    ? Math.floor(parsedLimit)
                    : undefined;
                void fn(capabilityTarget.offerId, {
                  capabilityId: capabilityTarget.capabilityId,
                  inclusionType: capabilityTarget.inclusionType,
                  ...(numericLimit != null ? { numericLimit } : {}),
                }).then(() => {
                  setCapabilityTarget((c) => ({
                    ...c,
                    capabilityId: "",
                    numericLimit: "",
                  }));
                  void queryClient.invalidateQueries({
                    queryKey: ["edge", "commercial", "offer-capabilities"],
                  });
                });
              }}
            >
              <select
                className={fieldControlClass}
                value={capabilityTarget.offerType}
                onChange={(e) =>
                  setCapabilityTarget((c) => ({
                    ...c,
                    offerType: e.target.value as "package" | "plan" | "addon",
                    offerId: "",
                  }))
                }
              >
                <option value="package">Package</option>
                <option value="plan">Plan</option>
                <option value="addon">Add-on</option>
              </select>
              <ListOrUuidField
                value={capabilityTarget.offerId}
                onChange={(offerId) =>
                  setCapabilityTarget((c) => ({ ...c, offerId }))
                }
                options={capabilityOfferOptions}
                placeholder="Select offer"
                fallbackPlaceholder="Offer ID"
                required
                aria-label="Capability offer"
              />
              <ListOrUuidField
                value={capabilityTarget.capabilityId}
                onChange={(capabilityId) =>
                  setCapabilityTarget((c) => ({ ...c, capabilityId }))
                }
                options={capabilityPickOptions}
                placeholder="Select capability"
                fallbackPlaceholder="P1 capability ID"
                required
                aria-label="Capability"
              />
              <select
                className={fieldControlClass}
                value={capabilityTarget.inclusionType}
                onChange={(e) =>
                  setCapabilityTarget((c) => ({
                    ...c,
                    inclusionType: e.target.value,
                  }))
                }
                aria-label="Inclusion type"
              >
                {INCLUSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step={1}
                className={fieldControlClass}
                placeholder="Quota numeric limit (optionnel)"
                value={capabilityTarget.numericLimit}
                onChange={(e) =>
                  setCapabilityTarget((c) => ({
                    ...c,
                    numericLimit: e.target.value,
                  }))
                }
                aria-label="Numeric limit"
              />
              <Button type="submit" size="sm">
                Link capability
              </Button>
            </form>
            {capabilityTarget.offerId.trim() !== "" ? (
              <div className="mt-3 rounded-xl border border-[var(--border)] p-4">
                <h3 className="type-sm font-semibold mb-2">
                  Linked capabilities & quotas
                </h3>
                {offerCapabilitiesQuery.isLoading ? (
                  <EdgeLoadingState />
                ) : offerCapabilitiesQuery.isError ? (
                  <EdgeErrorState description="Unable to load linked capabilities." />
                ) : (offerCapabilitiesQuery.data?.length ?? 0) === 0 ? (
                  <p className="type-xs text-[var(--text-muted)]">
                    No capability linked yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {offerCapabilitiesQuery.data?.map((row) => {
                      const limit = row.restrictions?.numericLimit;
                      return (
                        <li
                          key={row.capabilityId}
                          className="flex flex-wrap items-center justify-between gap-2 py-[var(--space-2)]"
                        >
                          <span className="type-sm font-medium">
                            {row.capabilityCode ?? row.capabilityId}
                          </span>
                          <span className="flex items-center gap-2">
                            <Badge>{row.inclusionType ?? "INCLUDED"}</Badge>
                            {limit != null ? (
                              <Badge tone="info">quota ≤ {String(limit)}</Badge>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
          </EdgePermissionGate>
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
              <select
                className={fieldControlClass}
                value={entryPriceSource}
                onChange={(e) =>
                  setEntryPriceSource(
                    e.target.value as
                      | "MEASURED"
                      | "ESTIMATED"
                      | "NEEDS_RESEARCH",
                  )
                }
                aria-label="Price source"
              >
                <option value="NEEDS_RESEARCH">NEEDS_RESEARCH (default)</option>
                <option value="ESTIMATED">ESTIMATED</option>
                <option value="MEASURED">MEASURED</option>
              </select>
              <p className="type-xs text-[var(--text-muted)]">
                NEEDS_RESEARCH keeps the price book non-publishable until
                prices are researched (gate G11).
              </p>
              <Button type="submit" disabled={addEntry.isPending}>
                Add entry
              </Button>
            </form>
            {selectedBookId !== "" ? (
              <div className="mt-3 max-w-xl rounded-xl border border-[var(--border)] p-4">
                <h3 className="type-sm font-semibold mb-2">
                  Entries & price sources
                </h3>
                {bookEntriesQuery.isLoading ? (
                  <EdgeLoadingState />
                ) : bookEntriesQuery.isError ? (
                  <EdgeErrorState description="Unable to load entries." />
                ) : (bookEntriesQuery.data?.length ?? 0) === 0 ? (
                  <p className="type-xs text-[var(--text-muted)]">
                    No entry yet — publish is blocked until entries exist.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {bookEntriesQuery.data?.map((row) => {
                      const source = String(
                        (row.conditions as { priceSource?: unknown } | null)
                          ?.priceSource ?? "NEEDS_RESEARCH",
                      ).toUpperCase();
                      return (
                        <li
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-[var(--space-2)]"
                        >
                          <span className="type-sm font-medium">
                            {row.amount} {row.currency}
                            {row.commercialItemType
                              ? ` · ${row.commercialItemType}`
                              : ""}
                          </span>
                          <Badge
                            tone={
                              source === "MEASURED"
                                ? "success"
                                : source === "ESTIMATED"
                                  ? "warning"
                                  : "danger"
                            }
                          >
                            {source}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
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

          <div className="space-y-[var(--space-4)] border-t border-[var(--border)] pt-[var(--space-4)]">
            <h2 className="type-md font-semibold">Discount policies</h2>
            <EdgePermissionGate permission="platform:pricing:discounts:manage">
              <form
                className="grid max-w-xl gap-[var(--space-3)]"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createDiscountPolicy.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Name"
                  value={discountName}
                  onChange={(e) => setDiscountName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={createDiscountPolicy.isPending}>
                  Create discount policy
                </Button>
              </form>
            </EdgePermissionGate>
            {(discountPoliciesQuery.data?.length ?? 0) === 0 ? (
              <EdgeEmptyState
                title="No discount policies"
                description="Approval matrices stay empty until pricing governance defines them."
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {discountPoliciesQuery.data?.map((row) => (
                  <li key={String(row.id)} className="py-[var(--space-2)]">
                    <p className="type-sm font-medium">{String(row.name)}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {String(row.code)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-[var(--space-4)] border-t border-[var(--border)] pt-[var(--space-4)]">
            <h2 className="type-md font-semibold">Pricing models & usage metrics</h2>
            <EdgePermissionGate permission="platform:pricing:manage">
              <form
                className="grid max-w-xl gap-[var(--space-3)]"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createPricingModel.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Model code"
                  value={pricingModelCode}
                  onChange={(e) => setPricingModelCode(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Model name"
                  value={pricingModelName}
                  onChange={(e) => setPricingModelName(e.target.value)}
                  required
                />
                <select
                  className={fieldControlClass}
                  value={pricingModelType}
                  onChange={(e) => setPricingModelType(e.target.value)}
                >
                  {["PER_USER", "PER_LOCATION", "FLAT_FEE", "USAGE"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={createPricingModel.isPending}>
                  Create pricing model
                </Button>
              </form>
              <form
                className="grid max-w-xl gap-[var(--space-3)] mt-[var(--space-4)]"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createUsageMetric.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Metric code"
                  value={usageMetricCode}
                  onChange={(e) => setUsageMetricCode(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Metric name"
                  value={usageMetricName}
                  onChange={(e) => setUsageMetricName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={createUsageMetric.isPending}>
                  Create usage metric
                </Button>
              </form>
            </EdgePermissionGate>
            {(pricingModelsQuery.data?.length ?? 0) === 0 &&
            (usageMetricsQuery.data?.length ?? 0) === 0 ? (
              <EdgeEmptyState
                title="No models or usage metrics"
                description="Recorded only from validated pricing decisions — never invented."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <ul className="divide-y divide-[var(--border)]">
                  {(pricingModelsQuery.data ?? []).map((row) => (
                    <li key={String(row.id)} className="py-[var(--space-2)]">
                      <p className="type-sm font-medium">{String(row.name)}</p>
                      <p className="type-xs text-[var(--text-muted)]">
                        {String(row.code)} · {String(row.modelType ?? "—")}
                      </p>
                    </li>
                  ))}
                </ul>
                <ul className="divide-y divide-[var(--border)]">
                  {(usageMetricsQuery.data ?? []).map((row) => (
                    <li key={String(row.id)} className="py-[var(--space-2)]">
                      <p className="type-sm font-medium">{String(row.name)}</p>
                      <p className="type-xs text-[var(--text-muted)]">
                        {String(row.code)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
        <section className="space-y-[var(--space-5)]">
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

          <div className="border-t border-[var(--border)] pt-[var(--space-4)] space-y-[var(--space-4)]">
            <h2 className="type-md font-semibold">Buying committees & journeys</h2>
            <EdgePermissionGate permission="platform:commercial:personas:manage">
              <form
                className="grid max-w-xl gap-[var(--space-3)]"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createBuyingCommittee.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Committee code"
                  value={committeeCode}
                  onChange={(e) => setCommitteeCode(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Committee name"
                  value={committeeName}
                  onChange={(e) => setCommitteeName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={createBuyingCommittee.isPending}>
                  Create buying committee
                </Button>
              </form>
              <form
                className="grid max-w-xl gap-[var(--space-3)]"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createDecisionJourney.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Journey code"
                  value={journeyCode}
                  onChange={(e) => setJourneyCode(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Journey name"
                  value={journeyName}
                  onChange={(e) => setJourneyName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={createDecisionJourney.isPending}>
                  Create decision journey
                </Button>
              </form>
            </EdgePermissionGate>
            {(buyingCommitteesQuery.data?.length ?? 0) === 0 &&
            (decisionJourneysQuery.data?.length ?? 0) === 0 ? (
              <EdgeEmptyState
                title="No committees or journeys"
                description="Commercial buying maps stay empty until product marketing defines them."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <ul className="divide-y divide-[var(--border)]">
                  {(buyingCommitteesQuery.data ?? []).map((row) => (
                    <li key={String(row.id)} className="py-[var(--space-2)]">
                      <p className="type-sm font-medium">{String(row.name)}</p>
                      <p className="type-xs text-[var(--text-muted)]">
                        {String(row.code)}
                      </p>
                    </li>
                  ))}
                </ul>
                <ul className="divide-y divide-[var(--border)]">
                  {(decisionJourneysQuery.data ?? []).map((row) => (
                    <li key={String(row.id)} className="py-[var(--space-2)]">
                      <p className="type-sm font-medium">{String(row.name)}</p>
                      <p className="type-xs text-[var(--text-muted)]">
                        {String(row.code)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tab === "configurator" ? (
        <section className="space-y-[var(--space-5)]">
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
            <h2 className="type-md font-semibold">Manual configure</h2>
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

          <form
            className="grid max-w-xl gap-[var(--space-3)] border-t border-[var(--border)] pt-[var(--space-4)]"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              runOfferWizard.mutate();
            }}
          >
            <h2 className="type-md font-semibold">Guided offer wizard</h2>
            <p className="type-xs text-[var(--text-muted)]">
              Recommendation only — does not grant entitlements or create a
              subscription.
            </p>
            <label className="block space-y-1 type-sm text-[var(--text-secondary)]">
              <span className="block type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Product code
              </span>
              <select
                className={fieldControlClass}
                value={wizardProductCode}
                onChange={(e) =>
                  setWizardProductCode(
                    e.target.value as "SYNTIX_PHARMA" | "OKAPI_RESTAURANT",
                  )
                }
              >
                <option value="SYNTIX_PHARMA">SYNTIX_PHARMA</option>
                <option value="OKAPI_RESTAURANT">OKAPI_RESTAURANT</option>
              </select>
            </label>
            <input
              className={fieldControlClass}
              placeholder="Sites (optional)"
              type="number"
              min={0}
              value={wizardSites}
              onChange={(e) => setWizardSites(e.target.value)}
            />
            <input
              className={fieldControlClass}
              placeholder="Users (optional)"
              type="number"
              min={0}
              value={wizardUsers}
              onChange={(e) => setWizardUsers(e.target.value)}
            />
            <input
              className={fieldControlClass}
              placeholder="Needs (comma-separated, e.g. delivery, analytics)"
              value={wizardNeeds}
              onChange={(e) => setWizardNeeds(e.target.value)}
            />
            <select
              className={fieldControlClass}
              value={wizardMode}
              onChange={(e) =>
                setWizardMode(
                  e.target.value as "MANUAL" | "RULE_BASED" | "GUIDED",
                )
              }
            >
              <option value="GUIDED">GUIDED</option>
              <option value="RULE_BASED">RULE_BASED</option>
              <option value="MANUAL">MANUAL</option>
            </select>
            <Button type="submit" disabled={runOfferWizard.isPending}>
              Run wizard
            </Button>
            {wizardResult ? (
              <p className="type-sm text-[var(--text-primary)]">{wizardResult}</p>
            ) : null}
          </form>
        </section>
      ) : null}
    </EdgeStudioShell>
  );
}
