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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OnboardingFlowProps {
  onComplete: (data: any) => void;
  onDiscoverFlows?: (websiteUrl: string) => Promise<{
    discoveredFlows: Array<{ id: string; title: string; path: string; risk_hint: string }>;
    pagesDiscovered: number;
  }>;
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

export default function OnboardingFlow({ onComplete, onDiscoverFlows }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    websiteUrl: '',
    workEmail: ''
  });

  const [selectedFlows, setSelectedFlows] = useState<string[]>(['checkout', 'pricing', 'cancellation']);
  const [discoveredFlows, setDiscoveredFlows] = useState<Array<{ id: string; title: string; path: string; risk_hint: string }>>([]);
  const [pagesDiscovered, setPagesDiscovered] = useState(0);

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
              setDiscoveredFlows(result.discoveredFlows || []);
              setPagesDiscovered(result.pagesDiscovered || 0);
              const suggested = (result.discoveredFlows || []).slice(0, 5).map((flow) => flow.id);
              if (suggested.length) {
                setSelectedFlows(suggested);
              }
            }}
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
            pagesDiscovered={pagesDiscovered}
            onNext={handleNext} 
            onBack={() => setStep(1)} 
          />
        );
      case 3:
        return (
          <Step3 onComplete={() => onComplete(formData)} />
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
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Last Name</label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  placeholder="Smith"
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Company Name</label>
              <input 
                type="text" 
                value={formData.companyName}
                placeholder="Acme SaaS, Inc."
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Website URL</label>
              <input 
                type="text" 
                value={formData.websiteUrl}
                placeholder="https://example.com"
                onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
              />
              <p className="text-[10px] text-[#aaa]">We'll analyze your checkout, pricing, and cancellation flows</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Work Email</label>
              <input 
                type="email" 
                value={formData.workEmail}
                placeholder="jane@company.com"
                onChange={e => setFormData({...formData, workEmail: e.target.value})}
                className="w-full border-b border-[#eee] py-2 text-[16px] text-[#111] focus:outline-none focus:border-[#111] transition-colors"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={onNext}
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

function FlowDiscoveryLoading({ websiteUrl, onDiscoverFlows, onDiscovered, onComplete }: any) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing crawler...');

  useEffect(() => {
    let cancelled = false;
    const runDiscovery = async () => {
      if (!onDiscoverFlows || !websiteUrl) return;
      try {
        const result = await onDiscoverFlows(websiteUrl);
        if (!cancelled && onDiscovered) {
          onDiscovered(result);
        }
      } catch {
        // Keep UX moving with fallback defaults if discovery fails.
      }
    };
    runDiscovery();

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return 100;
        }
        return p + 4;
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
    }, 600);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [onComplete, onDiscoverFlows, onDiscovered, websiteUrl]);

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-center">
      <div className="mb-12">
        <div className="w-16 h-16 bg-[#fcfcfc] border border-[#f0f0f0] rounded-full flex items-center justify-center mx-auto mb-8">
          <Loader2 size={32} className="animate-spin text-[#111]" />
        </div>
        <h2 className="text-[24px] sm:text-[32px] font-light tracking-tight text-[#111] leading-tight">Discovering your website flows</h2>
        <p className="text-[14px] text-[#666] mt-4">We're mapping out your checkout, pricing, and cancellation paths</p>
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

function Step2({ selectedFlows, setSelectedFlows, websiteUrl, discoveredFlows, pagesDiscovered, onNext, onBack }: any) {
  const normalizedWebsite = (websiteUrl || '').trim();
  const websiteHost = normalizedWebsite
    ? normalizedWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : 'your-site.com';
  const fallbackFlows = [
    { id: 'checkout', title: 'Checkout Flow', paths: '/checkout, /cart, /payment, /confirmation', risk: 'HIGH RISK', icon: ShoppingCart },
    { id: 'pricing', title: 'Pricing & Plans', paths: '/pricing, /plans, /compare', risk: 'HIGH RISK', icon: CreditCard },
    { id: 'cancellation', title: 'Cancellation Flow', paths: '/account/cancel, /downgrade', risk: 'HIGH RISK', icon: XCircle },
    { id: 'signup', title: 'Signup & Trial', paths: '/signup, /register, /trial', risk: 'MEDIUM RISK', icon: Key },
    { id: 'settings', title: 'Account Settings', paths: '/account, /settings, /billing', risk: 'MEDIUM RISK', icon: Settings },
    { id: 'email', title: 'Email Preferences', paths: '/unsubscribe, /preferences', risk: 'LOW RISK', icon: Mail },
  ];
  const flows = (discoveredFlows && discoveredFlows.length)
    ? discoveredFlows.map((f: any) => ({
        id: f.id,
        title: f.title,
        paths: f.path,
        risk: `${(f.risk_hint || 'MEDIUM').toUpperCase()} RISK`,
        icon: Globe,
      }))
    : fallbackFlows;

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
          <p className="text-[14px] text-[#666] leading-relaxed max-w-2xl">We discovered 8 potential user flows on your website. Select up to 5 to include in your free scan.</p>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Check size={16} />
          </div>
          <p className="text-[13px] text-emerald-800">
            Found <span className="font-medium">{pagesDiscovered || 0} pages</span> across <span className="font-medium">{flows.length}</span> flows on {websiteHost}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-[10px] font-medium text-[#888] uppercase tracking-[0.1em]">Discovered Flows</h3>
            <span className="text-[11px] font-medium text-[#111]">{selectedFlows.length} of 5 selected</span>
          </div>

          <div className="space-y-3">
            {flows.map(flow => (
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
          <p>├── /checkout</p>
          <p>│   ├── /cart</p>
          <p>│   ├── /payment</p>
          <p>│   └── /confirmation</p>
          <p>├── /pricing</p>
          <p>│   ├── /plans</p>
          <p>│   └── /compare</p>
          <p>├── /account</p>
          <p>│   ├── /settings</p>
          <p>│   ├── /billing</p>
          <p>│   └── /cancel</p>
          <p>├── /signup</p>
          <p>│   ├── /register</p>
          <p>│   └── /trial</p>
          <p>├── /features</p>
          <p>├── /about</p>
          <p>├── /blog</p>
          <p>└── /contact</p>
        </div>
      </div>
    </div>
  );
}

function Step3({ onComplete }: any) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Sitemap discovery — 47 pages found');
  const [completed, setCompleted] = useState<string[]>(['Sitemap discovery — 47 pages found']);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return p + 2;
      });
    }, 100);

    const statusTimer = setInterval(() => {
      const statuses = [
        'Analyzing 3 of 5 flows...',
        'Extracting text elements from /checkout/payment',
        'Scanning /pricing for false urgency patterns',
        'Checking ROSCA compliance on /account/cancel',
        'Finalizing audit report...'
      ];
      
      setStatus(prev => {
        const nextIndex = statuses.indexOf(prev) + 1;
        if (nextIndex < statuses.length) {
          if (!completed.includes(prev)) {
            setCompleted(c => [...c, prev]);
          }
          return statuses[nextIndex];
        }
        return prev;
      });
    }, 1500);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [onComplete, completed]);

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-center">
      <div className="mb-12 xl:mb-16">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#888] mb-6">Step 3 of 3</p>
        <h2 className="text-[42px] xl:text-[48px] font-light tracking-tight text-[#111] leading-tight mb-4">Scanning your website</h2>
        <p className="text-[14px] text-[#666] leading-relaxed">This usually takes 2-3 minutes</p>
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
