import React from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

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

export default function AuditDetails({ 
  auditId: _auditId,
  onBack, 
  isDashboard,
  onboardingData,
  onViewReport,
}: AuditDetailsProps) {
  const displayUrl = onboardingData?.websiteUrl || 'N/A';
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
          <p className="text-[10px] sm:text-[11px] text-[#bbb] mt-1 truncate max-w-[280px] sm:max-w-none">{displayUrl}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={onViewReport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-[#111] text-white text-[10px] sm:text-[11px] font-medium rounded-md hover:bg-[#333] transition-all whitespace-nowrap"
          >
            View Full Report
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 px-4 sm:px-10 pb-10">
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
            <AlertTriangle size={16} className="mt-0.5" />
            <div>
              <p>This component is intentionally disabled for production usage.</p>
              <p className="mt-1">It previously relied on embedded mock compliance data, which has been removed to prevent hardcoded outputs.</p>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={onViewReport}
              className="px-4 py-2 bg-[#111] text-white text-[11px] font-medium rounded-md hover:bg-[#333] transition-all"
            >
              View Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
