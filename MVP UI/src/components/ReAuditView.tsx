import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ReAuditViewProps {
  onboardingData?: any;
  onCancel: () => void;
  onSubmit: () => void;
  isVerificationScanRunning?: boolean;
  verificationStatusMessage?: string | null;
}

export default function ReAuditView({
  onboardingData,
  onCancel,
  onSubmit,
  isVerificationScanRunning = false,
  verificationStatusMessage = null,
}: ReAuditViewProps) {
  const companyName = onboardingData?.companyName || 'your workspace';
  return (
    <div className="flex flex-col min-h-full bg-[#fcfcfc]">
      <header className="py-6 px-10 bg-white border-b border-[#f0f0f0]">
        <h1 className="text-[22px] font-light text-[#111] tracking-[-0.3px]">Schedule Re-Audit</h1>
        <p className="text-[11px] text-[#bbb] mt-1">
          Verify unresolved findings with a focused re-scan powered by live backend analysis.
        </p>
      </header>

      <div className="p-10 max-w-3xl space-y-8">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
          <AlertTriangle size={16} className="mt-0.5" />
          <p>
            This re-audit flow uses current scan state from {companyName} and verifies unresolved findings.
            No fixed compliance counts or mock outputs are used.
          </p>
        </div>
        {verificationStatusMessage && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-[12px] text-[#4b5563]">
            {verificationStatusMessage}
          </div>
        )}
        <div className="flex justify-end items-center gap-6 pt-6">
          <button 
            onClick={onCancel}
            className="text-[11px] font-medium uppercase tracking-widest text-[#888] hover:text-[#111] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            disabled={isVerificationScanRunning}
            className="px-10 py-4 bg-[#111] text-white text-[11px] font-medium uppercase tracking-widest rounded hover:bg-[#333] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVerificationScanRunning ? 'Running Verification...' : 'Run Verification Scan'}
          </button>
        </div>
      </div>
    </div>
  );
}
