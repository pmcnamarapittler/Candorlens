import { Finding } from "../types";
import { analyzeFlow, collectFlow } from "./apiClient";

interface LanguageEventResponse {
  event_id: string;
  text: string;
  attack_class: "forced_continuity" | "false_urgency" | "fear_based_threat";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  rationale: string;
  flow_id: string;
  flow_step: number;
  url?: string | null;
  page_title?: string | null;
  legal_mapping: {
    regulations: Array<{
      name: string;
      citation: string;
    }>;
    risk_severity: string;
    remediation_guidance: string;
  };
}

const ATTACK_CLASS_TITLE: Record<string, string> = {
  forced_continuity: "Forced Continuity Language",
  false_urgency: "False Urgency",
  fear_based_threat: "Fear-Based Account Threat",
};

const ATTACK_CLASS_CODE: Record<string, string> = {
  forced_continuity: "FCL",
  false_urgency: "FU",
  fear_based_threat: "FAT",
};

export interface DiscoveredFlow {
  id: string;
  title: string;
  path: string;
  risk_hint: string;
}

export interface CollectedFlowData {
  events: Array<{
    text: string;
    flow_id: string;
    flow_step: number;
    url?: string;
    page_title?: string;
  }>;
  discoveredFlows: DiscoveredFlow[];
  pagesDiscovered: number;
}

export interface ScanResult {
  findings: Finding[];
  discoveredFlows: DiscoveredFlow[];
  pagesDiscovered: number;
}

function confidenceToPercent(confidence: LanguageEventResponse["confidence"]): number {
  if (confidence === "HIGH") return 90;
  if (confidence === "MEDIUM") return 75;
  return 60;
}

function pathFromUrl(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    return new URL(value).pathname || "/";
  } catch {
    return fallback;
  }
}

export const scannerService = {
  discoverFlows: async (
    url: string,
  ): Promise<CollectedFlowData> => {
    const collected = await collectFlow(url);
    const discoveredFlows = collected.discovered_flows.length
      ? collected.discovered_flows
      : collected.events.map((event) => ({
          id: event.flow_id,
          title: event.page_title || event.flow_id,
          path: pathFromUrl(event.url, event.flow_id),
          risk_hint: event.flow_id === "root" ? "MEDIUM" : "HIGH",
        }));
    return {
      events: collected.events,
      discoveredFlows,
      pagesDiscovered: collected.pages_discovered,
    };
  },

  scanCollectedFlow: async (
    collected: CollectedFlowData,
    selectedFlowIds?: string[],
  ): Promise<ScanResult> => {
    const selected = selectedFlowIds?.length ? new Set(selectedFlowIds) : null;
    const events = selected
      ? collected.events.filter((event) => selected.has(event.flow_id))
      : collected.events;
    if (!events.length) {
      return {
        findings: [],
        discoveredFlows: collected.discoveredFlows,
        pagesDiscovered: collected.pagesDiscovered,
      };
    }
    const analyzed = await analyzeFlow(events);
    return {
      findings: analyzed.findings.map(mapToFinding),
      discoveredFlows: collected.discoveredFlows,
      pagesDiscovered: collected.pagesDiscovered,
    };
  },

  scanUrl: async (
    url: string,
  ): Promise<ScanResult> => {
    const collected = await scannerService.discoverFlows(url);
    return scannerService.scanCollectedFlow(collected);
  },
};

function mapToFinding(event: LanguageEventResponse): Finding {
  const firstRegulation = event.legal_mapping.regulations?.[0];
  const regulationLabel = firstRegulation?.name || "FTC Act Section 5";
  const regulationSection = firstRegulation
    ? `${firstRegulation.name} (${firstRegulation.citation})`
    : "FTC Act Section 5";
  const severity = (event.legal_mapping.risk_severity || "medium").toUpperCase() as
    | "HIGH"
    | "MEDIUM"
    | "LOW";
  const codePrefix = ATTACK_CLASS_CODE[event.attack_class] || "CL";
  const shortId = event.event_id.split("_").pop() || "00";
  const sourcePath = pathFromUrl(event.url, event.flow_id || "/");
  const pageTitle = event.page_title || event.flow_id || "Page";

  return {
    id: event.event_id,
    code: `${codePrefix}-${shortId}`,
    title: ATTACK_CLASS_TITLE[event.attack_class] || "Compliance Finding",
    description: event.rationale,
    severity,
    regulation: regulationLabel,
    page: sourcePath,
    flow: event.flow_id || "single",
    element: pageTitle,
    status: "Open",
    confidence: confidenceToPercent(event.confidence),
    capturedAt: new Date().toISOString(),
    attackClass: event.attack_class,
    sourceUrl: event.url || undefined,
    pageTitle,
    flowStep: event.flow_step,
    whySeverity: `Risk severity assigned by legal mapper: ${event.legal_mapping.risk_severity}.`,
    explanation: event.rationale,
    extractedText: event.text,
    regulationSection,
    legalExcerpt: firstRegulation?.citation || "",
    violationReason: event.legal_mapping.remediation_guidance || event.rationale,
  };
}
