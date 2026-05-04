import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  FileText, 
  Shield, 
  BarChart3, 
  Check, 
  Globe, 
  ShoppingCart, 
  CreditCard, 
  XCircle, 
  Key, 
  Settings, 
  Mail,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CollectedFlowData, DiscoveredFlow, ScanResult } from '../services/scannerService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OnboardingFlowProps {
  onComplete: (data: any, scanResult?: ScanResult) => void;
  onDiscoverFlows?: (websiteUrl: string) => Promise<CollectedFlowData>;
  onScan?: (collected: CollectedFlowData, selectedFlowIds?: string[]) => Promise<ScanResult>;
}

function ShutterIcon({ className, size = 24 }: { className?: string, size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      className={className}
    >
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2.5" />
      {/* 5 Spiral Blades */}
      <path d="M50 2 C 70 2, 90 20, 98 50 L 50 50 Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M98 50 C 98 70, 80 90, 50 98 L 50 50 Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M50 98 C 30 98, 10 80, 2 50 L 50 50 Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 50 C 2 30, 20 10, 50 2 L 50 50 Z" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Center Aperture */}
      <path d="M50 38 L 60 44 L 60 56 L 50 62 L 40 56 L 40 44 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 text-[22px] font-light tracking-[-0.02em] text-[#111]">
      <ShutterIcon size={22} className="text-[#111]" />
      <span className="font-medium">candor</span>
      <span>lens</span>
    </div>
  );
}

function LineLogo() {
  return (
    <div className="flex items-center gap-1 text-[22px] font-light tracking-[-0.02em] text-[#111]">
      <ShutterIcon size={22} className="text-[#111]" />
      <span className="font-medium">candor</span>
      <span className="text-[#111]">lens</span>
    </div>
  );
}

export default function OnboardingFlow({ onComplete, onDiscoverFlows, onScan }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    websiteUrl: '',
    workEmail: ''
  });

  const [selectedFlows, setSelectedFlows] = useState<string[]>([]);
  const [discoveredFlows, setDiscoveredFlows] = useState<DiscoveredFlow[]>([]);
  const [collectedFlowData, setCollectedFlowData] = useState<CollectedFlowData | null>(null);
  const [pagesDiscovered, setPagesDiscovered] = useState(0);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryDebug, setDiscoveryDebug] = useState<CollectedFlowData["discoveryDebug"]>(null);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1 
            formData={formData} 
            setFormData={setFormData} 
            onNext={() => setStep(1.5)} 
          />
        );
      case 1.5:
        return (
          <FlowDiscoveryLoading
            websiteUrl={formData.websiteUrl}
            onDiscoverFlows={onDiscoverFlows}
            onDiscovered={(result) => {
              setCollectedFlowData(result);
              const rawFlows = result.discoveredFlows || [];
              const evts = result.events || [];
              const hasRootEvent = evts.some((e: { flow_id?: string }) => e.flow_id === 'root');
              const mergedFlows =
                hasRootEvent && !rawFlows.some((f: { id: string }) => f.id === 'root')
                  ? [
                      {
                        id: 'root',
                        title: 'Home',
                        path: '/',
                        risk_hint: 'MEDIUM',
                      },
                      ...rawFlows,
                    ]
                  : rawFlows;
              setDiscoveredFlows(mergedFlows);
              setPagesDiscovered(result.pagesDiscovered || 0);
              setDiscoveryDebug(result.discoveryDebug || null);
              const suggested = mergedFlows.slice(0, 5).map((flow: { id: string }) => flow.id);
              if (suggested.length) {
                setSelectedFlows(suggested);
              }
            }}
            onError={(message: string) => setDiscoveryError(message)}
            onComplete={() => setStep(2)}
          />
        );
      case 2:
        return (
          <Step2 
            selectedFlows={selectedFlows} 
            setSelectedFlows={setSelectedFlows} 
            websiteUrl={formData.websiteUrl}
            discoveredFlows={discoveredFlows}
            events={collectedFlowData?.events || []}
            pagesDiscovered={pagesDiscovered}
            discoveryError={discoveryError}
            discoveryDebug={discoveryDebug}
            onNext={handleNext} 
            onBack={() => setStep(1)} 
          />
        );
      case 3:
        return (
          <Step3
            websiteUrl={formData.websiteUrl}
            pagesDiscovered={pagesDiscovered}
            selectedFlows={selectedFlows}
            collectedFlowData={collectedFlowData}
            onScan={onScan}
            onBack={() => setStep(2)}
            onComplete={(scanResult: ScanResult) =>
              onComplete({ ...formData, selectedFlows, collectedFlowData }, scanResult)
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {step === 1 ? (
        renderStep()
      ) : (
        <div className="flex-1 flex flex-col items-center py-12 px-6 sm:justify-center">
          <div className="w-full max-w-7xl xl:px-12">
            {!(step === 1.5 || step === 3) && (
              <div className="mb-12">
                {step === 2 ? <LineLogo /> : <Logo />}
              </div>
            )}
            {renderStep()}
          </div>
        </div>
      )}
    </div>
  );
}

