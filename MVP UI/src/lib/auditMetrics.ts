import type { Finding } from "../types";

type OnboardingLike = { collectedFlowData?: { pagesDiscovered?: number } } | undefined;

/** Pages Firecrawl saw during the most recent crawl. Pulled from either the
 *  live last-scan count (preferred, set by dashboard re-scans) or the value
 *  captured during onboarding. */
export function pagesDiscoveredFromOnboarding(
  onboardingData?: OnboardingLike,
  lastScanPagesDiscovered?: number | null,
): number {
  if (
    typeof lastScanPagesDiscovered === "number" &&
    Number.isFinite(lastScanPagesDiscovered) &&
    lastScanPagesDiscovered > 0
  ) {
    return Math.max(0, lastScanPagesDiscovered);
  }
  const n = onboardingData?.collectedFlowData?.pagesDiscovered;
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Unique page paths from findings (path strings from the scanner). */
export function uniquePagesFromFindings(findings: Finding[]): number {
  return new Set(findings.map((f) => f.page)).size;
}

/** Prefer crawl coverage when findings alone would show 0 pages. */
export function pagesCoveredDisplay(
  findings: Finding[],
  onboardingData?: OnboardingLike,
  lastScanPagesDiscovered?: number | null,
): number {
  return Math.max(
    uniquePagesFromFindings(findings),
    pagesDiscoveredFromOnboarding(onboardingData, lastScanPagesDiscovered),
  );
}

/**
 * Compliance score 0–100 (higher = better). Weighted by severity.
 * Returns null when there was no crawl coverage so we should not imply a perfect audit.
 */
export function computeComplianceScore(
  findings: Finding[],
  pagesDiscovered: number,
): number | null {
  if (findings.length === 0 && pagesDiscovered <= 0) {
    return null;
  }
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const f of findings) {
    if (f.severity === "HIGH") high += 1;
    else if (f.severity === "MEDIUM") medium += 1;
    else low += 1;
  }
  return Math.max(0, 100 - high * 18 - medium * 10 - low * 5);
}

export function scoreTextClass(score: number | null): string {
  if (score === null) return "text-[#888]";
  if (score >= 85) return "text-emerald-600";
  if (score >= 65) return "text-amber-600";
  return "text-[#dc2626]";
}

/** Human-readable explanation of where the score number comes from. Surfaces
 *  when "100" means clean vs. when it means we couldn't see anything. */
export function scoreCaption(
  score: number | null,
  findings: Finding[],
  pagesDiscovered: number,
): string {
  if (score === null) return "No crawl data";
  if (findings.length === 0) {
    if (pagesDiscovered <= 0) return "No pages scanned";
    if (pagesDiscovered === 1) return "No violations on the scanned page";
    return `No violations across ${pagesDiscovered} pages`;
  }
  const high = findings.filter((f) => f.severity === "HIGH").length;
  const medium = findings.filter((f) => f.severity === "MEDIUM").length;
  const low = findings.filter((f) => f.severity === "LOW").length;
  const parts: string[] = [];
  if (high) parts.push(`${high} high`);
  if (medium) parts.push(`${medium} medium`);
  if (low) parts.push(`${low} low`);
  return parts.length ? `Weighted by severity (${parts.join(", ")})` : "Weighted by severity";
}
