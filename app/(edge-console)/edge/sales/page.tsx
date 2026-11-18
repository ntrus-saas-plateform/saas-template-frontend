"use client";

import { useMemo, useState, type FormEvent } from "react";
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
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

type Tab =
  | "overview"
  | "accounts"
  | "contacts"
  | "leads"
  | "opportunities"
  | "pipeline"
  | "activities"
  | "quotes"
  | "proposals"
  | "consulting"
  | "dealdesk"
  | "contracts"
  | "orders"
  | "governance"
  | "performance"
  | "teams"
  | "partners"
  | "tasks";

function asRecordList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (!data || typeof data !== "object") return [];
  const obj = data as { data?: unknown; items?: unknown };
  if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
  return [];
}

const TABS: { id: Tab; label: string; permission: string }[] = [
  {
    id: "overview",
    label: "Overview",
    permission: "platform:sales:analytics:read",
  },
  {
    id: "accounts",
    label: "Accounts",
    permission: "platform:sales:accounts:read",
  },
  {
    id: "contacts",
    label: "Contacts",
    permission: "platform:sales:contacts:read",
  },
  { id: "leads", label: "Lead Inbox", permission: "platform:sales:leads:read" },
  {
    id: "opportunities",
    label: "Opportunities",
    permission: "platform:sales:opportunities:read",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    permission: "platform:sales:opportunities:read",
  },
  {
    id: "activities",
    label: "Activities",
    permission: "platform:sales:activities:manage",
  },
  {
    id: "quotes",
    label: "Quotes",
    permission: "platform:sales:quotes:read",
  },
  {
    id: "proposals",
    label: "Proposals",
    permission: "platform:sales:proposals:manage",
  },
  {
    id: "consulting",
    label: "Consulting",
    permission: "platform:sales:assessments:manage",
  },
  {
    id: "dealdesk",
    label: "Deal Desk",
    permission: "platform:sales:discounts:request",
  },
  {
    id: "contracts",
    label: "Contracts",
    permission: "platform:sales:contracts:read",
  },
  {
    id: "orders",
    label: "Orders",
    permission: "platform:sales:orders:manage",
  },
  {
    id: "governance",
    label: "Governance",
    permission: "platform:sales:governance:manage",
  },
  {
    id: "performance",
    label: "Performance",
    permission: "platform:sales:analytics:read",
  },
  { id: "teams", label: "Teams", permission: "platform:sales:teams:read" },
  {
    id: "partners",
    label: "Partners",
    permission: "platform:sales:opportunities:read",
  },
  {
    id: "tasks",
    label: "Tasks",
    permission: "platform:sales:activities:manage",
  },
];

