import React, { useState } from 'react';
import { 
  Globe, 
  Calendar, 
  Layers, 
  ChevronDown, 
  ArrowRight,
  FileText,
  Activity,
  Target
} from 'lucide-react';
import { Finding, AuditSummary } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MOCK_SUMMARY: AuditSummary = {
  website: 'acme-saas.com',
  date: 'February 14, 2026',
  pagesScanned: 12,
  score: 30
};

const MOCK_FINDINGS: Finding[] = [
  {
    id: '1',
    code: 'FA-01',
    title: 'Forced Consent — No Dismiss Option',
    description: 'Modal blocks content access until user agrees to data collection. No alternative provided.',
    severity: 'HIGH',
    regulation: 'ROSCA',
    page: '/checkout',
    flow: 'Checkout',
    element: 'Consent Modal',
    status: 'Open',
    confidence: 90,
    whySeverity: 'Violates FTC Act Section 5 — conditions content access on data collection consent with no alternative',
    explanation: 'A modal that blocks access to the website until the user consents to data collection. No dismiss option, decline button, or preference management is provided.',
    extractedText: 'By clicking \"Agree\", you have read and agree to the Terms of Use and agree to the collection and use of your information...',
    regulationSection: 'FTC Act Section 5',
    legalExcerpt: 'Unfair methods of competition in or affecting commerce, and unfair or deceptive acts or practices in or affecting commerce, are hereby declared unlawful.',
    violationReason: 'Forced Consent bundles unrelated permissions (content access + data collection) into a single non-negotiable action, eliminating user choice. Consumers cannot reasonably avoid the harm without forgoing the service entirely.'
  },
  {
    id: '2',
    code: 'FCL-02',
    title: 'Missing Auto-Renewal Disclosure',
    description: 'Free trial signup does not disclose automatic conversion to paid subscription.',
    severity: 'HIGH',
    regulation: 'ROSCA',
    page: '/signup/trial',
    flow: 'Signup',
    element: 'Trial CTA',
    status: 'In Progress',
    confidence: 94,
    whySeverity: 'ROSCA violation — failure to clearly and conspicuously disclose all material terms of a negative option feature.',
    explanation: 'The signup flow offers a "Free Trial" but fails to disclose that the user will be automatically charged $29.99/month after 7 days unless they cancel.',
    extractedText: 'Start your 7-day free trial now. No commitment.',
    regulationSection: 'ROSCA Section 4',
    legalExcerpt: 'It shall be unlawful for any person to charge or attempt to charge any consumer for any goods or services sold in a transaction effected on the Internet through a negative option feature...',
    violationReason: 'The disclosure of the auto-renewal and the amount of the recurring charge is hidden in the Terms of Service and not presented at the point of sale.'
  },
  {
    id: '3',
    code: 'FAT-03',
    title: 'No Simple Cancellation Method',
    description: 'Cancellation requires phone call to support. No online self-service option.',
    severity: 'HIGH',
    regulation: 'ROSCA',
    page: '/account/cancel',
    flow: 'Cancellation',
    element: 'Cancel Button',
    status: 'Open',
    confidence: 88,
    whySeverity: 'ROSCA violation — failure to provide simple mechanisms for a consumer to stop recurring charges.',
    explanation: 'Users are forced to call a support number during specific business hours to cancel their subscription, creating a "roach motel" pattern.',
    extractedText: 'To cancel your subscription, please call our support team at 1-800-555-0199.',
    regulationSection: 'ROSCA Section 4(3)',
    legalExcerpt: 'The person must provide simple mechanisms for a consumer to stop recurring charges from being placed on the consumer’s credit card, debit card, bank account, or other financial account.',
    violationReason: 'Requiring a phone call for a service that was purchased online is not a "simple mechanism" as defined by recent FTC guidance.'
  },
  {
    id: '4',
    code: 'FU-04',
    title: 'False Urgency — Resetting Countdown',
    description: 'Countdown timer showing "Offer expires" resets on page refresh.',
    severity: 'MEDIUM',
    regulation: 'FU-04',
    page: '/pricing',
    flow: 'Pricing',
    element: 'Timer Banner',
    status: 'Open',
    confidence: 92,
    whySeverity: 'Deceptive practice — creates a false sense of scarcity or urgency to pressure a purchase.',
    explanation: 'A banner at the top of the pricing page shows a countdown timer that resets to 10:00 every time the page is reloaded.',
    extractedText: 'Special offer ends in 09:58. Act now!',
    regulationSection: 'FTC Act Section 5(a)',
    legalExcerpt: 'Unfair or deceptive acts or practices in or affecting commerce are declared unlawful.',
    violationReason: 'The timer is a "dark pattern" designed to deceive consumers about the availability of a discount.'
  },
  {
    id: '5',
    code: 'FU-05',
    title: 'Deceptive Feature Comparison',
    description: '"Unlimited" plan has severe usage caps disclosed only in fine print.',
    severity: 'MEDIUM',
    regulation: 'FU-05',
    page: '/pricing',
    flow: 'Pricing',
    element: 'Feature Matrix',
    status: 'In Progress',
    confidence: 78,
    whySeverity: 'Misleading advertising — material limitations on "unlimited" claims are not clearly disclosed.',
    explanation: 'The "Unlimited" plan is marketed as having no limits, but a tiny footnote reveals a 5GB "fair use" cap.',
    extractedText: 'Unlimited Data* (*Subject to fair use policy)',
    regulationSection: 'FTC Deception Policy Statement',
    legalExcerpt: 'An ad is deceptive if it contains a representation or omission that is likely to mislead consumers acting reasonably under the circumstances.',
    violationReason: 'The term "unlimited" is used prominently while the actual limitation is buried in a way that most users will miss.'
  },
  {
    id: '6',
    code: 'UI-06',
    title: 'Low Contrast Disclaimer',
    description: 'Legal disclaimer in footer has insufficient color contrast ratio (2.1:1).',
    severity: 'LOW',
    regulation: 'ADA',
    page: '/home',
    flow: 'General',
    element: 'Footer Text',
    status: 'Open',
    confidence: 98,
    whySeverity: 'Accessibility issue — fails to meet WCAG 2.1 AA standards for text contrast.',
    explanation: 'The legal disclaimer text in the footer uses light gray text on a white background, making it unreadable for many users.',
    extractedText: '© 2026 Acme SaaS. All rights reserved. Terms of Service apply.',
    regulationSection: 'ADA Title III / WCAG 2.1',
    legalExcerpt: 'The visual presentation of text and images of text has a contrast ratio of at least 4.5:1.',
    violationReason: 'Insufficient contrast prevents users with visual impairments from accessing material legal information.'
  }
];

