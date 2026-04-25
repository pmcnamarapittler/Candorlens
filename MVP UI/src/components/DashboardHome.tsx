import React, { useMemo, useState } from 'react';
import { AlertTriangle, FileDown, Loader2, Search } from 'lucide-react';
import { Finding } from '../types';
import { scannerService } from '../services/scannerService';

interface DashboardHomeProps {
  findings: Finding[];
  onScanComplete: (findings: Finding[]) => void;
  onboardingData?: any;
  onGoToFindings: () => void;
  onDownloadPdf: () => void;
  appError?: string | null;
  onClearError: () => void;
}

export default function DashboardHome({
  findings,
  onScanComplete,
  onboardingData,
  onGoToFindings,
  onDownloadPdf,
  appError,
  onClearError,
}: DashboardHomeProps) {
  const [urlInput, setUrlInput] = useState(onboardingData?.websiteUrl || '');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const high = findings.filter((f) => f.severity === 'HIGH').length;
    const medium = findings.filter((f) => f.severity === 'MEDIUM').length;
    const low = findings.filter((f) => f.severity === 'LOW').length;
    const pages = new Set(findings.map((f) => f.page)).size;
    return { high, medium, low, pages };
  }, [findings]);

  const handleScan = async () => {
    if (!urlInput) return;

    setScanError(null);
    onClearError();
    setIsScanning(true);
    try {
      const results = await scannerService.scanUrl(urlInput);
      onScanComplete(results.findings);
    } catch (error) {
      console.error('Scan failed:', error);
      setScanError('Scan failed. Verify backend is running and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#fcfcfc]">
      <header className="flex flex-col sm:flex-row justify-between items-start gap-6 py-6 sm:py-9 px-6 sm:px-10 border-b border-[#f0f0f0] bg-white">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-light text-[#111] tracking-[-0.3px]">
            {onboardingData?.companyName || 'CandorLens'} Overview
          </h1>
          <p className="text-[11px] text-[#bbb] mt-1">
            {onboardingData?.websiteUrl || 'No website configured'} · {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onDownloadPdf}
            disabled={!findings.length}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-[#f5f5f5] text-[#555] text-[11px] font-medium rounded-md hover:bg-[#eee] transition-all whitespace-nowrap disabled:opacity-50"
          >
            <FileDown size={14} className="mr-2" />
            Download Report
          </button>
          <button
            onClick={onGoToFindings}
            disabled={!findings.length}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-[#111] text-white text-[11px] font-medium rounded-md hover:bg-[#333] transition-all whitespace-nowrap disabled:opacity-50"
          >
            View Findings
          </button>
        </div>
      </header>

      <div className="p-6 sm:p-10 space-y-8">
        {(appError || scanError) && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
            <AlertTriangle size={16} className="mt-0.5" />
            <div className="flex-1">{appError || scanError}</div>
          </div>
        )}

        <section className="bg-white p-1 border border-[#e5e7eb] rounded-lg shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={14} />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter text or URL to analyze"
              className="w-full bg-transparent border-none py-3 sm:py-4 pl-11 pr-4 text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning || !urlInput}
            className="bg-[#111] text-white px-6 sm:px-8 py-3 sm:py-4 font-medium text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Scanning...
              </>
            ) : (
              'Scan'
            )}
          </button>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Findings" value={String(findings.length)} />
          <SummaryCard label="High Severity" value={String(summary.high)} />
          <SummaryCard label="Medium Severity" value={String(summary.medium)} />
          <SummaryCard label="Pages Covered" value={String(summary.pages)} />
        </div>

        <section className="bg-white border border-[#f0f0f0] rounded-xl">
          <div className="px-6 py-4 border-b border-[#f5f5f5]">
            <h3 className="text-sm font-medium text-[#111]">Recent Findings</h3>
          </div>
          {!findings.length ? (
            <div className="px-6 py-10 text-sm text-[#6b7280]">
              No findings yet. Run a scan above to populate results from backend analysis.
            </div>
          ) : (
            <div className="divide-y divide-[#f5f5f5]">
              {findings.slice(0, 6).map((finding) => (
                <div key={finding.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#111]">{finding.title}</p>
                    <p className="text-xs text-[#6b7280] mt-1">{finding.description}</p>
                    <p className="text-[11px] text-[#9ca3af] mt-2">
                      {finding.page} · {finding.regulation}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-[#f3f4f6] text-[#4b5563]">
                    {finding.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#f0f0f0] rounded-lg p-5">
      <p className="text-[10px] uppercase tracking-wider text-[#9ca3af]">{label}</p>
      <p className="text-2xl font-light text-[#111] mt-2">{value}</p>
    </div>
  );
}