export default function EdgeSalesPage() {
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [accountForm, setAccountForm] = useState({
    legalName: "",
    country: "",
    emailDomain: "",
    industry: "",
  });
  const [contactForm, setContactForm] = useState({
    accountId: "",
    firstName: "",
    lastName: "",
    email: "",
  });
  const [receiveLeadId, setReceiveLeadId] = useState("");
  const [rejectReason, setRejectReason] = useState("NO_FIT");
  const [teamForm, setTeamForm] = useState({ code: "", name: "" });
  const [territoryForm, setTerritoryForm] = useState({
    code: "",
    name: "",
    country: "",
  });
  const [noteForm, setNoteForm] = useState({
    body: "",
    accountId: "",
  });
  const [taskTitle, setTaskTitle] = useState("");
  const [oppForm, setOppForm] = useState({
    name: "",
    accountId: "",
    estimatedValue: "",
    needSummary: "",
  });
  const [activityForm, setActivityForm] = useState({
    activityType: "CALL",
    subject: "",
    opportunityId: "",
  });
  const [quoteForm, setQuoteForm] = useState({
    opportunityId: "",
    description: "Plan subscription",
    quantity: "1",
    unitPrice: "1000",
  });
  const [discountForm, setDiscountForm] = useState({
    opportunityId: "",
    listAmount: "1000",
    requestedAmount: "850",
    justification: "",
  });
  const [contractForm, setContractForm] = useState({
    opportunityId: "",
    contractValue: "",
  });
  const [orderForm, setOrderForm] = useState({
    contractId: "",
    opportunityId: "",
  });
  const [partnerForm, setPartnerForm] = useState({
    partnerCode: "",
    accountName: "",
    territoryCode: "",
    estimatedMrr: "",
  });
  const [bantForm, setBantForm] = useState({
    budget: true,
    authority: true,
    need: true,
    timeline: false,
  });
  const [leadScoreForm, setLeadScoreForm] = useState({
    fitScore: "70",
    intentScore: "60",
    engagementScore: "50",
    readinessScore: "40",
  });
  const [engineResult, setEngineResult] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [assessmentActionId, setAssessmentActionId] = useState("");
  const [assessmentFitDecision, setAssessmentFitDecision] = useState("FIT");
  const [amendmentExecuteId, setAmendmentExecuteId] = useState("");
  const [visibilitySubjectType, setVisibilitySubjectType] = useState("ACCOUNT");
  const [visibilitySubjectId, setVisibilitySubjectId] = useState("");
  const [visibilityGranteeAdminId, setVisibilityGranteeAdminId] = useState("");
  const [visibilityAssertResult, setVisibilityAssertResult] = useState<
    string | null
  >(null);
  const [duplicateSearch, setDuplicateSearch] = useState({
    legalName: "",
    emailDomain: "",
  });
  const [duplicateResult, setDuplicateResult] = useState<string | null>(null);
  const [mergeForm, setMergeForm] = useState({
    survivingAccountId: "",
    mergedAccountId: "",
    reason: "",
  });
  const [quoteInspectId, setQuoteInspectId] = useState("");
  const [quoteTransitionStatus, setQuoteTransitionStatus] = useState("SENT");
  const [orderOpsId, setOrderOpsId] = useState("");
  const [orderToStatus, setOrderToStatus] = useState("FULFILLED");
  const [orderLineForm, setOrderLineForm] = useState({
    description: "Line 1",
    quantity: "1",
    unitPrice: "100",
  });

  const canReadAny = useMemo(
    () =>
      TABS.some((t) => hasEdgePermission(permissions, t.permission)) ||
      hasEdgePermission(permissions, "platform:sales:accounts:read"),
    [permissions],
  );

  const overviewQuery = useQuery({
    queryKey: ["edge", "sales", "overview"],
    queryFn: () => edgeApi.getSalesOverview(),
    enabled: tab === "overview" && canReadAny,
  });

  const accountsQuery = useQuery({
    queryKey: ["edge", "sales", "accounts"],
    queryFn: () => edgeApi.listSalesAccounts({ limit: 50 }),
    enabled:
      (tab === "accounts" ||
        tab === "contacts" ||
        tab === "opportunities") &&
      canReadAny,
  });

  const contactsQuery = useQuery({
    queryKey: ["edge", "sales", "contacts"],
    queryFn: () => edgeApi.listSalesContacts({}),
    enabled: tab === "contacts" && canReadAny,
  });

  const leadsQuery = useQuery({
    queryKey: ["edge", "sales", "leads"],
    queryFn: () => edgeApi.listSalesLeads({ limit: 50 }),
    enabled: tab === "leads" && canReadAny,
  });

  const teamsQuery = useQuery({
    queryKey: ["edge", "sales", "teams"],
    queryFn: () => edgeApi.listSalesTeams(),
    enabled: tab === "teams" && canReadAny,
  });

  const territoriesQuery = useQuery({
    queryKey: ["edge", "sales", "territories"],
    queryFn: () => edgeApi.listSalesTerritories(),
    enabled: tab === "teams" && canReadAny,
  });

  const tasksQuery = useQuery({
    queryKey: ["edge", "sales", "tasks"],
    queryFn: () => edgeApi.listSalesTasks({ status: "OPEN" }),
    enabled: tab === "tasks" && canReadAny,
  });

  const opportunitiesQuery = useQuery({
    queryKey: ["edge", "sales", "opportunities"],
    queryFn: () => edgeApi.listSalesOpportunities({ limit: 50 }),
    enabled:
      (tab === "opportunities" ||
        tab === "pipeline" ||
        tab === "activities" ||
        tab === "quotes" ||
        tab === "dealdesk" ||
        tab === "contracts" ||
        tab === "orders" ||
        tab === "consulting") &&
      canReadAny,
  });

  const consultingAssessmentsQuery = useQuery({
    queryKey: [
      "edge",
      "sales",
      "consulting-assessments",
      ((opportunitiesQuery.data as { items?: { id: string }[] } | undefined)
        ?.items ?? []
      )
        .map((o) => o.id)
        .join(","),
    ],
    queryFn: async () => {
      const opps =
        (
          opportunitiesQuery.data as
            | { items?: Record<string, unknown>[] }
            | undefined
        )?.items ?? [];
      const merged: { id: string; label: string }[] = [];
      for (const o of opps.slice(0, 25)) {
        const { data } = await edgeApi.listOpportunityAssessments(String(o.id));
        const items = Array.isArray(data)
          ? data
          : ((data as { items?: Record<string, unknown>[] } | undefined)?.items ??
            []);
        for (const a of items) {
          if (!a.id) continue;
          merged.push({
            id: String(a.id),
            label: `${String(o.name ?? o.opportunityNumber ?? o.id).slice(0, 28)} · ${String(a.status ?? "assessment")}`,
          });
        }
      }
      return merged;
    },
    enabled:
      tab === "consulting" &&
      canReadAny &&
      Boolean(
        (
          opportunitiesQuery.data as { items?: unknown[] } | undefined
        )?.items?.length,
      ),
  });

  const pipelineQuery = useQuery({
    queryKey: ["edge", "sales", "pipeline-board"],
    queryFn: () => edgeApi.getSalesPipelineBoard(),
    enabled: tab === "pipeline" && canReadAny,
  });

  const beachheadQuery = useQuery({
    queryKey: ["edge", "sales", "engine-beachhead"],
    queryFn: () => edgeApi.getSalesEngineBeachhead(),
    enabled: tab === "overview" && canReadAny,
  });

  const partnersQuery = useQuery({
    queryKey: ["edge", "sales", "partner-opportunities"],
    queryFn: () => edgeApi.listPartnerOpportunities({ limit: 50 }),
    enabled: tab === "partners" && canReadAny,
  });

  const activitiesQuery = useQuery({
    queryKey: ["edge", "sales", "activities"],
    queryFn: () => edgeApi.listSalesActivities({}),
    enabled: tab === "activities" && canReadAny,
  });

  const quotesQuery = useQuery({
    queryKey: ["edge", "sales", "quotes"],
    queryFn: () => edgeApi.listSalesQuotes({}),
    enabled: tab === "quotes" && canReadAny,
  });

  const discountsQuery = useQuery({
    queryKey: ["edge", "sales", "discounts"],
    queryFn: () => edgeApi.listSalesDiscountRequests({}),
    enabled: tab === "dealdesk" && canReadAny,
  });

  const contractsQuery = useQuery({
    queryKey: ["edge", "sales", "contracts"],
    queryFn: () => edgeApi.listSalesContracts({}),
    enabled: (tab === "contracts" || tab === "orders") && canReadAny,
  });

  const ordersQuery = useQuery({
    queryKey: ["edge", "sales", "orders"],
    queryFn: () => edgeApi.listSalesOrders({}),
    enabled: tab === "orders" && canReadAny,
  });

  const quoteDetailQuery = useQuery({
    queryKey: ["edge", "sales", "quote", quoteInspectId],
    queryFn: () => edgeApi.getSalesQuote(quoteInspectId.trim()),
    enabled: tab === "quotes" && Boolean(quoteInspectId.trim()) && canReadAny,
  });

  const orderLinesQuery = useQuery({
    queryKey: ["edge", "sales", "order-lines", orderOpsId],
    queryFn: () => edgeApi.listSalesOrderLines(orderOpsId.trim()),
    enabled: tab === "orders" && Boolean(orderOpsId.trim()) && canReadAny,
  });

  const performanceQuery = useQuery({
    queryKey: ["edge", "sales", "performance"],
    queryFn: () => edgeApi.getSalesPerformance(),
    enabled: tab === "performance" && canReadAny,
  });

  const forecastQuery = useQuery({
    queryKey: ["edge", "sales", "forecast"],
    queryFn: () => edgeApi.getSalesForecast({ model: "WEIGHTED" }),
    enabled: tab === "performance" && canReadAny,
  });

  const searchQuery = useQuery({
    queryKey: ["edge", "sales", "search", searchQ],
    queryFn: () => edgeApi.searchSales({ q: searchQ, limit: 20 }),
    enabled: searchQ.trim().length >= 2 && canReadAny,
  });

  const proposalsQuery = useQuery({
    queryKey: ["edge", "sales", "proposals"],
    queryFn: () => edgeApi.listSalesProposals(),
    enabled: tab === "proposals" && canReadAny,
  });

  const questionnairesQuery = useQuery({
    queryKey: ["edge", "sales", "questionnaires"],
    queryFn: () => edgeApi.listSalesQuestionnaires(),
    enabled: tab === "consulting" && canReadAny,
  });

  const approvalsQuery = useQuery({
    queryKey: ["edge", "sales", "approvals"],
    queryFn: () => edgeApi.listSalesApprovals({ status: "PENDING" }),
    enabled: tab === "governance" && canReadAny,
  });

  const createAccount = useMutation({
    mutationFn: () =>
      edgeApi.createSalesAccount({
        legalName: accountForm.legalName,
        country: accountForm.country || null,
        emailDomain: accountForm.emailDomain || null,
        industry: accountForm.industry || null,
      }),
    onSuccess: () => {
      setAccountForm({
        legalName: "",
        country: "",
        emailDomain: "",
        industry: "",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "accounts"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "overview"],
      });
    },
  });

  const createContact = useMutation({
    mutationFn: () =>
      edgeApi.createSalesContact({
        accountId: contactForm.accountId,
        firstName: contactForm.firstName,
        lastName: contactForm.lastName,
        email: contactForm.email || null,
      }),
    onSuccess: () => {
      setContactForm({
        accountId: "",
        firstName: "",
        lastName: "",
        email: "",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "contacts"],
      });
    },
  });

  const receiveLead = useMutation({
    mutationFn: () =>
      edgeApi.receiveSalesLead({ marketingLeadId: receiveLeadId }),
    onSuccess: () => {
      setReceiveLeadId("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "leads"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "overview"],
      });
    },
  });

  const acceptLead = useMutation({
    mutationFn: (id: string) => edgeApi.acceptSalesLead(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "leads"],
      }),
  });

  const rejectLead = useMutation({
    mutationFn: (id: string) =>
      edgeApi.rejectSalesLead(id, {
        reasonCode: rejectReason,
        reasonText: "Rejected from Sales console",
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "leads"],
      }),
  });

  const qualifyLead = useMutation({
    mutationFn: (id: string) =>
      edgeApi.qualifySalesLead(id, {
        needConfirmed: true,
        productFit: true,
        decisionCapacity: true,
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "leads"],
      }),
  });

  const createTeam = useMutation({
    mutationFn: () =>
      edgeApi.createSalesTeam({
        code: teamForm.code,
        name: teamForm.name,
      }),
    onSuccess: () => {
      setTeamForm({ code: "", name: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "teams"],
      });
    },
  });

  const createTerritory = useMutation({
    mutationFn: () =>
      edgeApi.createSalesTerritory({
        code: territoryForm.code,
        name: territoryForm.name,
        country: territoryForm.country || null,
      }),
    onSuccess: () => {
      setTerritoryForm({ code: "", name: "", country: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "territories"],
      });
    },
  });

  const createNote = useMutation({
    mutationFn: () =>
      edgeApi.createSalesNote({
        body: noteForm.body,
        accountId: noteForm.accountId || null,
      }),
    onSuccess: () => {
      setNoteForm({ body: "", accountId: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "accounts"],
      });
    },
  });

  const createTask = useMutation({
    mutationFn: () => edgeApi.createSalesTask({ title: taskTitle }),
    onSuccess: () => {
      setTaskTitle("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "tasks"],
      });
    },
  });

  const completeTask = useMutation({
    mutationFn: (id: string) => edgeApi.completeSalesTask(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "tasks"],
      }),
  });

  const decideApproval = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
    }) => edgeApi.decideSalesApproval(id, { decision }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "approvals"],
      }),
  });

  const transitionOpp = useMutation({
    mutationFn: ({
      id,
      toStageId,
    }: {
      id: string;
      toStageId: string;
    }) => edgeApi.transitionSalesOpportunityStage(id, { toStageId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "pipeline-board"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunities"],
      });
    },
  });

  const registerPartner = useMutation({
    mutationFn: () =>
      edgeApi.registerPartnerOpportunity({
        partnerCode: partnerForm.partnerCode,
        accountName: partnerForm.accountName,
        territoryCode: partnerForm.territoryCode || null,
        estimatedMrr: partnerForm.estimatedMrr
          ? Number(partnerForm.estimatedMrr)
          : null,
      }),
    onSuccess: () => {
      setPartnerForm({
        partnerCode: "",
        accountName: "",
        territoryCode: "",
        estimatedMrr: "",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "partner-opportunities"],
      });
    },
  });

  const transitionPartner = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      edgeApi.transitionPartnerOpportunity(id, { status }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "partner-opportunities"],
      }),
  });

  const runBant = useMutation({
    mutationFn: () => edgeApi.evaluateSalesBant(bantForm),
    onSuccess: (res) => {
      const data = (res as { data?: Record<string, unknown> })?.data ?? res;
      setEngineResult(`BANT: ${JSON.stringify(data)}`);
    },
  });

  const runLeadScore = useMutation({
    mutationFn: () =>
      edgeApi.scoreSalesLead({
        fitScore: Number(leadScoreForm.fitScore),
        intentScore: Number(leadScoreForm.intentScore),
        engagementScore: Number(leadScoreForm.engagementScore),
        readinessScore: Number(leadScoreForm.readinessScore),
      }),
    onSuccess: (res) => {
      const data = (res as { data?: Record<string, unknown> })?.data ?? res;
      setEngineResult(`Lead score: ${JSON.stringify(data)}`);
    },
  });

  const createOpportunity = useMutation({
    mutationFn: () =>
      edgeApi.createSalesOpportunity({
        name: oppForm.name,
        accountId: oppForm.accountId,
        estimatedValue: oppForm.estimatedValue
          ? Number(oppForm.estimatedValue)
          : null,
        needSummary: oppForm.needSummary || null,
      }),
    onSuccess: () => {
      setOppForm({
        name: "",
        accountId: "",
        estimatedValue: "",
        needSummary: "",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunities"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "pipeline-board"],
      });
    },
  });

  const createActivity = useMutation({
    mutationFn: () =>
      edgeApi.createSalesActivity({
        activityType: activityForm.activityType,
        subject: activityForm.subject,
        opportunityId: activityForm.opportunityId || null,
      }),
    onSuccess: () => {
      setActivityForm({ activityType: "CALL", subject: "", opportunityId: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "activities"],
      });
    },
  });

  const createQuote = useMutation({
    mutationFn: () =>
      edgeApi.createSalesQuote({
        opportunityId: quoteForm.opportunityId,
        lines: [
          {
            lineNumber: 1,
            description: quoteForm.description,
            quantity: Number(quoteForm.quantity),
            unitPrice: Number(quoteForm.unitPrice),
          },
        ],
      }),
    onSuccess: () => {
      setQuoteForm({
        opportunityId: "",
        description: "Plan subscription",
        quantity: "1",
        unitPrice: "1000",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "quotes"],
      });
    },
  });

  const createDiscount = useMutation({
    mutationFn: () =>
      edgeApi.createSalesDiscountRequest({
        opportunityId: discountForm.opportunityId,
        listAmount: Number(discountForm.listAmount),
        requestedAmount: Number(discountForm.requestedAmount),
        justification: discountForm.justification,
      }),
    onSuccess: () => {
      setDiscountForm({
        opportunityId: "",
        listAmount: "1000",
        requestedAmount: "850",
        justification: "",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "discounts"],
      });
    },
  });

  const createContract = useMutation({
    mutationFn: () =>
      edgeApi.createSalesContract({
        opportunityId: contractForm.opportunityId,
        contractValue: contractForm.contractValue
          ? Number(contractForm.contractValue)
          : null,
      }),
    onSuccess: () => {
      setContractForm({ opportunityId: "", contractValue: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "contracts"],
      });
    },
  });

  const executeAmendment = useMutation({
    mutationFn: () => edgeApi.executeSalesAmendment(amendmentExecuteId.trim()),
    onSuccess: () => {
      setAmendmentExecuteId("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "contracts"],
      });
    },
  });

  const completeAssessment = useMutation({
    mutationFn: () =>
      edgeApi.completeSalesAssessment(assessmentActionId.trim(), {
        fitDecision: assessmentFitDecision,
      }),
    onSuccess: () => setAssessmentActionId(""),
  });

  const validateSolutionFit = useMutation({
    mutationFn: () =>
      edgeApi.validateSalesAssessmentSolutionFit(assessmentActionId.trim()),
    onSuccess: () => setAssessmentActionId(""),
  });

  const grantVisibility = useMutation({
    mutationFn: () =>
      edgeApi.grantSalesVisibility({
        subjectType: visibilitySubjectType,
        subjectId: visibilitySubjectId.trim(),
        granteeAdministratorId: visibilityGranteeAdminId.trim() || null,
        accessLevel: "READ",
      }),
    onSuccess: () => {
      setVisibilityGranteeAdminId("");
    },
  });

  const assertVisibility = useMutation({
    mutationFn: () =>
      edgeApi.assertSalesVisibility({
        subjectType: visibilitySubjectType,
        subjectId: visibilitySubjectId.trim(),
      }),
    onSuccess: (res) => {
      setVisibilityAssertResult(JSON.stringify(res ?? {}, null, 2));
    },
  });

  const createOrder = useMutation({
    mutationFn: () =>
      edgeApi.createSalesOrder({
        contractId: orderForm.contractId || null,
        opportunityId: orderForm.opportunityId || null,
      }),
    onSuccess: () => {
      setOrderForm({ contractId: "", opportunityId: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "orders"],
      });
    },
  });

  const requestHandoff = useMutation({
    mutationFn: (orderId: string) =>
      edgeApi.requestSalesHandoff(orderId, { requireContract: true }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "orders"],
      }),
  });

  const findDuplicates = useMutation({
    mutationFn: () =>
      edgeApi.findSalesAccountDuplicates({
        legalName: duplicateSearch.legalName,
        emailDomain: duplicateSearch.emailDomain || null,
      }),
    onSuccess: (res) =>
      setDuplicateResult(JSON.stringify(res ?? {}, null, 2)),
  });

  const mergeAccounts = useMutation({
    mutationFn: () =>
      edgeApi.mergeSalesAccounts({
        survivingAccountId: mergeForm.survivingAccountId,
        mergedAccountId: mergeForm.mergedAccountId,
        reason: mergeForm.reason,
      }),
    onSuccess: () => {
      setMergeForm({ survivingAccountId: "", mergedAccountId: "", reason: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "accounts"],
      });
    },
  });

  const transitionQuote = useMutation({
    mutationFn: () =>
      edgeApi.transitionSalesQuote(quoteInspectId.trim(), {
        toStatus: quoteTransitionStatus,
      }),
    onSuccess: () => {
      void quoteDetailQuery.refetch();
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "quotes"],
      });
    },
  });

  const transitionOrder = useMutation({
    mutationFn: () =>
      edgeApi.transitionSalesOrder(orderOpsId.trim(), {
        toStatus: orderToStatus,
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "orders"],
      }),
  });

  const setOrderLines = useMutation({
    mutationFn: () =>
      edgeApi.setSalesOrderLines(orderOpsId.trim(), {
        lines: [
          {
            lineNumber: 1,
            description: orderLineForm.description,
            quantity: Number(orderLineForm.quantity),
            unitPrice: Number(orderLineForm.unitPrice),
          },
        ],
      }),
    onSuccess: () => void orderLinesQuery.refetch(),
  });

  const opportunityPickOptions = useMemo(
    () =>
      (
        (
          opportunitiesQuery.data as
            | { items?: Record<string, unknown>[] }
            | undefined
        )?.items ?? []
      ).map((o) => ({
        id: String(o.id),
        label: `${String(o.name)} · ${String(o.opportunityNumber ?? o.id).slice(0, 8)}`,
      })),
    [opportunitiesQuery.data],
  );

  const accountPickOptions = useMemo(
    () =>
      (
        (
          accountsQuery.data as
            | { items?: Record<string, unknown>[] }
            | undefined
        )?.items ?? []
      ).map((a) => ({
        id: String(a.id),
        label: `${String(a.legalName)} · ${String(a.accountNumber ?? a.id).slice(0, 12)}`,
      })),
    [accountsQuery.data],
  );

  const marketingLeadPickOptions = useMemo(() => {
    const items =
      (leadsQuery.data as { items?: Record<string, unknown>[] } | undefined)
        ?.items ?? [];
    const ids = new Set<string>();
    for (const l of items) {
      const mid = String(l.marketingLeadId ?? "").trim();
      if (mid && mid !== "undefined" && mid !== "null") ids.add(mid);
    }
    return [...ids].map((id) => ({
      id,
      label: `${id.slice(0, 8)}… · marketing lead`,
    }));
  }, [leadsQuery.data]);

  const contractPickOptions = useMemo(
    () =>
      (
        (
          contractsQuery.data as
            | { items?: Record<string, unknown>[] }
            | undefined
        )?.items ??
        (Array.isArray(contractsQuery.data)
          ? (contractsQuery.data as Record<string, unknown>[])
          : [])
      ).map((c) => ({
        id: String(c.id),
        label: `${String(c.contractNumber ?? c.id).slice(0, 16)} · ${String(c.status ?? "")}`,
      })),
    [contractsQuery.data],
  );

  const amendmentPickOptions = useMemo(() => {
    const items =
      (
        contractsQuery.data as
          | { items?: Record<string, unknown>[] }
          | undefined
      )?.items ??
      (Array.isArray(contractsQuery.data)
        ? (contractsQuery.data as Record<string, unknown>[])
        : []);
    const out: { id: string; label: string }[] = [];
    for (const c of items) {
      const amds = c.amendments;
      if (!Array.isArray(amds)) continue;
      for (const a of amds as Record<string, unknown>[]) {
        if (!a.id) continue;
        out.push({
          id: String(a.id),
          label: `${String(c.contractNumber ?? "contract").slice(0, 12)} · ${String(a.status ?? a.id).slice(0, 12)}`,
        });
      }
    }
    return out;
  }, [contractsQuery.data]);

  const assessmentPickOptions = consultingAssessmentsQuery.data ?? [];

  const visibilitySubjectPickOptions = useMemo(() => {
    const t = visibilitySubjectType.trim().toUpperCase();
    if (t === "ACCOUNT") return accountPickOptions;
    if (t === "OPPORTUNITY") return opportunityPickOptions;
    return [];
  }, [visibilitySubjectType, accountPickOptions, opportunityPickOptions]);

  if (platformLoading) return <EdgeLoadingState label="Loading sales…" />;
  if (!canReadAny) return <EdgeForbiddenState />;

  const accounts = (accountsQuery.data as { items?: unknown[] } | undefined)
    ?.items;
  const contacts = (contactsQuery.data as { items?: unknown[] } | undefined)
    ?.items;
  const leads = (leadsQuery.data as { items?: unknown[] } | undefined)?.items;
  const opportunities = (
    opportunitiesQuery.data as { items?: unknown[] } | undefined
  )?.items;
  const pipelineBoard = pipelineQuery.data as
    | {
        pipeline?: { name?: string };
        board?: {
          stage: { id: string; name: string; code: string };
          opportunities: Record<string, unknown>[];
        }[];
      }
    | undefined;
  const teams = (teamsQuery.data as unknown[] | undefined) ?? [];
  const territories = (territoriesQuery.data as unknown[] | undefined) ?? [];
  const tasks = (tasksQuery.data as unknown[] | undefined) ?? [];
  const activities = (activitiesQuery.data as unknown[] | undefined) ?? [];
  const quotes = (quotesQuery.data as unknown[] | undefined) ?? [];
  const discounts = (discountsQuery.data as unknown[] | undefined) ?? [];
  const contracts = (contractsQuery.data as unknown[] | undefined) ?? [];
  const orders = (ordersQuery.data as unknown[] | undefined) ?? [];
  const partnerItems =
    (
      partnersQuery.data as
        | { data?: { items?: unknown[] }; items?: unknown[] }
        | undefined
    )?.data?.items ??
    (partnersQuery.data as { items?: unknown[] } | undefined)?.items ??
    (Array.isArray(partnersQuery.data) ? partnersQuery.data : []) ??
    [];
  const beachhead = beachheadQuery.data as
    | { data?: { pipeline?: unknown[]; lostReasons?: unknown[] } }
    | { pipeline?: unknown[]; lostReasons?: unknown[] }
    | undefined;
  const beachheadData =
    (beachhead as { data?: { pipeline?: unknown[] } })?.data ?? beachhead;
  const boardColumns = pipelineBoard?.board ?? [];
  const boardUsable =
    boardColumns.length > 0 &&
    boardColumns.some(
      (col) => Array.isArray(col.opportunities) && col.stage?.id,
    );
  const allBoardStages = boardColumns.map((col) => col.stage);
  const performance = performanceQuery.data as
    | Record<string, unknown>
    | undefined;
  const forecast = forecastQuery.data as
    | { amount?: number; currency?: string; opportunityCount?: number }
    | undefined;
  const overview = overviewQuery.data as
    | {
        accountsTotal?: number;
        leadsTotal?: number;
        openTasks?: number;
        inboxPending?: number;
        note?: string;
        dataQuality?: string;
      }
    | undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Sales &amp; Commercial Operations
        </p>
        <h1 className="font-display text-3xl tracking-tight">Okapi Edge Sales</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          End-to-end commercial cycle: CRM, pipeline, quotes, deal desk,
          contracts, orders and handoff. Accounts are not tenants; provisioning
          stays outside P4.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <input
            className={fieldControlClass + " min-w-[16rem] flex-1"}
            placeholder="Global search (accounts, contacts, opportunities…)"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        {searchQ.trim().length >= 2 ? (
          <ul className="mt-2 max-h-48 overflow-auto rounded-xl border border-border/70 text-sm">
            {searchQuery.isLoading ? (
              <li className="p-3 text-muted-foreground">Searching…</li>
            ) : !((searchQuery.data?.data as unknown[] | undefined) ?? [])
                .length ? (
              <li className="p-3 text-muted-foreground">No matches</li>
            ) : (
              (
                (searchQuery.data?.data as Record<string, unknown>[] | undefined) ??
                []
              ).map((hit) => (
                <li
                  key={`${String(hit.entityType)}-${String(hit.id)}`}
                  className="border-b border-border/50 p-3"
                >
                  <span className="font-medium">{String(hit.title)}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {String(hit.entityType)} · {String(hit.subtitle ?? "")}
                  </span>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {TABS.map((t) =>
          hasEdgePermission(permissions, t.permission) ? (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "default" : "ghost"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ) : null,
        )}
      </nav>

      {tab === "overview" ? (
        overviewQuery.isLoading ? (
          <EdgeLoadingState label="Loading overview…" />
        ) : overviewQuery.isError ? (
          <EdgeErrorState
            description={
              overviewQuery.error instanceof Error
                ? overviewQuery.error.message
                : "Failed to load overview"
            }
            onRetry={() => void overviewQuery.refetch()}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Accounts"
                value={overview?.accountsTotal ?? 0}
              />
              <MetricCard
                label="Sales leads"
                value={overview?.leadsTotal ?? 0}
              />
              <MetricCard
                label="Inbox pending"
                value={overview?.inboxPending ?? 0}
              />
              <MetricCard
                label="Open tasks"
                value={overview?.openTasks ?? 0}
              />
              <p className="sm:col-span-2 lg:col-span-4 text-sm text-muted-foreground">
                {overview?.note}{" "}
                <Badge tone="default">
                  {overview?.dataQuality ?? "PARTIAL"}
                </Badge>
              </p>
            </div>

            <section className="space-y-3 rounded-xl border border-border/70 p-4">
              <h2 className="text-sm font-medium">Sales engine</h2>
              <p className="text-xs text-muted-foreground">
                Beachhead stages:{" "}
                {(
                  (beachheadData as { pipeline?: { code?: string }[] })
                    ?.pipeline ?? []
                )
                  .map((s) => s.code)
                  .filter(Boolean)
                  .join(" → ") || "—"}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <form
                  className="space-y-2 rounded-lg border border-border/50 p-3"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    runBant.mutate();
                  }}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    BANT
                  </p>
                  {(
                    ["budget", "authority", "need", "timeline"] as const
                  ).map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={bantForm[key]}
                        onChange={(e) =>
                          setBantForm((s) => ({
                            ...s,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                      {key}
                    </label>
                  ))}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={runBant.isPending}
                  >
                    Evaluate BANT
                  </Button>
                </form>
                <form
                  className="grid gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-2"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    runLeadScore.mutate();
                  }}
                >
                  <p className="sm:col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Lead score
                  </p>
                  {(
                    [
                      ["fitScore", "Fit"],
                      ["intentScore", "Intent"],
                      ["engagementScore", "Engagement"],
                      ["readinessScore", "Readiness"],
                    ] as const
                  ).map(([key, label]) => (
                    <input
                      key={key}
                      className={fieldControlClass}
                      placeholder={label}
                      value={leadScoreForm[key]}
                      onChange={(e) =>
                        setLeadScoreForm((s) => ({
                          ...s,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  ))}
                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={runLeadScore.isPending}
                    >
                      Score lead
                    </Button>
                  </div>
                </form>
              </div>
              {engineResult ? (
                <pre className="overflow-auto rounded-lg bg-[var(--surface-muted)]/50 p-3 text-xs">
                  {engineResult}
                </pre>
              ) : null}
            </section>
          </div>
        )
      ) : null}

      {tab === "accounts" ? (
        <EdgePermissionGate permission="platform:sales:accounts:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:accounts:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createAccount.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  New commercial account
                </h2>
                <input
                  className={fieldControlClass}
                  placeholder="Legal name"
                  value={accountForm.legalName}
                  onChange={(e) =>
                    setAccountForm((s) => ({
                      ...s,
                      legalName: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Country"
                  value={accountForm.country}
                  onChange={(e) =>
                    setAccountForm((s) => ({ ...s, country: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Email domain"
                  value={accountForm.emailDomain}
                  onChange={(e) =>
                    setAccountForm((s) => ({
                      ...s,
                      emailDomain: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Industry"
                  value={accountForm.industry}
                  onChange={(e) =>
                    setAccountForm((s) => ({ ...s, industry: e.target.value }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createAccount.isPending}>
                    Create account
                  </Button>
                  {createAccount.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {(createAccount.error as EdgeApiError)?.message ??
                        "Create failed"}
                    </p>
                  ) : null}
                </div>
              </form>
            </EdgePermissionGate>

            {accountsQuery.isLoading ? (
              <EdgeLoadingState label="Loading accounts…" />
            ) : accountsQuery.isError ? (
              <EdgeErrorState
                error={accountsQuery.error}
                onRetry={() => void accountsQuery.refetch()}
              />
            ) : !accounts?.length ? (
              <EdgeEmptyState title="No commercial accounts yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(accounts as Record<string, unknown>[]).map((a) => (
                  <li key={String(a.id)} className="flex flex-wrap gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{String(a.legalName)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(a.accountNumber)} · {String(a.accountType)}
                      </p>
                    </div>
                    <Badge tone="default">{String(a.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}

            <EdgePermissionGate permission="platform:sales:accounts:update">
              <div className="grid gap-4 rounded-xl border border-border/70 p-4 lg:grid-cols-2">
                <form
                  className="space-y-3"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    findDuplicates.mutate();
                  }}
                >
                  <h2 className="text-sm font-medium">Find duplicates</h2>
                  <input
                    className={fieldControlClass}
                    placeholder="Legal name"
                    value={duplicateSearch.legalName}
                    onChange={(e) =>
                      setDuplicateSearch((s) => ({
                        ...s,
                        legalName: e.target.value,
                      }))
                    }
                    required
                  />
                  <input
                    className={fieldControlClass}
                    placeholder="Email domain (optional)"
                    value={duplicateSearch.emailDomain}
                    onChange={(e) =>
                      setDuplicateSearch((s) => ({
                        ...s,
                        emailDomain: e.target.value,
                      }))
                    }
                  />
                  <Button type="submit" disabled={findDuplicates.isPending}>
                    Search duplicates
                  </Button>
                </form>
                <form
                  className="space-y-3"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    mergeAccounts.mutate();
                  }}
                >
                  <h2 className="text-sm font-medium">Merge accounts</h2>
                  <ListOrUuidField
                    value={mergeForm.survivingAccountId}
                    onChange={(survivingAccountId) =>
                      setMergeForm((f) => ({ ...f, survivingAccountId }))
                    }
                    options={accountPickOptions}
                    placeholder="Survivor account"
                    fallbackPlaceholder="Survivor account ID"
                    required
                  />
                  <ListOrUuidField
                    value={mergeForm.mergedAccountId}
                    onChange={(mergedAccountId) =>
                      setMergeForm((f) => ({ ...f, mergedAccountId }))
                    }
                    options={accountPickOptions}
                    placeholder="Merged-away account"
                    fallbackPlaceholder="Merged account ID"
                    required
                  />
                  <input
                    className={fieldControlClass}
                    placeholder="Reason"
                    value={mergeForm.reason}
                    onChange={(e) =>
                      setMergeForm((f) => ({ ...f, reason: e.target.value }))
                    }
                    required
                  />
                  <Button type="submit" disabled={mergeAccounts.isPending}>
                    Merge
                  </Button>
                </form>
              </div>
              {duplicateResult ? (
                <pre className="max-h-48 overflow-auto rounded-xl border border-border/70 bg-muted/30 p-3 text-xs">
                  {duplicateResult}
                </pre>
              ) : null}
            </EdgePermissionGate>
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "contacts" ? (
        <EdgePermissionGate permission="platform:sales:contacts:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:contacts:manage">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createContact.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  New contact
                </h2>
                <ListOrUuidField
                  value={contactForm.accountId}
                  onChange={(accountId) =>
                    setContactForm((s) => ({ ...s, accountId }))
                  }
                  options={accountPickOptions}
                  placeholder="Select account"
                  fallbackPlaceholder="Account ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm((s) => ({ ...s, email: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="First name"
                  value={contactForm.firstName}
                  onChange={(e) =>
                    setContactForm((s) => ({
                      ...s,
                      firstName: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Last name"
                  value={contactForm.lastName}
                  onChange={(e) =>
                    setContactForm((s) => ({ ...s, lastName: e.target.value }))
                  }
                  required
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createContact.isPending}>
                    Create contact
                  </Button>
                </div>
              </form>
            </EdgePermissionGate>
            {contactsQuery.isLoading ? (
              <EdgeLoadingState label="Loading contacts…" />
            ) : !contacts?.length ? (
              <EdgeEmptyState title="No contacts yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(contacts as Record<string, unknown>[]).map((c) => (
                  <li key={String(c.id)} className="p-4">
                    <p className="font-medium">
                      {String(c.firstName)} {String(c.lastName)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String(c.stakeholderType)} ·{" "}
                      {String(c.emailNormalized ?? "—")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "leads" ? (
        <EdgePermissionGate permission="platform:sales:leads:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:leads:accept">
              <form
                className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 p-4"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  receiveLead.mutate();
                }}
              >
                <div className="min-w-[16rem] flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Marketing lead ID (P3)
                  </label>
                  <ListOrUuidField
                    value={receiveLeadId}
                    onChange={setReceiveLeadId}
                    options={marketingLeadPickOptions}
                    placeholder="Select marketing lead ID"
                    fallbackPlaceholder="UUID from marketing lead"
                    required
                  />
                </div>
                <Button type="submit" disabled={receiveLead.isPending}>
                  Receive into inbox
                </Button>
                {receiveLead.isError ? (
                  <p className="w-full text-sm text-destructive">
                    {(receiveLead.error as EdgeApiError)?.message ??
                      "Receive failed"}
                  </p>
                ) : null}
              </form>
            </EdgePermissionGate>

            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">
                Reject reason
              </label>
              <input
                className={fieldControlClass + " max-w-xs"}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            {leadsQuery.isLoading ? (
              <EdgeLoadingState label="Loading lead inbox…" />
            ) : !leads?.length ? (
              <EdgeEmptyState title="Sales lead inbox is empty" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(leads as Record<string, unknown>[]).map((l) => (
                  <li
                    key={String(l.id)}
                    className="flex flex-wrap items-center gap-3 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">
                        Lead {String(l.id).slice(0, 8)}…
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Marketing {String(l.marketingLeadId).slice(0, 8)}… ·{" "}
                        {String(l.salesPriority)}
                      </p>
                    </div>
                    <Badge tone="default">{String(l.status)}</Badge>
                    <EdgePermissionGate permission="platform:sales:leads:accept">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acceptLead.isPending}
                        onClick={() => acceptLead.mutate(String(l.id))}
                      >
                        Accept
                      </Button>
                    </EdgePermissionGate>
                    <EdgePermissionGate permission="platform:sales:leads:reject">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={rejectLead.isPending}
                        onClick={() => rejectLead.mutate(String(l.id))}
                      >
                        Reject
                      </Button>
                    </EdgePermissionGate>
                    <EdgePermissionGate permission="platform:sales:leads:qualify">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={qualifyLead.isPending}
                        onClick={() => qualifyLead.mutate(String(l.id))}
                      >
                        Qualify
                      </Button>
                    </EdgePermissionGate>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "opportunities" ? (
        <EdgePermissionGate permission="platform:sales:opportunities:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:opportunities:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createOpportunity.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  New opportunity
                </h2>
                <input
                  className={fieldControlClass}
                  placeholder="Opportunity name"
                  value={oppForm.name}
                  onChange={(e) =>
                    setOppForm((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                />
                <ListOrUuidField
                  value={oppForm.accountId}
                  onChange={(accountId) =>
                    setOppForm((s) => ({ ...s, accountId }))
                  }
                  options={accountPickOptions}
                  placeholder="Select account"
                  fallbackPlaceholder="Account ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Estimated value"
                  value={oppForm.estimatedValue}
                  onChange={(e) =>
                    setOppForm((s) => ({
                      ...s,
                      estimatedValue: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Need summary"
                  value={oppForm.needSummary}
                  onChange={(e) =>
                    setOppForm((s) => ({ ...s, needSummary: e.target.value }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createOpportunity.isPending}>
                    Create opportunity
                  </Button>
                  {createOpportunity.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {(createOpportunity.error as EdgeApiError)?.message ??
                        "Create failed"}
                    </p>
                  ) : null}
                </div>
              </form>
            </EdgePermissionGate>
            {opportunitiesQuery.isLoading ? (
              <EdgeLoadingState label="Loading opportunities…" />
            ) : !opportunities?.length ? (
              <EdgeEmptyState title="No opportunities yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(opportunities as Record<string, unknown>[]).map((o) => (
                  <li key={String(o.id)} className="flex flex-wrap gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/edge/sales/opportunities/${String(o.id)}`}
                        className="font-medium hover:underline"
                      >
                        {String(o.name)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {String(o.opportunityNumber)} ·{" "}
                        {String(o.estimatedValue ?? "—")} {String(o.currency)}
                      </p>
                    </div>
                    <Badge tone="default">{String(o.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "pipeline" ? (
        <EdgePermissionGate permission="platform:sales:opportunities:read">
          <section className="space-y-4">
            {pipelineQuery.isLoading ? (
              <EdgeLoadingState label="Loading pipeline…" />
            ) : pipelineQuery.isError ? (
              <EdgeErrorState
                error={pipelineQuery.error}
                onRetry={() => void pipelineQuery.refetch()}
              />
            ) : boardUsable ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {pipelineBoard?.pipeline?.name ?? "Pipeline"} — stage moves
                  are validated server-side; Closed Won is gated.
                </p>
                {transitionOpp.isError ? (
                  <p className="text-sm text-destructive">
                    {(transitionOpp.error as EdgeApiError)?.message ??
                      "Stage transition failed"}
                  </p>
                ) : null}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {boardColumns.map((col) => (
                    <div
                      key={col.stage.id}
                      className="w-72 shrink-0 rounded-xl border border-border/70 bg-[var(--surface-muted)]/40 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {col.stage.name}
                        </p>
                        <Badge tone="default">
                          {col.opportunities.length}
                        </Badge>
                      </div>
                      <ul className="space-y-2">
                        {col.opportunities.map((o) => (
                          <li
                            key={String(o.id)}
                            className="space-y-2 rounded-lg border border-border/60 bg-[var(--surface)] p-2 text-sm"
                          >
                            <Link
                              href={`/edge/sales/opportunities/${String(o.id)}`}
                              className="font-medium hover:underline"
                            >
                              {String(o.name)}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {String(o.estimatedValue ?? "—")}{" "}
                              {String(o.currency ?? "")}
                            </p>
                            <EdgePermissionGate permission="platform:sales:opportunities:update">
                              <select
                                className={fieldControlClass + " text-xs"}
                                defaultValue=""
                                disabled={transitionOpp.isPending}
                                onChange={(e) => {
                                  const toStageId = e.target.value;
                                  if (!toStageId) return;
                                  transitionOpp.mutate({
                                    id: String(o.id),
                                    toStageId,
                                  });
                                  e.target.value = "";
                                }}
                              >
                                <option value="">Move to…</option>
                                {allBoardStages
                                  .filter((s) => s.id !== col.stage.id)
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name}
                                    </option>
                                  ))}
                              </select>
                            </EdgePermissionGate>
                          </li>
                        ))}
                        {!col.opportunities.length ? (
                          <li className="text-xs text-muted-foreground">
                            Empty
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Pipeline board unavailable — showing opportunity list. Open an
                  opportunity to transition stages.
                </p>
                {opportunitiesQuery.isLoading ? (
                  <EdgeLoadingState label="Loading opportunities…" />
                ) : !opportunities?.length ? (
                  <EdgeEmptyState title="No opportunities in pipeline" />
                ) : (
                  <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                    {(opportunities as Record<string, unknown>[]).map((o) => (
                      <li
                        key={String(o.id)}
                        className="flex flex-wrap items-center gap-3 p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/edge/sales/opportunities/${String(o.id)}`}
                            className="font-medium hover:underline"
                          >
                            {String(o.name)}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {String(o.opportunityNumber)} · stage{" "}
                            {String(o.stageId ?? "—").slice(0, 8)}
                          </p>
                        </div>
                        <Badge tone="default">{String(o.status)}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "teams" ? (
        <EdgePermissionGate permission="platform:sales:teams:read">
          <section className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-medium">Teams</h2>
              <EdgePermissionGate permission="platform:sales:teams:manage">
                <form
                  className="flex flex-wrap gap-3 rounded-xl border border-border/70 p-4"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    createTeam.mutate();
                  }}
                >
                  <input
                    className={fieldControlClass}
                    placeholder="Code"
                    value={teamForm.code}
                    onChange={(e) =>
                      setTeamForm((s) => ({ ...s, code: e.target.value }))
                    }
                    required
                  />
                  <input
                    className={fieldControlClass}
                    placeholder="Name"
                    value={teamForm.name}
                    onChange={(e) =>
                      setTeamForm((s) => ({ ...s, name: e.target.value }))
                    }
                    required
                  />
                  <Button type="submit" disabled={createTeam.isPending}>
                    Create team
                  </Button>
                </form>
              </EdgePermissionGate>
              {!teams.length ? (
                <EdgeEmptyState title="No sales teams yet" />
              ) : (
                <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                  {(teams as Record<string, unknown>[]).map((t) => (
                    <li key={String(t.id)} className="p-4">
                      <p className="font-medium">{String(t.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(t.code)} · {String(t.status)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-medium">Territories</h2>
              <EdgePermissionGate permission="platform:sales:teams:manage">
                <form
                  className="flex flex-wrap gap-3 rounded-xl border border-border/70 p-4"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    createTerritory.mutate();
                  }}
                >
                  <input
                    className={fieldControlClass}
                    placeholder="Code"
                    value={territoryForm.code}
                    onChange={(e) =>
                      setTerritoryForm((s) => ({
                        ...s,
                        code: e.target.value,
                      }))
                    }
                    required
                  />
                  <input
                    className={fieldControlClass}
                    placeholder="Name"
                    value={territoryForm.name}
                    onChange={(e) =>
                      setTerritoryForm((s) => ({
                        ...s,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                  <input
                    className={fieldControlClass}
                    placeholder="Country"
                    value={territoryForm.country}
                    onChange={(e) =>
                      setTerritoryForm((s) => ({
                        ...s,
                        country: e.target.value,
                      }))
                    }
                  />
                  <Button type="submit" disabled={createTerritory.isPending}>
                    Create territory
                  </Button>
                </form>
              </EdgePermissionGate>
              {territoriesQuery.isLoading ? (
                <EdgeLoadingState label="Loading territories…" />
              ) : !territories.length ? (
                <EdgeEmptyState title="No territories yet" />
              ) : (
                <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                  {(territories as Record<string, unknown>[]).map((t) => (
                    <li key={String(t.id)} className="p-4">
                      <p className="font-medium">{String(t.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(t.code)} · {String(t.territoryType ?? "—")} ·{" "}
                        {String(t.country ?? "—")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "activities" ? (
        <EdgePermissionGate permission="platform:sales:activities:manage">
          <section className="space-y-6">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createActivity.mutate();
              }}
            >
              <select
                className={fieldControlClass}
                value={activityForm.activityType}
                onChange={(e) =>
                  setActivityForm((f) => ({
                    ...f,
                    activityType: e.target.value,
                  }))
                }
              >
                <option value="CALL">Call</option>
                <option value="MEETING">Meeting</option>
                <option value="DEMO">Demo</option>
                <option value="EMAIL">Email</option>
                <option value="FOLLOW_UP">Follow-up</option>
              </select>
              <input
                className={fieldControlClass}
                placeholder="Subject"
                value={activityForm.subject}
                onChange={(e) =>
                  setActivityForm((f) => ({ ...f, subject: e.target.value }))
                }
                required
              />
              <ListOrUuidField
                value={activityForm.opportunityId}
                onChange={(opportunityId) =>
                  setActivityForm((f) => ({ ...f, opportunityId }))
                }
                options={opportunityPickOptions}
                placeholder="Select opportunity"
                fallbackPlaceholder="Opportunity ID"
              />
              <Button type="submit" disabled={createActivity.isPending}>
                Log activity
              </Button>
            </form>

            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-3"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createNote.mutate();
              }}
            >
              <h2 className="md:col-span-3 text-sm font-medium">Add note</h2>
              <ListOrUuidField
                value={noteForm.accountId}
                onChange={(accountId) =>
                  setNoteForm((s) => ({ ...s, accountId }))
                }
                options={accountPickOptions}
                placeholder="Select account (optional)"
                fallbackPlaceholder="Account ID (optional)"
              />
              <input
                className={fieldControlClass + " md:col-span-2"}
                placeholder="Note body"
                value={noteForm.body}
                onChange={(e) =>
                  setNoteForm((s) => ({ ...s, body: e.target.value }))
                }
                required
              />
              <div className="md:col-span-3">
                <Button type="submit" disabled={createNote.isPending}>
                  Save note
                </Button>
                {createNote.isError ? (
                  <p className="mt-2 text-sm text-destructive">
                    {(createNote.error as EdgeApiError)?.message ??
                      "Note failed"}
                  </p>
                ) : createNote.isSuccess ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Note saved.
                  </p>
                ) : null}
              </div>
            </form>

            {activitiesQuery.isLoading ? (
              <EdgeLoadingState label="Loading activities…" />
            ) : !activities.length ? (
              <EdgeEmptyState title="No activities yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(activities as Record<string, unknown>[]).map((a) => (
                  <li key={String(a.id)} className="p-4">
                    <p className="font-medium">{String(a.subject)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(a.activityType)} · {String(a.status)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "quotes" ? (
        <EdgePermissionGate permission="platform:sales:quotes:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:quotes:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-5"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createQuote.mutate();
                }}
              >
                <ListOrUuidField
                  value={quoteForm.opportunityId}
                  onChange={(opportunityId) =>
                    setQuoteForm((f) => ({ ...f, opportunityId }))
                  }
                  options={opportunityPickOptions}
                  placeholder="Select opportunity"
                  fallbackPlaceholder="Opportunity ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Line description"
                  value={quoteForm.description}
                  onChange={(e) =>
                    setQuoteForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Qty"
                  value={quoteForm.quantity}
                  onChange={(e) =>
                    setQuoteForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Unit price"
                  value={quoteForm.unitPrice}
                  onChange={(e) =>
                    setQuoteForm((f) => ({ ...f, unitPrice: e.target.value }))
                  }
                />
                <Button type="submit" disabled={createQuote.isPending}>
                  Create quote
                </Button>
              </form>
            </EdgePermissionGate>
            {quotesQuery.isLoading ? (
              <EdgeLoadingState label="Loading quotes…" />
            ) : !quotes.length ? (
              <EdgeEmptyState title="No quotes yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(quotes as Record<string, unknown>[]).map((q) => (
                  <li
                    key={String(q.id)}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-medium">{String(q.quoteNumber)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(q.totalAmount)} {String(q.currency)} ·{" "}
                        {String(q.status)} · v{String(q.currentVersion)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{String(q.status)}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuoteInspectId(String(q.id))}
                      >
                        Detail
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {quoteInspectId ? (
              <div className="space-y-3 rounded-xl border border-border/70 p-4">
                <h2 className="text-sm font-medium">Quote detail</h2>
                {quoteDetailQuery.isLoading ? (
                  <EdgeLoadingState label="Loading quote…" />
                ) : quoteDetailQuery.isError ? (
                  <EdgeErrorState
                    error={quoteDetailQuery.error}
                    onRetry={() => void quoteDetailQuery.refetch()}
                  />
                ) : (
                  <pre className="max-h-48 overflow-auto rounded-lg bg-muted/30 p-3 text-xs">
                    {JSON.stringify(quoteDetailQuery.data, null, 2)}
                  </pre>
                )}
                <EdgePermissionGate permission="platform:sales:quotes:manage">
                  <div className="flex flex-wrap items-end gap-3">
                    <select
                      className={fieldControlClass}
                      value={quoteTransitionStatus}
                      onChange={(e) => setQuoteTransitionStatus(e.target.value)}
                    >
                      <option value="SENT">SENT</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                    <Button
                      disabled={transitionQuote.isPending}
                      onClick={() => transitionQuote.mutate()}
                    >
                      Transition quote
                    </Button>
                  </div>
                </EdgePermissionGate>
              </div>
            ) : null}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "proposals" ? (
        <EdgePermissionGate permission="platform:sales:proposals:manage">
          <section className="space-y-4">
            {proposalsQuery.isLoading ? (
              <EdgeLoadingState label="Loading proposals…" />
            ) : !asRecordList(proposalsQuery.data).length ? (
              <EdgeEmptyState title="No proposals yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {asRecordList(proposalsQuery.data).map(
                  (p) => (
                    <li
                      key={String(p.id)}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div>
                        <p className="font-medium">{String(p.title)}</p>
                        <p className="text-xs text-muted-foreground">
                          {String(p.proposalNumber)} · {String(p.status)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void edgeApi.generateSalesProposalDocument(String(p.id))
                        }
                      >
                        PDF
                      </Button>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "consulting" ? (
        <EdgePermissionGate permission="platform:sales:assessments:manage">
          <section className="space-y-4">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-2"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                completeAssessment.mutate();
              }}
            >
              <ListOrUuidField
                value={assessmentActionId}
                onChange={setAssessmentActionId}
                options={assessmentPickOptions}
                placeholder="Select assessment"
                fallbackPlaceholder="Assessment ID"
                required
              />
              <select
                className={fieldControlClass}
                value={assessmentFitDecision}
                onChange={(e) => setAssessmentFitDecision(e.target.value)}
              >
                {["FIT", "PARTIAL", "NO_FIT", "UNKNOWN"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={completeAssessment.isPending}>
                Complete assessment
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  !assessmentActionId.trim() || validateSolutionFit.isPending
                }
                onClick={() => validateSolutionFit.mutate()}
              >
                Validate solution fit
              </Button>
            </form>
            {questionnairesQuery.isLoading ? (
              <EdgeLoadingState label="Loading questionnaires…" />
            ) : !asRecordList(questionnairesQuery.data).length ? (
              <EdgeEmptyState title="No discovery questionnaires yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {asRecordList(questionnairesQuery.data).map((q) => (
                  <li key={String(q.id)} className="p-4">
                    <p className="font-medium">{String(q.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(q.code)} · {String(q.status)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "governance" ? (
        <EdgePermissionGate permission="platform:sales:governance:manage">
          <section className="space-y-4">
            {approvalsQuery.isLoading ? (
              <EdgeLoadingState label="Loading approvals…" />
            ) : !asRecordList(approvalsQuery.data).length ? (
              <EdgeEmptyState title="No pending approvals" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {asRecordList(approvalsQuery.data).map(
                  (a) => (
                    <li
                      key={String(a.id)}
                      className="flex flex-wrap items-center gap-3 p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {String(a.subjectType)} · {String(a.requiredLevel)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {String(a.status)} · {String(a.subjectId)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={decideApproval.isPending}
                        onClick={() =>
                          decideApproval.mutate({
                            id: String(a.id),
                            decision: "APPROVED",
                          })
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={decideApproval.isPending}
                        onClick={() =>
                          decideApproval.mutate({
                            id: String(a.id),
                            decision: "REJECTED",
                          })
                        }
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={decideApproval.isPending}
                        onClick={() =>
                          decideApproval.mutate({
                            id: String(a.id),
                            decision: "CHANGES_REQUESTED",
                          })
                        }
                      >
                        Request changes
                      </Button>
                    </li>
                  ),
                )}
              </ul>
            )}
            {decideApproval.isError ? (
              <p className="text-sm text-destructive">
                {(decideApproval.error as EdgeApiError)?.message ??
                  "Decision failed"}
              </p>
            ) : null}
            <div className="space-y-3 rounded-xl border border-border/70 p-4">
              <h3 className="font-medium">Record visibility grant</h3>
              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  grantVisibility.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Subject type (e.g. ACCOUNT)"
                  value={visibilitySubjectType}
                  onChange={(e) => setVisibilitySubjectType(e.target.value)}
                  required
                />
                <ListOrUuidField
                  value={visibilitySubjectId}
                  onChange={setVisibilitySubjectId}
                  options={visibilitySubjectPickOptions}
                  placeholder="Select subject"
                  fallbackPlaceholder="Subject ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Grantee administrator ID (optional)"
                  value={visibilityGranteeAdminId}
                  onChange={(e) => setVisibilityGranteeAdminId(e.target.value)}
                />
                <Button type="submit" disabled={grantVisibility.isPending}>
                  Grant visibility
                </Button>
              </form>
              <EdgePermissionGate permission="platform:sales:accounts:read">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    !visibilitySubjectId.trim() || assertVisibility.isPending
                  }
                  onClick={() => assertVisibility.mutate()}
                >
                  Assert access
                </Button>
                {visibilityAssertResult ? (
                  <pre className="text-xs overflow-auto rounded border p-2">
                    {visibilityAssertResult}
                  </pre>
                ) : null}
              </EdgePermissionGate>
            </div>
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "partners" ? (
        <EdgePermissionGate permission="platform:sales:opportunities:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:opportunities:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  registerPartner.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  Register partner opportunity
                </h2>
                <input
                  className={fieldControlClass}
                  placeholder="Partner code"
                  value={partnerForm.partnerCode}
                  onChange={(e) =>
                    setPartnerForm((s) => ({
                      ...s,
                      partnerCode: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Account name"
                  value={partnerForm.accountName}
                  onChange={(e) =>
                    setPartnerForm((s) => ({
                      ...s,
                      accountName: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Territory code"
                  value={partnerForm.territoryCode}
                  onChange={(e) =>
                    setPartnerForm((s) => ({
                      ...s,
                      territoryCode: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Estimated MRR"
                  value={partnerForm.estimatedMrr}
                  onChange={(e) =>
                    setPartnerForm((s) => ({
                      ...s,
                      estimatedMrr: e.target.value,
                    }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={registerPartner.isPending}>
                    Register
                  </Button>
                  {registerPartner.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {(registerPartner.error as EdgeApiError)?.message ??
                        "Register failed"}
                    </p>
                  ) : null}
                </div>
              </form>
            </EdgePermissionGate>
            {partnersQuery.isLoading ? (
              <EdgeLoadingState label="Loading partner opportunities…" />
            ) : !partnerItems.length ? (
              <EdgeEmptyState title="No partner opportunities" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(partnerItems as Record<string, unknown>[]).map((p) => (
                  <li
                    key={String(p.id)}
                    className="flex flex-wrap items-center gap-3 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{String(p.accountName)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(p.partnerCode)} ·{" "}
                        {String(p.territoryCode ?? "—")} · MRR{" "}
                        {String(p.estimatedMrr ?? "—")}
                      </p>
                    </div>
                    <Badge tone="default">{String(p.status)}</Badge>
                    <EdgePermissionGate permission="platform:sales:opportunities:update">
                      {String(p.status) === "REGISTERED" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={transitionPartner.isPending}
                            onClick={() =>
                              transitionPartner.mutate({
                                id: String(p.id),
                                status: "ACCEPTED",
                              })
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={transitionPartner.isPending}
                            onClick={() =>
                              transitionPartner.mutate({
                                id: String(p.id),
                                status: "REJECTED",
                              })
                            }
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {String(p.status) === "ACCEPTED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={transitionPartner.isPending}
                          onClick={() =>
                            transitionPartner.mutate({
                              id: String(p.id),
                              status: "CONVERTED",
                            })
                          }
                        >
                          Convert
                        </Button>
                      ) : null}
                    </EdgePermissionGate>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "dealdesk" ? (
        <EdgePermissionGate permission="platform:sales:discounts:request">
          <section className="space-y-4">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-5"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createDiscount.mutate();
              }}
            >
              <ListOrUuidField
                value={discountForm.opportunityId}
                onChange={(opportunityId) =>
                  setDiscountForm((f) => ({ ...f, opportunityId }))
                }
                options={opportunityPickOptions}
                placeholder="Select opportunity"
                fallbackPlaceholder="Opportunity ID"
                required
              />
              <input
                className={fieldControlClass}
                placeholder="List amount"
                value={discountForm.listAmount}
                onChange={(e) =>
                  setDiscountForm((f) => ({
                    ...f,
                    listAmount: e.target.value,
                  }))
                }
              />
              <input
                className={fieldControlClass}
                placeholder="Requested amount"
                value={discountForm.requestedAmount}
                onChange={(e) =>
                  setDiscountForm((f) => ({
                    ...f,
                    requestedAmount: e.target.value,
                  }))
                }
              />
              <input
                className={fieldControlClass}
                placeholder="Justification"
                value={discountForm.justification}
                onChange={(e) =>
                  setDiscountForm((f) => ({
                    ...f,
                    justification: e.target.value,
                  }))
                }
                required
              />
              <Button type="submit" disabled={createDiscount.isPending}>
                Request discount
              </Button>
            </form>
            {!discounts.length ? (
              <EdgeEmptyState title="No discount requests" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(discounts as Record<string, unknown>[]).map((d) => (
                  <li key={String(d.id)} className="p-4">
                    <p className="font-medium">
                      {String(d.discountPercent)}% · {String(d.status)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {String(d.requiredApprovalLevel)} ·{" "}
                      {String(d.justification)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "contracts" ? (
        <EdgePermissionGate permission="platform:sales:contracts:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:contracts:manage">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-3"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createContract.mutate();
                }}
              >
                <ListOrUuidField
                  value={contractForm.opportunityId}
                  onChange={(opportunityId) =>
                    setContractForm((f) => ({ ...f, opportunityId }))
                  }
                  options={opportunityPickOptions}
                  placeholder="Select opportunity"
                  fallbackPlaceholder="Opportunity ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Contract value"
                  value={contractForm.contractValue}
                  onChange={(e) =>
                    setContractForm((f) => ({
                      ...f,
                      contractValue: e.target.value,
                    }))
                  }
                />
                <Button type="submit" disabled={createContract.isPending}>
                  Create contract
                </Button>
              </form>
            </EdgePermissionGate>
            {!contracts.length ? (
              <EdgeEmptyState title="No contracts yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(contracts as Record<string, unknown>[]).map((c) => (
                  <li key={String(c.id)} className="p-4">
                    <p className="font-medium">{String(c.contractNumber)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(c.status)} · {String(c.contractValue ?? "—")}{" "}
                      {String(c.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <EdgePermissionGate permission="platform:sales:contracts:approve">
              <form
                className="flex flex-wrap gap-3 rounded-xl border border-border/70 p-4"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  executeAmendment.mutate();
                }}
              >
                <ListOrUuidField
                  className="min-w-[16rem] flex-1"
                  value={amendmentExecuteId}
                  onChange={setAmendmentExecuteId}
                  options={amendmentPickOptions}
                  placeholder="Select amendment"
                  fallbackPlaceholder="Amendment ID to execute"
                  required
                />
                <Button type="submit" disabled={executeAmendment.isPending}>
                  Execute amendment
                </Button>
              </form>
            </EdgePermissionGate>
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "orders" ? (
        <EdgePermissionGate permission="platform:sales:orders:manage">
          <section className="space-y-4">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-3"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createOrder.mutate();
              }}
            >
              <ListOrUuidField
                value={orderForm.contractId}
                onChange={(contractId) =>
                  setOrderForm((f) => ({ ...f, contractId }))
                }
                options={contractPickOptions}
                placeholder="Select contract"
                fallbackPlaceholder="Contract ID (executed)"
              />
              <ListOrUuidField
                value={orderForm.opportunityId}
                onChange={(opportunityId) =>
                  setOrderForm((f) => ({ ...f, opportunityId }))
                }
                options={opportunityPickOptions}
                placeholder="Select opportunity"
                fallbackPlaceholder="Opportunity ID (optional)"
              />
              <Button type="submit" disabled={createOrder.isPending}>
                Create order
              </Button>
            </form>
            {!orders.length ? (
              <EdgeEmptyState title="No sales orders yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(orders as Record<string, unknown>[]).map((o) => (
                  <li
                    key={String(o.id)}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-medium">{String(o.orderNumber)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(o.status)} · {String(o.totalAmount)}{" "}
                        {String(o.currency)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setOrderOpsId(String(o.id))}
                      >
                        Lines
                      </Button>
                      <EdgePermissionGate permission="platform:sales:handoff:execute">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={requestHandoff.isPending}
                          onClick={() => requestHandoff.mutate(String(o.id))}
                        >
                          Handoff
                        </Button>
                      </EdgePermissionGate>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {orderOpsId ? (
              <div className="space-y-3 rounded-xl border border-border/70 p-4">
                <h2 className="text-sm font-medium">Order lines &amp; transition</h2>
                {orderLinesQuery.isLoading ? (
                  <EdgeLoadingState label="Loading lines…" />
                ) : (
                  <pre className="max-h-40 overflow-auto rounded-lg bg-muted/30 p-3 text-xs">
                    {JSON.stringify(orderLinesQuery.data ?? [], null, 2)}
                  </pre>
                )}
                <form
                  className="grid gap-3 md:grid-cols-4"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    setOrderLines.mutate();
                  }}
                >
                  <input
                    className={fieldControlClass}
                    value={orderLineForm.description}
                    onChange={(e) =>
                      setOrderLineForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                  <input
                    className={fieldControlClass}
                    value={orderLineForm.quantity}
                    onChange={(e) =>
                      setOrderLineForm((f) => ({
                        ...f,
                        quantity: e.target.value,
                      }))
                    }
                  />
                  <input
                    className={fieldControlClass}
                    value={orderLineForm.unitPrice}
                    onChange={(e) =>
                      setOrderLineForm((f) => ({
                        ...f,
                        unitPrice: e.target.value,
                      }))
                    }
                  />
                  <Button type="submit" disabled={setOrderLines.isPending}>
                    Save lines
                  </Button>
                </form>
                <div className="flex flex-wrap items-end gap-3">
                  <select
                    className={fieldControlClass}
                    value={orderToStatus}
                    onChange={(e) => setOrderToStatus(e.target.value)}
                  >
                    <option value="FULFILLED">FULFILLED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="IN_FULFILLMENT">IN_FULFILLMENT</option>
                  </select>
                  <Button
                    disabled={transitionOrder.isPending}
                    onClick={() => transitionOrder.mutate()}
                  >
                    Transition order
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "performance" ? (
        <EdgePermissionGate permission="platform:sales:analytics:read">
          <section className="space-y-4">
            {performanceQuery.isLoading || forecastQuery.isLoading ? (
              <EdgeLoadingState label="Loading performance…" />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    label="Open opps"
                    value={Number(performance?.openOpportunities ?? 0)}
                  />
                  <MetricCard
                    label="Won"
                    value={Number(performance?.wonOpportunities ?? 0)}
                  />
                  <MetricCard
                    label="Pipeline"
                    value={Number(performance?.pipelineValue ?? 0)}
                  />
                  <MetricCard
                    label="Weighted forecast"
                    value={Number(forecast?.amount ?? 0)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {String(
                    performance?.disclaimer ??
                      "Projections only — not recognized revenue.",
                  )}
                </p>
              </>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "tasks" ? (
        <EdgePermissionGate permission="platform:sales:activities:manage">
          <section className="space-y-4">
            <form
              className="flex flex-wrap gap-3 rounded-xl border border-border/70 p-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createTask.mutate();
              }}
            >
              <input
                className={fieldControlClass + " min-w-[16rem] flex-1"}
                placeholder="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
              <Button type="submit" disabled={createTask.isPending}>
                Add task
              </Button>
            </form>
            {!tasks.length ? (
              <EdgeEmptyState title="No open tasks" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(tasks as Record<string, unknown>[]).map((t) => (
                  <li
                    key={String(t.id)}
                    className="flex flex-wrap items-center gap-3 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{String(t.title)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(t.priority)} · {String(t.status)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={completeTask.isPending}
                      onClick={() => completeTask.mutate(String(t.id))}
                    >
                      Complete
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}