function Step1({ formData, setFormData, onNext }: any) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!formData.companyName.trim()) nextErrors.companyName = 'Company name is required.';
    if (!formData.websiteUrl.trim()) {
      nextErrors.websiteUrl = 'Website URL is required.';
    } else {
      try {
        const parsed = new URL(formData.websiteUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          nextErrors.websiteUrl = 'Website URL must start with http:// or https://.';
        }
      } catch {
        nextErrors.websiteUrl = 'Enter a valid website URL, including https://.';
      }
    }
    if (!formData.workEmail.trim()) {
      nextErrors.workEmail = 'Work email is required.';
    } else if (!emailPattern.test(formData.workEmail)) {
      nextErrors.workEmail = 'Enter a valid work email address.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onNext();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Left Side: Form */}
      <div className="flex-1 p-8 lg:p-16 xl:p-24 flex flex-col">
        <div className="mb-16">
          <Logo />
        </div>

        <div className="max-w-xl w-full mx-auto lg:mx-0 space-y-12">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#888] mb-6">Step 1 of 3</p>
            <h2 className="text-[42px] xl:text-[48px] font-light tracking-tight text-[#111] leading-tight mb-4">Let's get started</h2>
            <p className="text-[14px] text-[#666] leading-relaxed">Enter your details and we'll scan your website for potential compliance violations.</p>
          </div>

          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">First Name</label>
                <input 
                  type="text" 
                  value={formData.firstName}
                  placeholder="Jane"
                  onChange={e => {
                    setFormData({...formData, firstName: e.target.value});
                    setErrors(({ firstName, ...rest }) => rest);
                  }}
                  className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
                />
                {errors.firstName && <p className="text-[10px] text-red-600">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Last Name</label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  placeholder="Smith"
                  onChange={e => {
                    setFormData({...formData, lastName: e.target.value});
                    setErrors(({ lastName, ...rest }) => rest);
                  }}
                  className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
                />
                {errors.lastName && <p className="text-[10px] text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Company Name</label>
              <input 
                type="text" 
                value={formData.companyName}
                placeholder="Acme SaaS, Inc."
                onChange={e => {
                  setFormData({...formData, companyName: e.target.value});
                  setErrors(({ companyName, ...rest }) => rest);
                }}
                className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
              />
              {errors.companyName && <p className="text-[10px] text-red-600">{errors.companyName}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Website URL</label>
              <input 
                type="text" 
                value={formData.websiteUrl}
                placeholder="https://example.com"
                onChange={e => {
                  setFormData({...formData, websiteUrl: e.target.value});
                  setErrors(({ websiteUrl, ...rest }) => rest);
                }}
                className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
              />
              <p className="text-[10px] text-[#aaa]">We'll analyze your checkout, pricing, and cancellation flows</p>
              {errors.websiteUrl && <p className="text-[10px] text-red-600">{errors.websiteUrl}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Work Email</label>
              <input 
                type="email" 
                value={formData.workEmail}
                placeholder="jane@company.com"
                onChange={e => {
                  setFormData({...formData, workEmail: e.target.value});
                  setErrors(({ workEmail, ...rest }) => rest);
                }}
                className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
              />
              {errors.workEmail && <p className="text-[10px] text-red-600">{errors.workEmail}</p>}
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSubmit}
              className="bg-[#111] text-white rounded-lg px-10 py-3.5 text-[13px] font-medium hover:bg-[#333] transition-colors"
            >
              Scan My Website
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Image Overlay */}
      <div className="hidden lg:block lg:w-[45%] xl:w-[50%] p-6">
        <div className="relative h-full w-full rounded-[32px] overflow-hidden bg-[#222]">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070" 
            alt="Mountains" 
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-40"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
}

function FlowDiscoveryLoading({ websiteUrl, onDiscoverFlows, onDiscovered, onError, onComplete }: any) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing crawler...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const runDiscovery = async () => {
      if (!onDiscoverFlows || !websiteUrl) return;
      try {
        setStatus('Calling Firecrawl...');
        const result = await onDiscoverFlows(websiteUrl);
        if (!cancelled && onDiscovered) {
          onDiscovered(result);
          setProgress(100);
          setStatus('Discovery complete');
          setTimeout(onComplete, 500);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Flow discovery failed.';
        if (!cancelled && onError) {
          setError(message);
          setProgress(100);
          setStatus('Discovery failed');
          onError(message);
        }
      }
    };
    runDiscovery();

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p;
        return p + 3;
      });
    }, 100);

    const statusTimer = setInterval(() => {
      const statuses = [
        'Crawling sitemap...',
        'Discovering page hierarchy...',
        'Identifying interactive elements...',
        'Mapping user flows...',
        'Finalizing discovery...'
      ];
      
      setStatus(prev => {
        const nextIndex = statuses.indexOf(prev) + 1;
        if (nextIndex < statuses.length) return statuses[nextIndex];
        return prev;
      });
    }, 900);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [onComplete, onDiscoverFlows, onDiscovered, onError, websiteUrl]);

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-center">
      <div className="mb-12">
        <div className="w-16 h-16 bg-[#fcfcfc] border border-[#f0f0f0] rounded-full flex items-center justify-center mx-auto mb-8">
          <Loader2 size={32} className="animate-spin text-[#111]" />
        </div>
        <h2 className="text-[24px] sm:text-[32px] font-light tracking-tight text-[#111] leading-tight">Discovering your website flows</h2>
        <p className="text-[14px] text-[#666] mt-4">We're mapping out your checkout, pricing, and cancellation paths</p>
        {error && (
          <p className="text-[13px] text-red-600 mt-4">
            {error}
          </p>
        )}
      </div>

      <div className="w-full max-w-md">
        <div className="relative pt-1">
          <div className="flex mb-4 items-center justify-between">
            <span className="text-[11px] font-medium text-[#888] uppercase tracking-wider">{status}</span>
            <span className="text-[11px] font-medium text-[#111]">{progress}%</span>
          </div>
          <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded bg-[#f5f5f5]">
            <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#111] transition-all duration-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2({ selectedFlows, setSelectedFlows, websiteUrl, discoveredFlows, events, pagesDiscovered, discoveryError, discoveryDebug, onNext, onBack }: any) {
  const normalizedWebsite = (websiteUrl || '').trim();
  const websiteHost = normalizedWebsite
    ? normalizedWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : 'your-site.com';
  const flows = (discoveredFlows || []).map((f: any) => ({
        id: f.id,
        title: f.title,
        paths: f.path,
        risk: `${(f.risk_hint || 'MEDIUM').toUpperCase()} RISK`,
        icon: Globe,
      }));
  const treePaths = Array.from(
    new Set(
      (events || [])
        .map((event: any) => {
          if (event.url) {
            try {
              return new URL(event.url).pathname || '/';
            } catch {
              return event.url;
            }
          }
          return event.flow_id ? `/${event.flow_id}` : null;
        })
        .filter(Boolean)
    )
  );
  const zeroFlowDiagnostic = !flows.length && discoveryDebug
    ? `Firecrawl returned ${discoveryDebug.links_returned ?? 0} links, ${discoveryDebug.same_origin_links ?? 0} same-site links, and ${discoveryDebug.candidate_urls?.length ?? 0} candidate flow URLs${discoveryDebug.fallback_used ? ' after map fallback' : ''}.`
    : null;

  const toggleFlow = (id: string) => {
    if (selectedFlows.includes(id)) {
      setSelectedFlows(selectedFlows.filter((f: string) => f !== id));
    } else if (selectedFlows.length < 5) {
      setSelectedFlows([...selectedFlows, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20 xl:gap-32">
      <div className="lg:col-span-2 space-y-8 xl:space-y-12">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#888] mb-6">Step 2 of 3</p>
          <h2 className="text-[42px] xl:text-[48px] font-light tracking-tight text-[#111] leading-tight mb-4">Select flows to scan</h2>
          <p className="text-[14px] text-[#666] leading-relaxed max-w-2xl">We discovered {flows.length} potential user {flows.length === 1 ? 'flow' : 'flows'} on your website. Select up to 5 to include in your scan.</p>
        </div>

        <div className={cn(
          "border rounded-lg p-4 flex items-center gap-4",
          discoveryError ? "bg-red-50/50 border-red-100" : "bg-emerald-50/50 border-emerald-100"
        )}>
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Check size={16} />
          </div>
          <p className={cn("text-[13px]", discoveryError ? "text-red-700" : "text-emerald-800")}>
            {discoveryError ? (
              <>Firecrawl discovery failed: {discoveryError}</>
            ) : (
              <>Found <span className="font-medium">{pagesDiscovered || 0} pages</span> across <span className="font-medium">{flows.length}</span> flows on {websiteHost}</>
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Discovered Flows</h3>
            <span className="text-[11px] font-medium text-[#111]">{selectedFlows.length} of 5 selected</span>
          </div>

          <div className="space-y-3">
            {!flows.length && (
              <div className="p-5 border border-[#f0f0f0] rounded-xl text-[13px] text-[#666] bg-white">
                <p>No flow-specific pages were returned by Firecrawl.</p>
                {zeroFlowDiagnostic && (
                  <p className="mt-2 text-[12px] text-[#888]">{zeroFlowDiagnostic}</p>
                )}
                {discoveryDebug?.map_error && (
                  <p className="mt-2 text-[12px] text-red-600">{discoveryDebug.map_error}</p>
                )}
                <p className="mt-2 text-[12px] text-[#888]">Go back and try the canonical homepage URL, or check whether the site blocks crawler access to navigation.</p>
              </div>
            )}
            {flows.map((flow: any) => (
              <div 
                key={flow.id}
                onClick={() => toggleFlow(flow.id)}
                className={cn(
                  "group flex items-center gap-4 sm:gap-6 p-4 border rounded-xl transition-all cursor-pointer",
                  selectedFlows.includes(flow.id) 
                    ? "border-[#111] bg-white shadow-sm" 
                    : "border-[#f0f0f0] hover:border-[#ddd] bg-white"
                )}
              >
                <div className={cn(
                  "w-5 h-5 border rounded flex items-center justify-center transition-colors",
                  selectedFlows.includes(flow.id) ? "bg-[#111] border-[#111] text-white" : "border-[#ddd] group-hover:border-[#bbb]"
                )}>
                  {selectedFlows.includes(flow.id) && <Check size={12} />}
                </div>
                
                <div className="w-10 h-10 bg-[#f9f9f9] rounded-lg flex items-center justify-center text-[#111]">
                  <flow.icon size={20} />
                </div>

                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-[#111]">{flow.title}</h4>
                  <p className="text-[11px] text-[#aaa] font-mono mt-0.5">{flow.paths}</p>
                </div>

                <div className={cn(
                  "text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider",
                  flow.risk === 'HIGH RISK' ? "bg-red-50 text-red-600" : 
                  flow.risk === 'MEDIUM RISK' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                )}>
                  {flow.risk}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onBack}
            className="w-full sm:w-auto px-10 py-3.5 border border-[#eee] text-[#888] text-[13px] font-medium rounded-lg hover:border-[#ddd] hover:text-[#111] transition-all flex items-center justify-center gap-3"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button 
            onClick={onNext}
            disabled={!selectedFlows.length}
            className="w-full sm:w-auto px-10 py-3.5 bg-[#111] text-white text-[13px] font-medium rounded-lg hover:bg-[#333] transition-all flex items-center justify-center gap-3"
          >
            Start Scan <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-12 mt-10 lg:mt-0 xl:pl-12 xl:border-l xl:border-[#f0f0f0]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-blue-500" />
            <span className="text-[13px] font-medium text-[#111]">{websiteHost}</span>
          </div>
          <p className="text-[12px] text-[#888] ml-7">{pagesDiscovered || 0} pages discovered</p>
        </div>

        <div className="space-y-2 font-mono text-[11px] text-[#888] leading-relaxed">
          <p className="text-[#111] mb-2">{websiteHost}/</p>
          {treePaths.length ? (
            treePaths.map((path: any, index: number) => (
              <p key={path}>{index === treePaths.length - 1 ? '└──' : '├──'} {path}</p>
            ))
          ) : (
            <p>No Firecrawl page paths returned.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Step3({ websiteUrl, pagesDiscovered, selectedFlows, collectedFlowData, onScan, onComplete, onBack }: any) {
  const [progress, setProgress] = useState(15);
  const [status, setStatus] = useState(`Preparing ${selectedFlows.length} selected ${selectedFlows.length === 1 ? 'flow' : 'flows'} for analysis`);
  const [completed, setCompleted] = useState<string[]>([
    `Firecrawl discovery completed — ${pagesDiscovered || 0} pages found`,
  ]);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const runScan = async () => {
      if (!onScan || !collectedFlowData) {
        setScanError('No Firecrawl results are available to scan.');
        return;
      }

      try {
        setProgress(35);
        setStatus(`Analyzing ${selectedFlows.length} selected ${selectedFlows.length === 1 ? 'flow' : 'flows'} with BERT`);
        setCompleted((items) => [...items, `Selected flows: ${selectedFlows.join(', ')}`]);
        const result = await onScan(collectedFlowData, selectedFlows);
        if (cancelled) return;
        setProgress(85);
        setStatus(`Mapping ${result.findings.length} findings to legal guidance`);
        setCompleted((items) => [...items, `BERT analysis returned ${result.findings.length} findings`]);
        setProgress(100);
        setStatus('Finalizing audit results');
        setTimeout(() => {
          if (!cancelled) onComplete(result);
        }, 500);
      } catch (error) {
        if (!cancelled) {
          setScanError(error instanceof Error ? error.message : 'Scan failed.');
          setStatus('Scan failed');
        }
      }
    };

    runScan();
    return () => {
      cancelled = true;
    };
  }, [collectedFlowData, onComplete, onScan, selectedFlows]);

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-center">
      <div className="mb-12 xl:mb-16">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#888] mb-6">Step 3 of 3</p>
        <h2 className="text-[42px] xl:text-[48px] font-light tracking-tight text-[#111] leading-tight mb-4">Scanning your website</h2>
        <p className="text-[14px] text-[#666] leading-relaxed">Analyzing Firecrawl text from {websiteUrl}</p>
      </div>

      <div className="w-full max-w-md xl:max-w-xl space-y-12 xl:space-y-16">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-[10px] font-medium inline-block py-1 px-2 uppercase rounded-full text-[#111] bg-[#f5f5f5] tracking-wider">
                Progress
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium inline-block text-[#111]">
                {progress}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded bg-[#f5f5f5]">
            <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#111] transition-all duration-300"></div>
          </div>
        </div>

        <div className="space-y-8 text-left">
          <div className="space-y-4">
            <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Currently Scanning</h4>
            <div className="flex items-center gap-3 text-[14px] text-[#111]">
              <Loader2 size={16} className="animate-spin text-[#111]" />
              {status}
            </div>
            {scanError && (
              <div className="mt-4 text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg p-4">
                {scanError}
                <button onClick={onBack} className="ml-4 underline">Back to flows</button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Completed</h4>
            <div className="space-y-3">
              {completed.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-[14px] text-[#111]">
                  <Check size={16} className="text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
