import React, { useMemo, useState } from 'react';
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
import { Finding } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReportViewProps {
  onboardingData?: any;
  onScheduleReAudit?: () => void;
  onDownloadPdf?: () => void;
  findings?: Finding[];
}

export default function ReportView({ onboardingData, onScheduleReAudit, onDownloadPdf, findings = [] }: ReportViewProps) {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const companyName = onboardingData?.companyName || 'Client';
  const website = onboardingData?.websiteUrl || 'N/A';
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const high = findings.filter((f) => f.severity === 'HIGH').length;
  const medium = findings.filter((f) => f.severity === 'MEDIUM').length;
  const low = findings.filter((f) => f.severity === 'LOW').length;
  const pagesScanned = new Set(findings.map((f) => f.page)).size;
  const regulations = Array.from(new Set(findings.map((f) => f.regulation))).slice(0, 6);
  const topFindings = findings.slice(0, 10);
  const tocEntries = useMemo(
    () => [
      { label: 'Executive Summary', detail: `${findings.length} total findings` },
      { label: 'Detailed Findings', detail: `${topFindings.length} shown` },
      { label: 'Applicable Regulations', detail: `${regulations.length} mapped` },
      { label: 'Export Options', detail: 'PDF / CSV' },
      { label: 'Next Steps', detail: high > 0 ? `${high} high priority` : 'No high priority' },
    ],
    [findings.length, high, regulations.length, topFindings.length],
  );

  const buildCsv = () => {
    const columns = [
      'id',
      'code',
      'title',
      'severity',
      'regulation',
      'page',
      'sourceUrl',
      'confidence',
      'status',
      'extractedText',
      'remediation',
    ];
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = findings.map((finding) => [
      finding.id,
      finding.code,
      finding.title,
      finding.severity,
      finding.regulation,
      finding.page,
      finding.sourceUrl,
      finding.confidence,
      finding.status,
      finding.extractedText,
      finding.violationReason,
    ]);
    return [columns, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  };

  const handleExportCsv = () => {
    const blob = new Blob([buildCsv()], { type: 'text/csv;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'candorlens_findings.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
    setActionMessage('CSV exported.');
  };

  const handleShare = async () => {
    const text = `${companyName} compliance report for ${website}: ${findings.length} findings, ${high} high severity.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'CandorLens Compliance Report',
          text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      }
      setActionMessage('Report share details copied.');
    } catch (error) {
      console.error('Failed to share report:', error);
      setActionMessage('Unable to share report.');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f8f9fa]">
      {/* Header */}
      <header className="flex justify-between items-center py-6 px-10 bg-white border-b border-[#f0f0f0]">
        <div>
          <h1 className="text-[22px] font-light text-[#111] tracking-[-0.3px]">Compliance Report</h1>
          <p className="text-[11px] text-[#bbb] mt-1">Board-ready PDF document</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#eee] text-[#555] text-[11px] font-medium rounded-md hover:bg-[#f5f5f5] transition-all"
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={onDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111] text-white text-[11px] font-medium rounded-md hover:bg-[#333] transition-all"
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      </header>
      {actionMessage && (
        <div className="mx-10 mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700">
          {actionMessage}
        </div>
      )}

      <div className="p-10 flex gap-10">
        {/* Document Preview */}
        <div className="flex-1 bg-white shadow-sm border border-[#eee] min-h-[1000px] p-16 max-w-[850px] mx-auto">
          {/* Doc Header */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center">
              <div className="flex items-center gap-2 text-[18px] font-light tracking-[-0.02em] text-[#111]">
                <div className="w-4 h-4 rounded-full border border-[#111]" />
                <span className="font-medium">candor</span>
                <span>lens</span>
              </div>
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
              <div className="flex justify-end gap-4 text-[10px] uppercase tracking-wider text-[#bbb]">
                <span>Website</span>
                <span className="text-[#111] font-medium">{website}</span>
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
                { label: 'Total Violations', value: String(findings.length), color: 'text-[#111]' },
                { label: 'High Severity', value: String(high), color: 'text-[#dc2626]' },
                { label: 'Medium Severity', value: String(medium), color: 'text-[#f59e0b]' },
                { label: 'Pages Scanned', value: String(pagesScanned), color: 'text-[#3b82f6]' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#fafafa] p-6 text-center">
                  <p className={cn("text-[32px] font-light mb-1 mt-2", stat.color)}>{stat.value}</p>
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
                {high > 0
                  ? `Detected ${high} high-severity findings. Immediate remediation is recommended.`
                  : 'No high-severity findings detected in this scan.'}
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
                {topFindings.map((row, i) => (
                  <tr key={i} className="border-b border-[#f9f9f9]">
                    <td className="py-4">
                      <span className={cn(
                        "text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider",
                        row.severity === 'HIGH' ? "bg-red-50 text-[#dc2626]" : row.severity === 'MEDIUM' ? "bg-amber-50 text-[#f59e0b]" : "bg-blue-50 text-blue-600"
                      )}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="py-4 font-medium text-[#555]">{row.code}</td>
                    <td className="py-4 text-[#111]">{row.title}</td>
                    <td className="py-4 text-right text-[#888] font-mono">{row.page}</td>
                  </tr>
                ))}
                {!topFindings.length && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#888]">No findings available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Applicable Regulations */}
          <section>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bbb] mb-6">Applicable Regulations</h3>
            <div className="space-y-4">
              {regulations.map((regulation) => (
                <div key={regulation} className="p-4 bg-[#f9f9f9] rounded flex gap-4">
                  <span className="text-[9px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded h-fit">{regulation}</span>
                  <p className="text-[11px] text-[#555] leading-relaxed">
                    Refer to mapped legal citation in finding details for this regulation.
                  </p>
                </div>
              ))}
              {!regulations.length && (
                <div className="p-4 bg-[#f9f9f9] rounded text-[11px] text-[#555]">
                  No regulation mappings available yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="w-[300px] space-y-8">
          <div className="bg-white p-6 border border-[#eee] rounded-lg shadow-sm">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-[#bbb] mb-6">Export Options</h4>
            <div className="space-y-2">
              <button
                onClick={onDownloadPdf}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#111] text-white text-[11px] font-medium uppercase tracking-widest rounded hover:bg-[#333] transition-all"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                onClick={handleExportCsv}
                disabled={!findings.length}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-[#eee] text-[#555] text-[11px] font-medium uppercase tracking-widest rounded hover:bg-[#f5f5f5] transition-all disabled:opacity-50"
              >
                <FileSpreadsheet size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white p-6 border border-[#eee] rounded-lg shadow-sm">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-[#bbb] mb-6">Table of Contents</h4>
            <div className="space-y-4">
              {tocEntries.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[12px]">
                  <span className="text-[#555]">{item.label}</span>
                  <span className="text-[#bbb] font-mono">{item.detail}</span>
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
