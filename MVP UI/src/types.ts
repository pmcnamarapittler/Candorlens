import { LucideIcon } from 'lucide-react';

export interface Audit {
  id: string;
  url: string;
  status: 'completed' | 'processing' | 'failed';
  score: number;
  violations: number;
  date: string;
  type: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  id: string;
}

export interface Finding {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  regulation: string;
  page: string;
  flow: string;
  element: string;
  status: 'Open' | 'In Progress' | 'Completed';
  confidence: number;
  attackClass?: 'forced_continuity' | 'false_urgency' | 'fear_based_threat';
  rawConfidence?: number;
  evidenceText?: string;
  contextText?: string;
  snippetIndex?: number;
  sourceUrl?: string;
  pageTitle?: string;
  flowStep?: number;
  screenshotUrl?: string;
  capturedAt?: string;
  resolution?: string;
  whySeverity?: string;
  explanation?: string;
  extractedText?: string;
  legalExcerpt?: string;
  violationReason?: string;
  regulationSection?: string;
}

export interface AuditSummary {
  website: string;
  date: string;
  pagesScanned: number;
  score: number;
}

export interface Violation {
  id: string;
  category: 'Forced Continuity' | 'False Urgency' | 'Fear-Based';
  description: string;
  statute: string;
  remediation: string;
}
