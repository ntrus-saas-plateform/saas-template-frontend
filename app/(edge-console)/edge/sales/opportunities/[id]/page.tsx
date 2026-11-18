"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import { ListOrUuidField } from "@/components/edge/list-or-uuid-field";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import Link from "next/link";

export default function OpportunityWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [toStageId, setToStageId] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [assessmentId, setAssessmentId] = useState("");
  const [closeStageId, setCloseStageId] = useState("");
  const [closeReason, setCloseReason] = useState("");
  const [riskForm, setRiskForm] = useState({ code: "", title: "" });
  const [competitorName, setCompetitorName] = useState("");
  const [offerForm, setOfferForm] = useState({ productId: "", planId: "" });

  const query = useQuery({
    queryKey: ["edge", "sales", "opportunity", id],
    queryFn: () => edgeApi.getSalesOpportunity(id),
    enabled: Boolean(id),
  });

  const boardQuery = useQuery({
    queryKey: ["edge", "sales", "pipeline-board"],
    queryFn: () => edgeApi.getSalesPipelineBoard(),
    enabled: Boolean(id),
  });

  const offersQuery = useQuery({
    queryKey: ["edge", "sales", "opportunity-offers", id],
    queryFn: () => edgeApi.listSalesOpportunityOffers(id),
    enabled: Boolean(id),
  });

  const productsQuery = useQuery({
    queryKey: ["edge", "products", "opportunity-offer-pick"],
    queryFn: async () => {
      const { data } = await edgeApi.listProducts({ limit: 100 });
      return data ?? [];
    },
    enabled: Boolean(id),
  });

  const productPickOptions = useMemo(
    () =>
      (productsQuery.data ?? []).map((p) => ({
        id: p.id,
        label: `${p.code ?? p.slug ?? p.id} — ${p.name ?? p.id}`,
      })),
    [productsQuery.data],
  );

  const plansQuery = useQuery({
    queryKey: [
      "edge",
      "commercial",
      "plans",
      "opportunity-offer",
      offerForm.productId || "all",
    ],
    queryFn: async () => {
      const { data } = await edgeApi.listCommercialPlans(
        offerForm.productId || undefined,
      );
      return data ?? [];
    },
    enabled: Boolean(id),
  });

  const planPickOptions = useMemo(
    () =>
      (plansQuery.data ?? []).map((plan) => ({
        id: plan.id,
        label: `${plan.code ?? plan.id} — ${plan.name ?? plan.id}`,
      })),
    [plansQuery.data],
  );

  const transition = useMutation({
    mutationFn: () =>
      edgeApi.transitionSalesOpportunityStage(id, { toStageId }),
    onSuccess: () => {
      setToStageId("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunity", id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "pipeline-board"],
      });
    },
  });

  const reopen = useMutation({
    mutationFn: () =>
      edgeApi.reopenSalesOpportunity(id, { reason: reopenReason }),
    onSuccess: () => {
      setReopenReason("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunity", id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "pipeline-board"],
      });
    },
  });

  const addNote = useMutation({
    mutationFn: () =>
      edgeApi.createSalesNote({
        body: noteBody,
        accountId:
          ((query.data as { opportunity?: { accountId?: string } })
            ?.opportunity?.accountId as string | undefined) ?? null,
      }),
    onSuccess: () => setNoteBody(""),
  });

  const completeAssessment = useMutation({
    mutationFn: () =>
      edgeApi.completeSalesAssessment(assessmentId.trim(), {
        fitDecision: "FIT",
      }),
    onSuccess: () => {
      setAssessmentId("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunity", id],
      });
    },
  });

  const validateFit = useMutation({
    mutationFn: () =>
      edgeApi.validateSalesAssessmentSolutionFit(assessmentId.trim()),
    onSuccess: () => {
      setAssessmentId("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunity", id],
      });
    },
  });

  const closeOpp = useMutation({
    mutationFn: () =>
      edgeApi.closeSalesOpportunity(id, {
        toStageId: closeStageId,
        reasonText: closeReason || null,
      }),
    onSuccess: () => {
      setCloseReason("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunity", id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "pipeline-board"],
      });
    },
  });

  const addRisk = useMutation({
    mutationFn: () =>
      edgeApi.addSalesOpportunityRisk(id, {
        code: riskForm.code,
        title: riskForm.title,
      }),
    onSuccess: () => {
      setRiskForm({ code: "", title: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunity", id],
      });
    },
  });

  const addCompetitor = useMutation({
    mutationFn: () =>
      edgeApi.addSalesOpportunityCompetitor(id, {
        competitorName,
      }),
    onSuccess: () => {
      setCompetitorName("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunity", id],
      });
    },
  });

  const createOffer = useMutation({
    mutationFn: () =>
      edgeApi.createSalesOpportunityOffer(id, {
        productId: offerForm.productId,
        productLifecycleStatus: "ACTIVE",
        planId: offerForm.planId,
        planProductId: offerForm.productId,
        planStatus: "PUBLISHED",
      }),
    onSuccess: () => {
      setOfferForm({ productId: "", planId: "" });
      void offersQuery.refetch();
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunity", id],
      });
    },
  });

  const stages = useMemo(() => {
    const board = boardQuery.data as
      | {
          board?: {
            stage: { id: string; name: string; code: string };
          }[];
        }
      | undefined;
    return (board?.board ?? []).map((col) => col.stage);
  }, [boardQuery.data]);

  if (query.isLoading) return <EdgeLoadingState label="Loading workspace…" />;
  if (query.isError) {
    const err = query.error;
    if (err instanceof EdgeApiError && err.status === 403) {
      return <EdgeEmptyState title="Forbidden" />;
    }
    return (
      <EdgeErrorState
        description={
          err instanceof Error ? err.message : "Unable to load opportunity."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const data = query.data as {
    opportunity?: Record<string, unknown>;
    stage?: Record<string, unknown>;
    risks?: unknown[];
    competitors?: unknown[];
    workspace?: {
      assessments?: unknown[];
      offers?: unknown[];
      quotes?: unknown[];
      proposals?: unknown[];
      contracts?: unknown[];
      activities?: unknown[];
      closeReadiness?: {
        hasAcceptedQuote?: boolean;
        hasExecutedContract?: boolean;
        note?: string;
      };
    };
    weightedPipelineValue?: number | null;
    revenueNote?: string;
  };

  const opp = data.opportunity ?? {};
  const ws = data.workspace;
  const status = String(opp.status ?? "");
  const isClosed = status === "WON" || status === "LOST";
  const currentStageId = String(opp.stageId ?? data.stage?.id ?? "");

  return (
    <EdgePermissionGate permission="platform:sales:opportunities:read">
      <div className="space-y-6">
        <header className="space-y-2">
          <Link
            href="/edge/sales"
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Sales console
          </Link>
          <h1 className="font-display text-3xl tracking-tight">
            {String(opp.name ?? "Opportunity")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {String(opp.opportunityNumber ?? "")} ·{" "}
            {String(data.stage?.name ?? opp.status)} · weighted{" "}
            {data.weightedPipelineValue ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">{data.revenueNote}</p>
          <Badge tone="default">{status || "—"}</Badge>
        </header>

        <EdgePermissionGate permission="platform:sales:opportunities:update">
          <section className="space-y-3 rounded-xl border border-border/70 p-4">
            <h2 className="text-sm font-medium">Stage transition</h2>
            {!isClosed ? (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[14rem] flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Target stage
                  </label>
                  <select
                    className={fieldControlClass}
                    value={toStageId}
                    onChange={(e) => setToStageId(e.target.value)}
                  >
                    <option value="">Select stage…</option>
                    {stages
                      .filter((s) => s.id !== currentStageId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                  </select>
                </div>
                <Button
                  disabled={!toStageId || transition.isPending}
                  onClick={() => transition.mutate()}
                >
                  Move stage
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[14rem] flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Reopen reason
                  </label>
                  <input
                    className={fieldControlClass}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Why reopen?"
                  />
                </div>
                <Button
                  disabled={!reopenReason.trim() || reopen.isPending}
                  onClick={() => reopen.mutate()}
                >
                  Reopen
                </Button>
              </div>
            )}
            {transition.isError || reopen.isError ? (
              <p className="text-sm text-destructive">
                {(
                  (transition.error ?? reopen.error) as EdgeApiError
                )?.message ?? "Action failed"}
              </p>
            ) : null}
            {!stages.length && !boardQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">
                No pipeline stages loaded — transitions unavailable until board
                API returns stages.
              </p>
            ) : null}
          </section>
        </EdgePermissionGate>

        <EdgePermissionGate permission="platform:sales:opportunities:update">
          <section className="space-y-3 rounded-xl border border-border/70 p-4">
            <h2 className="text-sm font-medium">Close opportunity</h2>
            <p className="text-xs text-muted-foreground">
              Uses pipeline won/lost stages — server validates quote/contract
              gates when configured.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <select
                className={fieldControlClass}
                value={closeStageId}
                onChange={(e) => setCloseStageId(e.target.value)}
              >
                <option value="">Close stage…</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              <input
                className={fieldControlClass + " min-w-[14rem] flex-1"}
                placeholder="Reason (optional)"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
              />
              <Button
                disabled={!closeStageId || closeOpp.isPending || isClosed}
                onClick={() => closeOpp.mutate()}
              >
                Close
              </Button>
            </div>
            {closeOpp.isError ? (
              <p className="text-sm text-destructive">
                {(closeOpp.error as EdgeApiError)?.message ?? "Close failed"}
              </p>
            ) : null}
          </section>
        </EdgePermissionGate>

        <div className="grid gap-4 lg:grid-cols-2">
          <EdgePermissionGate permission="platform:sales:opportunities:update">
            <section className="space-y-3 rounded-xl border border-border/70 p-4">
              <h2 className="text-sm font-medium">Risks &amp; competitors</h2>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addRisk.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Risk code"
                  value={riskForm.code}
                  onChange={(e) =>
                    setRiskForm((f) => ({ ...f, code: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass + " min-w-[10rem] flex-1"}
                  placeholder="Title"
                  value={riskForm.title}
                  onChange={(e) =>
                    setRiskForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
                <Button type="submit" size="sm" disabled={addRisk.isPending}>
                  Add risk
                </Button>
              </form>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addCompetitor.mutate();
                }}
              >
                <input
                  className={fieldControlClass + " min-w-[12rem] flex-1"}
                  placeholder="Competitor name"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={addCompetitor.isPending}
                >
                  Add competitor
                </Button>
              </form>
              <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                <Panel
                  title="Risks"
                  items={data.risks}
                  empty="No risks logged"
                />
                <Panel
                  title="Competitors"
                  items={data.competitors}
                  empty="No competitors"
                />
              </div>
            </section>
          </EdgePermissionGate>

          <EdgePermissionGate permission="platform:sales:opportunities:update">
            <section className="space-y-3 rounded-xl border border-border/70 p-4">
              <h2 className="text-sm font-medium">Offer configurations</h2>
              <form
                className="grid gap-2 sm:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  createOffer.mutate();
                }}
              >
                <ListOrUuidField
                  value={offerForm.productId}
                  onChange={(productId) =>
                    setOfferForm((f) => ({
                      ...f,
                      productId,
                      planId: "",
                    }))
                  }
                  options={productPickOptions}
                  placeholder="Select product"
                  fallbackPlaceholder="Product ID"
                  required
                  aria-label="Offer product"
                />
                <ListOrUuidField
                  value={offerForm.planId}
                  onChange={(planId) =>
                    setOfferForm((f) => ({ ...f, planId }))
                  }
                  options={planPickOptions}
                  placeholder="Select plan"
                  fallbackPlaceholder="Plan ID"
                  required
                  aria-label="Offer plan"
                />
                <Button type="submit" size="sm" disabled={createOffer.isPending}>
                  Create offer
                </Button>
              </form>
              <Panel
                title="Offers (API list)"
                items={
                  (offersQuery.data as { items?: unknown[] } | undefined)
                    ?.items ??
                  (Array.isArray(offersQuery.data)
                    ? (offersQuery.data as unknown[])
                    : undefined)
                }
                empty="No offers"
              />
            </section>
          </EdgePermissionGate>
        </div>

        <EdgePermissionGate permission="platform:sales:activities:manage">
          <section className="flex flex-wrap gap-3 rounded-xl border border-border/70 p-4">
            <input
              className={fieldControlClass + " min-w-[16rem] flex-1"}
              placeholder="Add note on account"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
            />
            <Button
              disabled={!noteBody.trim() || addNote.isPending}
              onClick={() => addNote.mutate()}
            >
              Save note
            </Button>
            {addNote.isError ? (
              <p className="w-full text-sm text-destructive">
                {(addNote.error as EdgeApiError)?.message ?? "Note failed"}
              </p>
            ) : null}
          </section>
        </EdgePermissionGate>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Accepted quote"
            value={ws?.closeReadiness?.hasAcceptedQuote ? "Yes" : "No"}
          />
          <Metric
            label="Executed contract"
            value={ws?.closeReadiness?.hasExecutedContract ? "Yes" : "No"}
          />
          <Metric label="Quotes" value={String(ws?.quotes?.length ?? 0)} />
          <Metric
            label="Activities"
            value={String(ws?.activities?.length ?? 0)}
          />
        </section>

        <EdgePermissionGate permission="platform:sales:assessments:manage">
          <section className="flex flex-wrap gap-3 rounded-xl border border-border/70 p-4">
            <input
              className={fieldControlClass + " min-w-[14rem] flex-1"}
              placeholder="Assessment ID"
              value={assessmentId}
              onChange={(e) => setAssessmentId(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!assessmentId.trim() || completeAssessment.isPending}
              onClick={() => completeAssessment.mutate()}
            >
              Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!assessmentId.trim() || validateFit.isPending}
              onClick={() => validateFit.mutate()}
            >
              Solution fit
            </Button>
          </section>
        </EdgePermissionGate>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Assessments"
            items={ws?.assessments}
            empty="No assessments"
          />
          <Panel title="Offers" items={ws?.offers} empty="No offer configs" />
          <Panel title="Quotes" items={ws?.quotes} empty="No quotes" />
          <Panel
            title="Proposals"
            items={ws?.proposals}
            empty="No proposals"
          />
          <Panel
            title="Contracts"
            items={ws?.contracts}
            empty="No contracts"
          />
          <Panel
            title="Activities"
            items={ws?.activities}
            empty="No activities"
          />
        </div>

        {ws?.closeReadiness?.note ? (
          <p className="text-xs text-muted-foreground">
            {ws.closeReadiness.note}
          </p>
        ) : null}
      </div>
    </EdgePermissionGate>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}

function Panel({
  title,
  items,
  empty,
}: {
  title: string;
  items?: unknown[];
  empty: string;
}) {
  const list = (items as Record<string, unknown>[] | undefined) ?? [];
  return (
    <section className="rounded-xl border border-border/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <Badge tone="default">{list.length}</Badge>
      </div>
      {!list.length ? (
        <EdgeEmptyState title={empty} />
      ) : (
        <ul className="space-y-2 text-sm">
          {list.slice(0, 8).map((item, idx) => (
            <li
              key={String(item.id ?? idx)}
              className="truncate text-muted-foreground"
            >
              {String(
                item.quoteNumber ??
                  item.proposalNumber ??
                  item.contractNumber ??
                  item.subject ??
                  item.status ??
                  item.id,
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
