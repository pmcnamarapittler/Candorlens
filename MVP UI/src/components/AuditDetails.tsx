import React from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Gavel,
  Lightbulb,
  FileDown,
  Share2,
  Check,
  ChevronRight,
  Download,
  RotateCcw,
  CheckCircle,
  Clock,
  Circle,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Violation } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const MOCK_VIOLATIONS: Violation[] = [
  {
    id: 'v1',
    category: 'Forced Continuity',
    description: "The 'Complete Purchase' button automatically enrolls the user in a $49.99/mo recurring subscription without a separate, explicit checkbox for consent.",
    statute: "ROSCA Section 4(1), 15 U.S.C. § 8403",
    remediation: "Implement a separate, un-checked checkbox that the user must click to acknowledge the recurring nature of the charge before the 'Complete Purchase' button becomes active."
  },
  {
    id: 'v2',
    category: 'False Urgency',
    description: "A countdown timer labeled 'Your discount expires in 04:59' resets upon page refresh, creating a false sense of urgency.",
    statute: "FTC Act Section 5(a), 15 U.S.C. § 45(a)",
    remediation: "Remove deceptive countdown timers that do not reflect actual inventory or time-limited offers. If the offer is truly limited, ensure the timer state is persisted via server-side session."
  },
  {
    id: 'v3',
    category: 'Fear-Based',
    description: "Cancellation flow uses language: 'If you leave now, you will lose access to all your data forever and your account will be permanently deleted.'",
    statute: "FTC 'Restore Online Shoppers' Confidence Act' (ROSCA)",
    remediation: "Use neutral language for cancellation. Inform users of data retention policies (e.g. 'Your data will be available for 30 days if you choose to reactivate') instead of using threats."
  },
  {
    id: 'v4',
    category: 'Fear-Based',
    description: "Legal disclaimer in footer has insufficient color contrast ratio (2.1:1).",
    statute: "ADA Section 508",
    remediation: "Update the color of the disclaimer text to meet the WCAG 2.1 AA standard for contrast ratio (at least 4.5:1)."
  }
];

interface AuditDetailsProps {
  onBack: () => void;
  auditId: string;
  isDashboard?: boolean;
  onSelectFinding?: (findingId: string) => void;
  onViewAllFindings?: () => void;
  onboardingData?: any;
  onScheduleReAudit?: () => void;
  onViewReport?: () => void;
}

const MOCK_AUDITS = [
  { id: '1', url: 'candor.ai/checkout', type: 'Checkout Flow', score: 42, violations: 12, date: 'March 1, 2024' },
  { id: '2', url: 'candor.ai/signup', type: 'Signup Flow', score: 78, violations: 2, date: 'Feb 28, 2024' },
  { id: '3', url: 'candor.ai/cancel', type: 'Cancellation Flow', score: 15, violations: 24, date: 'Feb 25, 2024' },
];

const CHART_DATA = [
  { name: 'Feb 20', score: 65 },
  { name: 'Feb 22', score: 58 },
  { name: 'Feb 24', score: 72 },
  { name: 'Feb 26', score: 45 },
  { name: 'Feb 28', score: 88 },
  { name: 'Mar 01', score: 42 },
  { name: 'Mar 03', score: 55 },
];

