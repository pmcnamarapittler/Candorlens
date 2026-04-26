import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  Calendar, 
  FileText, 
  Activity,
  ShieldAlert,
  Target,
  Info,
  ExternalLink,
  Gavel,
  ChevronDown
} from 'lucide-react';
import { Finding } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FindingDetailProps {
  finding: Finding;
  onBack: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onStatusChange?: (id: string, status: Finding['status']) => void;
  currentIndex: number;
  totalCount: number;
  onboardingData?: any;
}

export default function FindingDetail({ 
  finding, 
  onBack, 
  onNext, 
  onPrevious,
  onStatusChange,
  currentIndex,
  totalCount,
  onboardingData
}: FindingDetailProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const displayUrl = onboardingData?.websiteUrl || 'N/A';
  const auditDate = finding.capturedAt ? new Date(finding.capturedAt).toLocaleString() : new Date().toLocaleDateString();
  const sourceUrl = finding.sourceUrl || displayUrl;
  return (
    <div className="flex flex-col min-h-full bg-[#fcfcfc]">
      {/* Header */}
      <header className="px-10 py-6 border-b border-[#f0f0f0] bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f0] text-[#888] hover:bg-[#fafafa] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-[18px] font-medium text-[#111] tracking-[-0.3px]">Finding Detail</h1>
            <p className="text-[11px] text-[#bbb] mt-0.5">{finding.code} · {finding.element}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 text-[11px] font-medium text-[#555] border border-[#f0f0f0] rounded-lg bg-white hover:bg-[#fafafa] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>
          <button 
            onClick={onNext}
            disabled={currentIndex === totalCount - 1}
            className="px-3 py-1.5 text-[11px] font-medium text-[#555] border border-[#f0f0f0] rounded-lg bg-white hover:bg-[#fafafa] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      </header>

      {/* Breadcrumb Info Bar */}
      <div className="px-10 py-3 border-b border-[#f0f0f0] bg-white flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-[#bbb]" />
          <span className="text-[11px] font-medium text-[#555]">{displayUrl}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#bbb]" />
          <span className="text-[11px] text-[#bbb]">Audit:</span>
          <span className="text-[11px] font-medium text-[#555]">{auditDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#bbb]" />
          <span className="text-[11px] text-[#bbb]">Page:</span>
          <span className="text-[11px] font-medium text-[#555]">{finding.page}</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[#bbb]" />
          <span className="text-[11px] text-[#bbb]">Flow:</span>
          <span className="text-[11px] font-medium text-[#555]">{finding.flow}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Page Context */}
        <div className="space-y-4">
          <h2 className="text-[13px] font-medium text-[#111] uppercase tracking-wider">Page Context</h2>
          <div className="bg-white border border-[#f0f0f0] rounded-xl p-8 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <ShieldAlert className="text-red-600" size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-[15px] font-medium text-[#111]">{finding.title}</h4>
                <p className="text-[12px] text-[#888] leading-relaxed">{finding.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-[12px]">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium mb-1">Source URL</p>
                <p className="text-[#555] break-all">{sourceUrl}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium mb-1">Page Title</p>
                <p className="text-[#555]">{finding.pageTitle || finding.element}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium mb-1">Flow</p>
                <p className="text-[#555]">{finding.flow} · Step {finding.flowStep ?? 0}</p>
              </div>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium mb-2">Detected Text</p>
              <div className="p-4 bg-red-50/40 border border-red-100 rounded-xl italic text-[12px] text-[#555] leading-relaxed">
                "{finding.extractedText || 'No extracted text was returned for this finding.'}"
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detected Patterns */}
        <div className="space-y-4">
          <h2 className="text-[13px] font-medium text-[#111] uppercase tracking-wider">Detected Patterns (1)</h2>
          <div className="bg-white border border-[#f0f0f0] rounded-xl p-8 shadow-sm space-y-8">
            {/* Pattern Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-[16px] font-medium text-[#111]">{finding.title}</h3>
                <span className={cn(
                  "text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider",
                  finding.severity === 'HIGH' ? "bg-red-50 text-red-600" :
                  finding.severity === 'MEDIUM' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                )}>{finding.severity}</span>
                <span className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-50 text-emerald-600">
                  <Activity size={10} />
                  {finding.confidence}%
                </span>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
                    finding.status === 'Open' ? "border-red-100 bg-red-50/30 text-red-600 hover:bg-red-50" : 
                    finding.status === 'In Progress' ? "border-orange-100 bg-orange-50/30 text-orange-600 hover:bg-orange-50" :
                    "border-emerald-100 bg-emerald-50/30 text-emerald-600 hover:bg-emerald-50"
                  )}
                >
                  {finding.status}
                  <ChevronDown size={12} className={cn("transition-transform", isStatusOpen && "rotate-180")} />
                </button>

                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)} />
                    <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-[#f0f0f0] rounded-lg shadow-lg py-1 z-20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      {(['Open', 'In Progress', 'Completed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            onStatusChange?.(finding.id, status);
                            setIsStatusOpen(false);
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
              </div>
            </div>

            {/* Code & Title */}
            <div>
              <p className="text-[11px] font-mono text-[#bbb] mb-1">{finding.code}: {finding.title}</p>
              
              {/* Severity Box */}
              <div className="mt-4 p-4 bg-red-50/50 border border-red-100 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-red-600 font-medium mb-1">Why {finding.severity.toLowerCase()} severity?</p>
                <p className="text-[12px] text-red-700 leading-relaxed font-medium">
                  {finding.whySeverity || `Backend legal mapper assigned ${finding.severity} severity.`}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-[#bbb] font-medium mb-2">Explanation</h4>
              <p className="text-[12px] text-[#555] leading-relaxed">
                {finding.explanation || finding.description}
              </p>
            </div>

            {/* Extracted Text */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-[#bbb] font-medium mb-2">Extracted Text</h4>
              <div className="p-4 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl italic text-[12px] text-[#555] leading-relaxed">
                "{finding.extractedText || 'No extracted text was returned for this finding.'}"
              </div>
            </div>

            {/* Violated Regulation */}
            <div className="pt-6 border-t border-[#f8f9fa] space-y-4">
              <h4 className="text-[10px] uppercase tracking-wider text-[#bbb] font-medium">Violated Regulation</h4>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#f0f0f0] rounded-lg w-fit">
                <Gavel size={14} className="text-[#bbb]" />
                <span className="text-[11px] font-medium text-[#555]">{finding.regulationSection || 'FTC Act Section 5'}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium mb-2">Legal Excerpt</p>
                  <div className="p-4 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl italic text-[11px] text-[#888] leading-relaxed">
                    "{finding.legalExcerpt || finding.regulationSection || 'No citation was returned for this finding.'}"
                  </div>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium mb-2">Why This Violates the Law</p>
                  <p className="text-[11px] text-[#555] leading-relaxed">
                    {finding.violationReason || finding.explanation || finding.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Pagination */}
      <footer className="mt-auto px-10 py-6 border-t border-[#f0f0f0] bg-white flex items-center justify-between">
        <p className="text-[11px] text-[#bbb]">Finding {currentIndex + 1} of {totalCount}</p>
        <div className="flex items-center gap-2">
          <button 
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-[11px] font-medium text-[#555] border border-[#f0f0f0] rounded-lg bg-white hover:bg-[#fafafa] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>
          <button 
            onClick={onNext}
            disabled={currentIndex === totalCount - 1}
            className="px-4 py-2 text-[11px] font-medium text-[#555] border border-[#f0f0f0] rounded-lg bg-white hover:bg-[#fafafa] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      </footer>
    </div>
  );
}
