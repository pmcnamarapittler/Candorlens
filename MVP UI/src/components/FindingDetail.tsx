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
  const displayUrl = onboardingData?.websiteUrl || 'acme-saas.com';
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
          <span className="text-[11px] font-medium text-[#555]">Feb 14, 2026</span>
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
        {/* Left Column: Screenshot Analysis */}
        <div className="space-y-4">
          <h2 className="text-[13px] font-medium text-[#111] uppercase tracking-wider">Screenshot Analysis</h2>
          <div className="bg-white border border-[#f0f0f0] rounded-xl overflow-hidden shadow-sm">
            <div className="relative aspect-[16/10] bg-[#f8f9fa] flex flex-col overflow-hidden">
              {/* Browser Header */}
              <div className="h-8 bg-[#eee] border-b border-[#ddd] flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                <div className="ml-4 h-5 flex-1 bg-white rounded border border-[#ddd] flex items-center px-2">
                  <div className="w-24 h-1.5 bg-[#eee] rounded-full" />
                </div>
              </div>

              {/* Wireframe Content */}
              <div className="flex-1 p-6 relative">
                {/* Navbar Wireframe */}
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-4 bg-[#ddd] rounded" />
                  <div className="flex gap-4">
                    <div className="w-12 h-2 bg-[#eee] rounded" />
                    <div className="w-12 h-2 bg-[#eee] rounded" />
                    <div className="w-12 h-2 bg-[#eee] rounded" />
                  </div>
                </div>

                {/* Hero Section Wireframe */}
                <div className="space-y-4 mb-8">
                  <div className="w-3/4 h-8 bg-[#eee] rounded" />
                  <div className="w-1/2 h-4 bg-[#f2f2f2] rounded" />
                </div>

                {/* Grid Wireframe */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-square bg-[#f5f5f5] rounded border border-[#eee]" />
                  <div className="aspect-square bg-[#f5f5f5] rounded border border-[#eee]" />
                  <div className="aspect-square bg-[#f5f5f5] rounded border border-[#eee]" />
                </div>

                {/* Finding Highlight Overlay */}
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center p-12">
                  <div className="w-full max-w-sm bg-white rounded-xl p-8 shadow-2xl text-center relative border border-[#f0f0f0]">
                    {/* Highlight Box */}
                    <div className="absolute inset-[-4px] border-2 border-[#dc2626] rounded-xl pointer-events-none">
                      <div className="absolute top-[-12px] left-4 bg-[#dc2626] text-white text-[8px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Detected Pattern
                      </div>
                    </div>
                    
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert className="text-red-600" size={24} />
                    </div>
                    <h4 className="text-[14px] font-medium text-[#111] mb-2">{finding.title}</h4>
                    <p className="text-[10px] text-[#888] leading-relaxed mb-6">
                      {finding.description}
                    </p>
                    <div className="w-full h-10 bg-[#111] rounded-lg flex items-center justify-center">
                      <div className="w-20 h-2 bg-white/20 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Screenshot Footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between z-10">
                <p className="text-[9px] text-[#888]">Captured: {finding.capturedAt || 'Feb 14, 2026 at 2:18 PM'}</p>
                <p className="text-[9px] text-[#888]">{finding.resolution || '1440×900'}</p>
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
                <h3 className="text-[16px] font-medium text-[#111]">Forced Action</h3>
                <span className="text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider bg-red-50 text-red-600">HIGH</span>
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
                <p className="text-[10px] uppercase tracking-wider text-red-600 font-medium mb-1">Why high severity?</p>
                <p className="text-[12px] text-red-700 leading-relaxed font-medium">
                  {finding.whySeverity || 'Violates FTC Act Section 5 — conditions content access on data collection consent with no alternative'}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-[#bbb] font-medium mb-2">Explanation</h4>
              <p className="text-[12px] text-[#555] leading-relaxed">
                {finding.explanation || 'A modal that blocks access to the website until the user consents to data collection. No dismiss option, decline button, or preference management is provided.'}
              </p>
            </div>

            {/* Extracted Text */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-[#bbb] font-medium mb-2">Extracted Text</h4>
              <div className="p-4 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl italic text-[12px] text-[#555] leading-relaxed">
                "{finding.extractedText || 'By clicking \"Agree\", you have read and agree to the Terms of Use and agree to the collection and use of your information...'}"
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
                    "{finding.legalExcerpt || 'Unfair methods of competition in or affecting commerce, and unfair or deceptive acts or practices in or affecting commerce, are hereby declared unlawful.'}"
                  </div>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#bbb] font-medium mb-2">Why This Violates the Law</p>
                  <p className="text-[11px] text-[#555] leading-relaxed">
                    {finding.violationReason || 'Forced Consent bundles unrelated permissions (content access + data collection) into a single non-negotiable action, eliminating user choice. Consumers cannot reasonably avoid the harm without forgoing the service entirely.'}
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