export default function AuditDetails({ 
  auditId, 
  onBack, 
  isDashboard, 
  onSelectFinding, 
  onViewAllFindings, 
  onboardingData,
  onScheduleReAudit,
  onViewReport
}: AuditDetailsProps) {
  // In a real app, fetch audit data by ID
  const audit = MOCK_AUDITS.find(a => a.id === auditId) || MOCK_AUDITS[0];

  const displayUrl = onboardingData?.websiteUrl || audit.url;
  const displayCompany = onboardingData?.companyName || 'candor.ai';

  return (
    <div className="w-full">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start gap-6 py-6 sm:py-9 px-4 sm:px-10 border-b border-[#f0f0f0] bg-white">
        <div className="w-full sm:w-auto">
          {!isDashboard && (
            <button 
              onClick={onBack}
              className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-[#bbb] hover:text-[#111] mb-2 transition-colors"
            >
              <ArrowLeft size={10} /> Back to Overview
            </button>
          )}
          <h1 className="text-[18px] sm:text-[22px] font-light text-[#111] tracking-[-0.3px]">{isDashboard ? `${displayCompany} Compliance Audit` : 'Compliance Audit'}</h1>
          <p className="text-[10px] sm:text-[11px] text-[#bbb] mt-1 truncate max-w-[280px] sm:max-w-none">{displayUrl} · Audit completed {audit.date}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={onScheduleReAudit}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-[#f5f5f5] text-[#555] text-[10px] sm:text-[11px] font-medium rounded-md hover:bg-[#eee] transition-all whitespace-nowrap"
          >
            Schedule Re-Audit
          </button>
          <button 
            onClick={onViewReport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-[#111] text-white text-[10px] sm:text-[11px] font-medium rounded-md hover:bg-[#333] transition-all whitespace-nowrap"
          >
            View Full Report
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 px-4 sm:px-10 pb-10">
          {/* Score Section */}
          <div className="py-6 sm:py-9 border-b border-[#f0f0f0]">
            <div className="flex items-baseline">
              <span className="text-[48px] sm:text-[80px] font-light text-[#dc2626] leading-none tracking-[-3px]">{audit.score}</span>
              <span className="text-[12px] sm:text-[14px] font-light text-[#ccc] ml-2">/ 100</span>
            </div>
            <div className="text-[10px] sm:text-[12px] font-medium text-[#dc2626] uppercase tracking-[0.6px] mt-1 opacity-80">
              Current Compliance Score
            </div>
            <p className="text-[11px] sm:text-[12px] text-[#999] leading-[1.6] sm:leading-[1.7] max-w-[520px] mt-2">
              Your checkout and subscription flows have significant compliance issues. ROSCA violations detected across 4 of 5 priority findings — immediate remediation recommended.
            </p>
            
            <div className="flex gap-[2px] h-1 w-full max-w-[340px] mt-4 rounded-sm overflow-hidden">
              <div className="h-full bg-[#dc2626] rounded-sm" style={{ width: '168px' }}></div>
              <div className="h-full bg-[rgba(217,119,6,0.41)] rounded-sm" style={{ width: '112px' }}></div>
              <div className="h-full bg-[rgba(161,161,170,0.47)] rounded-sm" style={{ width: '56px' }}></div>
            </div>
            <div className="flex gap-4 mt-4">
              <span className="text-[9px] sm:text-[10px] text-[#bbb]">
                <span className="font-medium text-[#dc2626]">3</span> High
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#bbb]">
                <span className="font-medium text-[#d97706]">2</span> Medium
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#bbb]">
                <span className="font-medium text-[#ccc]">1</span> Low
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-6 sm:gap-9 py-6 border-b border-[#f0f0f0]">
            <div className="flex flex-col gap-1">
              <span className="text-[22px] sm:text-[26px] font-medium text-[#dc2626] leading-none">3</span>
              <span className="text-[9px] sm:text-[10px] text-[#bbb] uppercase tracking-[0.7px]">High Severity</span>
            </div>
            <div className="hidden sm:block w-px bg-[#f0f0f0]"></div>
            <div className="flex flex-col gap-1">
              <span className="text-[22px] sm:text-[26px] font-medium text-[#d97706] leading-none">2</span>
              <span className="text-[9px] sm:text-[10px] text-[#bbb] uppercase tracking-[0.7px]">Medium</span>
            </div>
            <div className="hidden sm:block w-px bg-[#f0f0f0]"></div>
            <div className="flex flex-col gap-1">
              <span className="text-[22px] sm:text-[26px] font-medium text-[#a1a1aa] leading-none">0</span>
              <span className="text-[9px] sm:text-[10px] text-[#bbb] uppercase tracking-[0.7px]">Low</span>
            </div>
          </div>

          {isDashboard && (
            <div className="py-9 border-b border-[#f0f0f0] grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-medium uppercase tracking-widest text-[#bbb]">Compliance Trend</h3>
                  <span className="text-[10px] font-mono text-[#ccc]">Last 30 Days</span>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fill: '#bbb'}} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fill: '#bbb'}} 
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111', 
                          border: 'none', 
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '10px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#dc2626" 
                        strokeWidth={1.5}
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-medium uppercase tracking-widest text-[#bbb]">Risk Distribution</h3>
                <div className="space-y-5">
                  {[
                    { label: 'Forced Continuity', value: 45, color: 'bg-[#dc2626]' },
                    { label: 'False Urgency', value: 32, color: 'bg-[#d97706]' },
                    { label: 'Fear-Based Threats', value: 23, color: 'bg-[#a1a1aa]' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[9px] font-medium mb-2 uppercase tracking-tight text-[#555]">
                        <span>{item.label}</span>
                        <span className="font-mono">{item.value}%</span>
                      </div>
                      <div className="h-1 w-full bg-[#f5f5f5] rounded-full overflow-hidden">
                        <div className={cn("h-full", item.color)} style={{ width: `${item.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Findings Section */}
          <div className="pt-6">
            <h2 className="text-[12px] sm:text-[14px] font-medium text-[#bbb] uppercase tracking-[1px] mb-4">Priority Findings</h2>
            
            <div className="border-y border-[#f1f5f9]">
              {MOCK_VIOLATIONS.map((v, i) => (
                <div 
                  key={v.id} 
                  onClick={() => onSelectFinding?.(v.id === 'v1' ? '1' : v.id === 'v2' ? '4' : '3')}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 pr-5 border-t border-[#f1f5f9] first:border-t-0 hover:bg-[#fafafa] transition-all cursor-pointer group gap-4 sm:gap-0"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={cn(
                        "inline-flex items-center justify-center px-2 sm:px-2.5 h-[15px] text-[9px] sm:text-[11px] rounded-full",
                        v.category === 'Forced Continuity' ? "bg-[rgba(220,53,69,0.1)] text-[#dc3545]" : "bg-[rgba(245,158,11,0.2)] text-[#d97706]"
                      )}>
                        {v.category === 'Forced Continuity' ? 'HIGH' : 'MEDIUM'}
                      </span>
                      <span className="text-[14px] sm:text-[16px] font-medium text-[#0f172a]">{v.category}: {v.id === 'v1' ? 'Missing Affirmative Consent' : v.id === 'v2' ? 'Deceptive Urgency' : 'Fear-Based Threats'}</span>
                    </div>
                    <p className="text-[11px] sm:text-[12px] text-[#64748b] mt-1 line-clamp-2 sm:line-clamp-none">{v.description}</p>
                    <div className="flex flex-wrap gap-3 sm:gap-4 mt-2">
                      <span className="text-[10px] sm:text-[11px] font-medium text-[#94a3b8]">Flow: <strong className="text-[#334155]">{v.id === 'v1' ? 'Checkout' : v.id === 'v2' ? 'Pricing' : 'Cancel'}</strong></span>
                      <span className="text-[10px] sm:text-[11px] font-medium text-[#94a3b8]">Regulation: <strong className="text-[#334155]">{v.statute.split(' ')[0]}</strong></span>
                    </div>
                  </div>
                  <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 border border-[rgba(26,43,61,0.2)] rounded-md text-[#94a3b8] flex-shrink-0 self-end sm:self-center">
                    <ChevronRight size={12} sm:size={14} strokeWidth={2.5} />
                  </span>
                </div>
              ))}
            </div>

            <div className="py-3 border-t border-[#f8fafc] text-center">
              <button 
                onClick={onViewAllFindings}
                className="text-[12px] font-medium text-[#94a3b8] underline hover:text-[#64748b]"
              >
                View All Findings
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-[280px] p-4 sm:p-9 border-t lg:border-t-0 lg:border-l border-[#f0f0f0]">
          <div className="mb-6">
            <h3 className="text-[10px] font-medium text-[#bbb] uppercase tracking-[1px] mb-4">Audit Details</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Audit Date', value: audit.date },
                { label: 'Pages Scanned', value: '12 pages' },
                { label: 'Flows Analyzed', value: 'Checkout, Cancel, Pricing' },
                { label: 'Elements Reviewed', value: '147' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-[#f8f8f8] last:border-b-0">
                  <span className="text-[10px] sm:text-[11px] text-[#aaa]">{row.label}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-[#333]">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <div className="flex justify-between mb-2">
                <span className="text-[9px] sm:text-[10px] text-[#bbb]">Remediation progress</span>
                <span className="text-[9px] sm:text-[10px] font-medium text-[#dc2626]">0 / 5</span>
              </div>
              <div className="h-[3px] bg-[#f0f0f0] rounded-sm">
                <div className="h-full bg-[#16a34a] rounded-sm w-0"></div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-[10px] font-medium text-[#bbb] uppercase tracking-[1px] mb-4">Regulation Exposure</h3>
            <div className="space-y-1.5">
              {[
                { label: 'ROSCA § 4', value: '4 violations', color: 'text-[#dc2626]' },
                { label: 'FTC Act § 5', value: '3 violations', color: 'text-[#dc2626]' },
                { label: 'CAN-SPAM', value: '1 violation', color: 'text-[#d97706]' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-[#f8f8f8] last:border-b-0">
                  <span className="text-[11px] text-[#aaa]">{row.label}</span>
                  <span className={cn("text-[11px] font-medium", row.color)}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-medium text-[#bbb] uppercase tracking-[1px] mb-4">Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={onViewReport}
                className="w-full flex items-center gap-2 py-2 border-b border-[#f8f8f8] last:border-b-0 text-[11px] text-[#555] hover:text-[#111] transition-all text-left"
              >
                <FileDown size={13} className="opacity-60" />
                Download PDF Report
              </button>
              <button className="w-full flex items-center gap-2 py-2 border-b border-[#f8f8f8] last:border-b-0 text-[11px] text-[#555] hover:text-[#111] transition-all text-left">
                <CheckCircle size={13} className="opacity-60" />
                Mark Issues as Fixed
              </button>
              <button 
                onClick={onScheduleReAudit}
                className="w-full flex items-center gap-2 py-2 border-b border-[#f8f8f8] last:border-b-0 text-[11px] text-[#555] hover:text-[#111] transition-all text-left"
              >
                <RotateCcw size={13} className="opacity-60" />
                Request Re-Audit
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
