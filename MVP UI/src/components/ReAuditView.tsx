import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Check, 
  ArrowRight,
  ShoppingCart,
  XCircle,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReAuditViewProps {
  onboardingData?: any;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function ReAuditView({ onboardingData, onCancel, onSubmit }: ReAuditViewProps) {
  const [auditType, setAuditType] = useState<'verification' | 'full'>('verification');
  const [selectedFlows, setSelectedFlows] = useState<string[]>(['checkout', 'cancel', 'pricing']);

  const flows = [
    { id: 'checkout', title: 'Checkout Flow', paths: '/checkout, /payment, /confirmation', findings: 3, icon: ShoppingCart },
    { id: 'cancel', title: 'Cancellation Flow', paths: '/account/cancel, /support', findings: 1, icon: XCircle },
    { id: 'pricing', title: 'Pricing Page', paths: '/pricing, /plans', findings: 1, icon: CreditCard },
  ];

  const toggleFlow = (id: string) => {
    if (selectedFlows.includes(id)) {
      setSelectedFlows(selectedFlows.filter(f => f !== id));
    } else {
      setSelectedFlows([...selectedFlows, id]);
    }
  };

  const total = auditType === 'verification' ? 500 : 2500;

  return (
    <div className="flex flex-col min-h-full bg-[#fcfcfc]">
      {/* Header */}
      <header className="py-6 px-10 bg-white border-b border-[#f0f0f0]">
        <h1 className="text-[22px] font-light text-[#111] tracking-[-0.3px]">Schedule Re-Audit</h1>
        <p className="text-[11px] text-[#bbb] mt-1">Request a verification scan or full compliance re-audit</p>
      </header>

      <div className="p-10 max-w-5xl space-y-12">
        {/* Select Audit Type */}
        <section>
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bbb] mb-6">Select Audit Type</h3>
          <div className="grid grid-cols-2 gap-6">
            <div 
              onClick={() => setAuditType('verification')}
              className={cn(
                "p-8 border-2 rounded-xl cursor-pointer transition-all relative",
                auditType === 'verification' ? "border-[#111] bg-white shadow-sm" : "border-[#f0f0f0] bg-white hover:border-[#ddd]"
              )}
            >
              <div className="absolute top-6 right-6 w-5 h-5 border-2 rounded-full flex items-center justify-center">
                {auditType === 'verification' && <div className="w-2.5 h-2.5 bg-[#111] rounded-full" />}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Search size={20} className="text-[#111]" />
                <h4 className="text-[16px] font-medium text-[#111]">Verification Scan</h4>
              </div>
              <p className="text-[24px] font-light text-[#111] mb-4">$500</p>
              <p className="text-[12px] text-[#888] leading-relaxed">
                Re-scan specific flows to verify fixes. Confirms compliance for issues marked as resolved. Results in 3-5 business days.
              </p>
            </div>

            <div 
              onClick={() => setAuditType('full')}
              className={cn(
                "p-8 border-2 rounded-xl cursor-pointer transition-all relative",
                auditType === 'full' ? "border-[#111] bg-white shadow-sm" : "border-[#f0f0f0] bg-white hover:border-[#ddd]"
              )}
            >
              <div className="absolute top-6 right-6 w-5 h-5 border-2 rounded-full flex items-center justify-center">
                {auditType === 'full' && <div className="w-2.5 h-2.5 bg-[#111] rounded-full" />}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <FileText size={20} className="text-[#111]" />
                <h4 className="text-[16px] font-medium text-[#111]">Full Re-Audit</h4>
              </div>
              <p className="text-[24px] font-light text-[#111] mb-4">$2,500</p>
              <p className="text-[12px] text-[#888] leading-relaxed">
                Complete audit of all flows with fresh analysis. Recommended after major site changes. Full report in 5 business days.
              </p>
            </div>
          </div>
        </section>

        {/* Select Flows to Verify */}
        <section>
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bbb] mb-6">Select Flows to Verify</h3>
          <div className="space-y-3">
            {flows.map(flow => (
              <div 
                key={flow.id}
                onClick={() => toggleFlow(flow.id)}
                className={cn(
                  "flex items-center gap-6 p-5 border rounded-xl transition-all cursor-pointer",
                  selectedFlows.includes(flow.id) ? "border-[#111] bg-white shadow-sm" : "border-[#f0f0f0] bg-white hover:border-[#ddd]"
                )}
              >
                <div className={cn(
                  "w-5 h-5 border rounded flex items-center justify-center transition-colors",
                  selectedFlows.includes(flow.id) ? "bg-[#111] border-[#111] text-white" : "border-[#ddd]"
                )}>
                  {selectedFlows.includes(flow.id) && <Check size={12} />}
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-[#111]">{flow.title}</h4>
                  <p className="text-[11px] text-[#aaa] font-mono mt-0.5">{flow.paths}</p>
                </div>
                <div className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-medium uppercase rounded">
                  {flow.findings} {flow.findings === 1 ? 'finding' : 'findings'}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Notes */}
        <section>
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bbb] mb-6">Additional Notes</h3>
          <textarea 
            placeholder="Any specific areas of concern or changes made since the last audit..."
            className="w-full h-32 p-6 border border-[#f0f0f0] rounded-xl text-[13px] focus:outline-none focus:border-[#111] transition-colors resize-none"
          />
        </section>

        {/* Summary Card */}
        <div className="bg-[#f9f9f9] border border-[#f0f0f0] rounded-xl p-10 space-y-6">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-[#888]">Audit Type</span>
            <span className="text-[#111] font-medium">{auditType === 'verification' ? 'Verification Scan' : 'Full Re-Audit'}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-[#888]">Flows Selected</span>
            <span className="text-[#111] font-medium">{selectedFlows.length} flows</span>
          </div>
          <div className="pt-6 border-t border-[#eee] flex justify-between items-center">
            <span className="text-[18px] font-medium text-[#111]">Total</span>
            <span className="text-[24px] font-light text-[#111]">${total.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-6 pt-6">
          <button 
            onClick={onCancel}
            className="text-[11px] font-medium uppercase tracking-widest text-[#888] hover:text-[#111] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            className="px-10 py-4 bg-[#111] text-white text-[11px] font-medium uppercase tracking-widest rounded hover:bg-[#333] transition-all"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}
