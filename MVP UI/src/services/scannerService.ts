import { Finding } from "../types";
import { analyzeFlow, collectFlow } from "./apiClient";

interface LanguageEventResponse {
  event_id: string;
  text: string;
  attack_class: "forced_continuity" | "false_urgency" | "fear_based_threat";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  rationale: string;
  flow_id: string;
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

function confidenceToPercent(confidence: LanguageEventResponse["confidence"]): number {
  if (confidence === "HIGH") return 90;
  if (confidence === "MEDIUM") return 75;
  return 60;
}

export const scannerService = {
  discoverFlows: async (
    url: string,
  ): Promise<{
    discoveredFlows: Array<{ id: string; title: string; path: string; risk_hint: string }>;
    pagesDiscovered: number;
  }> => {
    const collected = await collectFlow(url);
    return {
      discoveredFlows: collected.discovered_flows,
      pagesDiscovered: collected.pages_discovered,
    };
  },

  scanUrl: async (
    url: string,
  ): Promise<{
    findings: Finding[];
    discoveredFlows: Array<{ id: string; title: string; path: string; risk_hint: string }>;
    pagesDiscovered: number;
  }> => {
    const collected = await collectFlow(url);
    if (!collected.events.length) {
      return { findings: [], discoveredFlows: collected.discovered_flows, pagesDiscovered: 0 };
    }
    const analyzed = await analyzeFlow(collected.events);
    return {
      findings: analyzed.findings.map(mapToFinding),
      discoveredFlows: collected.discovered_flows,
      pagesDiscovered: collected.pages_discovered,
    };
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

  return {
    id: event.event_id,
    code: `${codePrefix}-${shortId}`,
    title: ATTACK_CLASS_TITLE[event.attack_class] || "Compliance Finding",
    description: event.rationale,
    severity,
    regulation: regulationLabel,
    page: event.flow_id || "/",
    flow: event.flow_id || "single",
    element: "Text Segment",
    status: "Open",
    confidence: confidenceToPercent(event.confidence),
    capturedAt: new Date().toISOString(),
    whySeverity: `Risk severity assigned by legal mapper: ${event.legal_mapping.risk_severity}.`,
    explanation: event.rationale,
    extractedText: event.text,
    regulationSection,
    legalExcerpt: firstRegulation?.citation || "",
    violationReason: event.legal_mapping.remediation_guidance || event.rationale,
  };
}
