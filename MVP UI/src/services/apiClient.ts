const API_BASE_URL =
  (globalThis as { __CANDORLENS_API_BASE_URL__?: string }).__CANDORLENS_API_BASE_URL__ ||
  "http://localhost:8000";

export interface AnalyzeTextResponse {
  event_id: string;
  text: string;
  attack_class: "forced_continuity" | "false_urgency" | "fear_based_threat";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  rationale: string;
  flow_id: string;
  flow_step: number;
  url?: string | null;
  page_title?: string | null;
  raw_confidence?: number | null;
  evidence_text?: string | null;
  context_text?: string | null;
  snippet_index?: number | null;
  legal_mapping: {
    regulations: Array<{
      name: string;
      citation: string;
    }>;
    risk_severity: string;
    remediation_guidance: string;
  };
}

export interface FlowEventInput {
  text: string;
  flow_id: string;
  flow_step: number;
  url?: string;
  page_title?: string;
}

export interface AnalyzeFlowResponse {
  findings: AnalyzeTextResponse[];
  flow_context: {
    flow_id: string;
    total_events: number;
    summary: Record<string, number>;
  };
}

export interface CollectFlowResponse {
  events: FlowEventInput[];
  discovered_flows: Array<{
    id: string;
    title: string;
    path: string;
    risk_hint: string;
  }>;
  pages_discovered: number;
  discovery_debug?: {
    root_url?: string;
    resolved_url?: string;
    links_returned?: number;
    same_origin_links?: number;
    candidate_urls?: string[];
    fallback_used?: boolean;
    skipped_reason_counts?: Record<string, number>;
    map_error?: string;
  } | null;
}

export interface ReportFindingInput {
  id: string;
  title: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  regulation: string;
  confidence?: number;
  description?: string;
  extracted_text?: string;
  remediation_guidance?: string;
  attack_class?: "forced_continuity" | "false_urgency" | "fear_based_threat";
  raw_confidence?: number;
  source_url?: string;
  page_title?: string;
  flow_id?: string;
  flow_step?: number;
  evidence_text?: string;
}

export interface GenerateReportInput {
  website_url: string;
  company_name: string;
  findings: ReportFindingInput[];
}

async function handleApiError(response: Response): Promise<never> {
  const fallback = `HTTP ${response.status}`;
  try {
    const body = await response.json();
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : fallback);
  } catch (error) {
    if (error instanceof Error && error.message !== fallback) {
      throw error;
    }
    throw new Error(fallback);
  }
}

export async function analyzeText(text: string): Promise<AnalyzeTextResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
}

export async function collectFlow(websiteUrl: string, maxSteps = 8): Promise<CollectFlowResponse> {
  const response = await fetch(`${API_BASE_URL}/collect-flow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ website_url: websiteUrl, max_steps: maxSteps }),
  });
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function analyzeFlow(events: FlowEventInput[]): Promise<AnalyzeFlowResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze-flow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  });
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function generateReportPdf(payload: GenerateReportInput): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.blob();
}

