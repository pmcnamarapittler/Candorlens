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

const DEFAULT_SUMMARY: AuditSummary = {
  website: 'No website configured',
  date: new Date().toLocaleDateString(),
  pagesScanned: 0,
  score: 100,
};

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

  const displayUrl = onboardingData?.websiteUrl || DEFAULT_SUMMARY.website;
  const pagesScanned = new Set(findings.map((f) => f.page)).size;
  const score = Math.max(0, 100 - findings.length * 10);

  const availableFlows = ['All Flows', ...Array.from(new Set(findings.map((finding) => finding.flow).filter(Boolean))).sort()];

  const filteredFindings = findings.filter(f => {
    if (filter === 'High') return f.severity === 'HIGH';
    if (filter === 'Medium') return f.severity === 'MEDIUM';
    if (filter === 'Low') return f.severity === 'LOW';
    if (flowFilter !== 'All Flows' && f.flow !== flowFilter) return false;
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
                <p className="text-[13px] font-medium text-[#111]">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] flex items-center justify-center text-[#999]">
                <Layers size={16} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium">Pages Scanned</p>
                <p className="text-[13px] font-medium text-[#111]">{pagesScanned} pages</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[28px] font-light text-[#dc2626] leading-none">{score}</p>
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
            <select
              value={flowFilter}
              onChange={(event) => setFlowFilter(event.target.value)}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#f0f0f0] bg-white rounded-lg text-[12px] text-[#555] hover:bg-[#fafafa]"
            >
              {availableFlows.map((flow) => (
                <option key={flow} value={flow}>
                  {flow}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-4">
          {!filteredFindings.length && (
            <div className="bg-white border border-[#f0f0f0] rounded-xl p-6 text-sm text-[#6b7280]">
              No findings yet. Run a scan from the Overview tab to populate this list.
            </div>
          )}
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