interface FindingsListProps {
  findings: Finding[];
  onStatusChange: (id: string, status: Finding['status']) => void;
  onSelectFinding: (finding: Finding) => void;
  onboardingData?: any;
}

export default function FindingsList({ findings, onStatusChange, onSelectFinding, onboardingData }: FindingsListProps) {
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [flowFilter, setFlowFilter] = useState('All Flows');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const displayUrl = onboardingData?.websiteUrl || MOCK_SUMMARY.website;

  const filteredFindings = findings.filter(f => {
    if (filter === 'High') return f.severity === 'HIGH';
    if (filter === 'Medium') return f.severity === 'MEDIUM';
    if (filter === 'Low') return f.severity === 'LOW';
    return true;
  });

  const handleStatusChange = (id: string, newStatus: Finding['status']) => {
    onStatusChange(id, newStatus);
    setActiveDropdown(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#fcfcfc]">
      {/* Header */}
      <header className="px-10 py-8 border-b border-[#f0f0f0] bg-white">
        <h1 className="text-[22px] font-light text-[#111] tracking-[-0.5px]">Audit Findings</h1>
        <p className="text-[11px] text-[#bbb] mt-1">All detected compliance violations</p>
      </header>

      <div className="p-10 space-y-8">
        {/* Summary Bar */}
        <div className="bg-white border border-[#f0f0f0] rounded-xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] flex items-center justify-center text-[#999]">
                <Globe size={16} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium">Website</p>
                <p className="text-[13px] font-medium text-[#111]">{displayUrl}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] flex items-center justify-center text-[#999]">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium">Audit Date</p>
                <p className="text-[13px] font-medium text-[#111]">{MOCK_SUMMARY.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] flex items-center justify-center text-[#999]">
                <Layers size={16} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium">Pages Scanned</p>
                <p className="text-[13px] font-medium text-[#111]">{MOCK_SUMMARY.pagesScanned} pages</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[28px] font-light text-[#dc2626] leading-none">{MOCK_SUMMARY.score}</p>
            <p className="text-[9px] uppercase tracking-widest text-[#bbb] font-medium mt-1">Score</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex bg-[#f2f2f2] p-1 rounded-lg gap-1">
            {(['All', 'High', 'Medium', 'Low'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-4 py-1.5 text-[12px] font-medium rounded-md transition-all",
                  filter === t ? "bg-white text-[#111] shadow-sm" : "text-[#888] hover:text-[#555]"
                )}
              >
                {t} ({t === 'All' ? findings.length : findings.filter(f => f.severity === t.toUpperCase()).length})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#bbb]">Flow:</span>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#f0f0f0] bg-white rounded-lg text-[12px] text-[#555] hover:bg-[#fafafa]">
              {flowFilter}
              <ChevronDown size={14} className="text-[#bbb]" />
            </button>
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-4">
          {filteredFindings.map((finding) => (
            <div 
              key={finding.id} 
              onClick={() => onSelectFinding(finding)}
              className="bg-white border border-[#f0f0f0] rounded-xl p-6 hover:border-[#e0e0e0] cursor-pointer transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider",
                    finding.severity === 'HIGH' ? "bg-red-50 text-red-600" : 
                    finding.severity === 'MEDIUM' ? "bg-orange-50 text-orange-600" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    {finding.severity}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider bg-blue-50 text-blue-600">
                    <Layers size={10} />
                    {finding.regulation}
                  </span>
                  <span className="text-[10px] text-[#bbb] font-mono">{finding.code}</span>
                </div>

                <div className="flex flex-col items-end gap-2 relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === finding.id ? null : finding.id);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-lg text-[11px] font-medium border transition-all",
                      finding.status === 'Open' ? "border-red-100 bg-red-50/30 text-red-600 hover:bg-red-50" : 
                      finding.status === 'In Progress' ? "border-orange-100 bg-orange-50/30 text-orange-600 hover:bg-orange-50" :
                      "border-emerald-100 bg-emerald-50/30 text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    {finding.status}
                    <ChevronDown size={12} className={cn("transition-transform", activeDropdown === finding.id && "rotate-180")} />
                  </button>

                  {activeDropdown === finding.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(null);
                        }}
                      />
                      <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-[#f0f0f0] rounded-lg shadow-lg py-1 z-20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                        {(['Open', 'In Progress', 'Completed'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(finding.id, status);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[11px] transition-colors",
                              finding.status === status ? "bg-[#f8f9fa] text-[#111] font-medium" : "text-[#555] hover:bg-[#fafafa]"
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <p className="text-[10px] text-[#bbb]">Confidence: <span className="text-[#10b981] font-medium">{finding.confidence}%</span></p>
                </div>
              </div>

              <h3 className="text-[15px] font-medium text-[#111] mb-1">{finding.title}</h3>
              <p className="text-[12px] text-[#888] mb-6 leading-relaxed max-w-2xl">{finding.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-[#f8f9fa]">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-[#bbb]" />
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-[#bbb] font-medium">Page</p>
                      <p className="text-[11px] text-[#555]">{finding.page}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#bbb]" />
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-[#bbb] font-medium">Flow</p>
                      <p className="text-[11px] text-[#555]">{finding.flow}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-[#bbb]" />
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-[#bbb] font-medium">Element</p>
                      <p className="text-[11px] text-[#555]">{finding.element}</p>
                    </div>
                  </div>
                </div>

                <button className="flex items-center gap-1.5 text-[11px] font-medium text-[#bbb] group-hover:text-[#111] transition-colors">
                  View
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
