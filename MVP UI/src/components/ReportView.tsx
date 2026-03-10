import React from 'react';
import { 
  FileDown, 
  Share2, 
  AlertTriangle, 
  ChevronRight,
  Download,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReportViewProps {
  onboardingData?: any;
  onScheduleReAudit?: () => void;
}

export default function ReportView({ onboardingData, onScheduleReAudit }: ReportViewProps) {
  const companyName = onboardingData?.companyName || 'Acme SaaS, Inc.';
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="flex flex-col min-h-full bg-[#f8f9fa]">
      {/* Header */}
      <header className="flex justify-between items-center py-6 px-10 bg-white border-b border-[#f0f0f0]">
        <div>
          <h1 className="text-[22px] font-light text-[#111] tracking-[-0.3px]">Compliance Report</h1>
          <p className="text-[11px] text-[#bbb] mt-1">Board-ready PDF document</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#eee] text-[#555] text-[11px] font-medium rounded-md hover:bg-[#f5f5f5] transition-all">
            <Share2 size={14} /> Share
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#111] text-white text-[11px] font-medium rounded-md hover:bg-[#333] transition-all">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </header>

      <div className="p-10 flex gap-10">
        {/* Document Preview */}
        <div className="flex-1 bg-white shadow-sm border border-[#eee] min-h-[1000px] p-16 max-w-[850px] mx-auto">
          {/* Doc Header */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center">
              <img src="/logo.png" alt="CandorLens" className="h-7 w-auto" referrerPolicy="no-referrer" />
            </div>
            <div className="text-right space-y-1">
              <div className="flex justify-end gap-4 text-[10px] uppercase tracking-wider text-[#bbb]">
                <span>Report ID</span>
                <span className="text-[#111] font-medium">RPT-2026-0214-AC01</span>
              </div>
              <div className="flex justify-end gap-4 text-[10px] uppercase tracking-wider text-[#bbb]">
                <span>Date</span>
                <span className="text-[#111] font-medium">{today}</span>
              </div>
              <div className="flex justify-end gap-4 text-[10px] uppercase tracking-wider text-[#bbb]">
                <span>Client</span>
                <span className="text-[#111] font-medium">{companyName}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#111] w-full mb-12"></div>

          <div className="mb-12">
            <h2 className="text-[32px] font-light tracking-tight text-[#111] mb-2">Compliance Audit Report</h2>
            <p className="text-[14px] text-[#888]">Subscription Interface Regulatory Compliance Assessment</p>
          </div>

          {/* Executive Summary */}
          <section className="mb-12">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bbb] mb-6">Executive Summary</h3>
            <div className="grid grid-cols-4 gap-px bg-[#f0f0f0] border border-[#f0f0f0]">
              {[
                { label: 'Total Violations', value: '5', color: 'text-[#111]' },
                { label: 'High Severity', value: '3', color: 'text-[#dc2626]' },
                { label: 'Medium Severity', value: '2', color: 'text-[#f59e0b]' },
                { label: 'Pages Scanned', value: '12', color: 'text-[#3b82f6]' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#fafafa] p-6 text-center">
                  <p className="text-[32px] font-light mb-1 mt-2 {stat.color}">{stat.value}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-[#bbb]">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Alert Box */}
          <div className="mb-12 flex items-stretch border-l-4 border-[#dc2626] bg-red-50/50 p-6 gap-6">
            <div className="mt-1">
              <AlertTriangle size={20} className="text-[#dc2626]" />
            </div>
            <div>
              <h4 className="text-[13px] font-medium text-[#dc2626] mb-1">High Risk — Immediate Remediation Recommended</h4>
              <p className="text-[12px] text-red-900/70 leading-relaxed">
                Multiple ROSCA violations detected. These patterns mirror language from recent FTC enforcement actions resulting in significant penalties.
              </p>
            </div>
          </div>

          {/* Detailed Findings */}
          <section className="mb-12">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bbb] mb-6">Detailed Findings</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f0f0f0]">
                  <th className="py-3 text-[9px] font-medium uppercase tracking-wider text-[#bbb]">Severity</th>
                  <th className="py-3 text-[9px] font-medium uppercase tracking-wider text-[#bbb]">Type</th>
                  <th className="py-3 text-[9px] font-medium uppercase tracking-wider text-[#bbb]">Finding</th>
                  <th className="py-3 text-[9px] font-medium uppercase tracking-wider text-[#bbb] text-right">Location</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {[
                  { severity: 'HIGH', type: 'FCL', finding: 'Missing Affirmative Consent for Auto-Renewal', location: '/checkout' },
                  { severity: 'HIGH', type: 'FAT', finding: 'No Simple Online Cancellation Method', location: '/cancel' },
                  { severity: 'HIGH', type: 'FCL', finding: 'Hidden Auto-Renewal in Terms Only', location: '/checkout' },
                  { severity: 'MEDIUM', type: 'FU', finding: 'Deceptive Feature Matrix Comparison', location: '/pricing' },
                  { severity: 'MEDIUM', type: 'FU', finding: 'False Urgency Countdown Timer', location: '/checkout' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[#f9f9f9]">
                    <td className="py-4">
                      <span className={cn(
                        "text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider",
                        row.severity === 'HIGH' ? "bg-red-50 text-[#dc2626]" : "bg-amber-50 text-[#f59e0b]"
                      )}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="py-4 font-medium text-[#555]">{row.type}</td>
                    <td className="py-4 text-[#111]">{row.finding}</td>
                    <td className="py-4 text-right text-[#888] font-mono">{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Applicable Regulations */}
          <section>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bbb] mb-6">Applicable Regulations</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#f9f9f9] rounded flex gap-4">
                <span className="text-[9px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded h-fit">ROSCA</span>
                <p className="text-[11px] text-[#555] leading-relaxed">
                  15 U.S.C. § 8403 — Restore Online Shoppers' Confidence Act requiring clear disclosure and affirmative consent for negative option offers
                </p>
              </div>
              <div className="p-4 bg-[#f9f9f9] rounded flex gap-4">
                <span className="text-[9px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded h-fit">FTC Act</span>
                <p className="text-[11px] text-[#555] leading-relaxed">
                  15 U.S.C. § 45 — Section 5 prohibition against unfair or deceptive acts or practices in commerce
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="w-[300px] space-y-8">
          <div className="bg-white p-6 border border-[#eee] rounded-lg shadow-sm">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-[#bbb] mb-6">Export Options</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-[#111] text-white text-[11px] font-medium uppercase tracking-widest rounded hover:bg-[#333] transition-all">
                <Download size={14} /> Download PDF
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-[#eee] text-[#555] text-[11px] font-medium uppercase tracking-widest rounded hover:bg-[#f5f5f5] transition-all">
                <FileSpreadsheet size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white p-6 border border-[#eee] rounded-lg shadow-sm">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-[#bbb] mb-6">Table of Contents</h4>
            <div className="space-y-4">
              {[
                { label: 'Executive Summary', page: 1 },
                { label: 'Detailed Findings', page: 2 },
                { label: 'Legal References', page: 5 },
                { label: 'Remediation Guide', page: 6 },
                { label: 'Appendix', page: 8 },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[12px]">
                  <span className="text-[#555]">{item.label}</span>
                  <span className="text-[#bbb] font-mono">{item.page}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 border border-[#eee] rounded-lg shadow-sm">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-[#bbb] mb-6">Next Steps</h4>
            <p className="text-[12px] text-[#888] leading-relaxed mb-6">
              After implementing fixes, schedule a verification scan to confirm compliance.
            </p>
            <button 
              onClick={onScheduleReAudit}
              className="w-full py-3 bg-[#111] text-white text-[11px] font-medium uppercase tracking-widest rounded hover:bg-[#333] transition-all"
            >
              Schedule Re-Audit
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
