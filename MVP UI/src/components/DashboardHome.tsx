import React, { useState } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  FileDown,
  MoreVertical,
  ShieldAlert,
  FileText,
  Search,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Audit, Finding } from '../types';
import { scannerService } from '../services/scannerService';

const MOCK_AUDITS: Audit[] = [
  { id: '1', url: '/checkout', status: 'completed', score: 42, violations: 12, date: 'Mar 03, 2024', type: 'Checkout' },
  { id: '2', url: '/signup', status: 'completed', score: 88, violations: 2, date: 'Mar 01, 2024', type: 'Signup' },
  { id: '3', url: '/pricing', status: 'completed', score: 76, violations: 4, date: 'Feb 28, 2024', type: 'Pricing' },
  { id: '4', url: '/cancel', status: 'completed', score: 15, violations: 24, date: 'Feb 25, 2024', type: 'Cancellation' },
  { id: '5', url: '/account/billing', status: 'completed', score: 65, violations: 8, date: 'Feb 20, 2024', type: 'Billing' },
];

const CHART_DATA = [
  { name: 'Feb 20', score: 65 },
  { name: 'Feb 22', score: 58 },
  { name: 'Feb 24', score: 72 },
  { name: 'Feb 26', score: 45 },
  { name: 'Feb 28', score: 88 },
  { name: 'Mar 01', score: 42 },
  { name: 'Mar 03', score: 55 },
];

export default function DashboardHome({ 
  onViewAudit, 
  onScanComplete,
  onboardingData
}: { 
  onViewAudit: (id: string) => void,
  onScanComplete: (findings: Finding[]) => void,
  onboardingData?: any
}) {
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    if (!urlInput) return;
    
    setIsScanning(true);
    try {
      const results = await scannerService.scanUrl(urlInput);
      onScanComplete(results);
      setUrlInput('');
    } catch (error) {
      console.error("Scan failed:", error);
      alert("Scan failed. Please check the console for details.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start gap-6 py-6 sm:py-9 px-6 sm:px-10 border-b border-[#f0f0f0] bg-white">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-light text-[#111] tracking-[-0.3px]">
            {onboardingData?.companyName || 'candor.ai'} Overview
          </h1>
          <p className="text-[11px] text-[#bbb] mt-1">Site-wide Compliance Status · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-[#f5f5f5] text-[#555] text-[11px] font-medium rounded-md hover:bg-[#eee] transition-all whitespace-nowrap">
            Download Report
          </button>
          <button 
            onClick={() => {
              setUrlInput('https://candor.ai/checkout');
              handleScan();
            }}
            disabled={isScanning}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-[#111] text-white text-[11px] font-medium rounded-md hover:bg-[#333] transition-all whitespace-nowrap disabled:opacity-50"
          >
            {isScanning ? 'Scanning...' : 'Re-Audit Site'}
          </button>
        </div>
      </header>

      <div className="p-6 sm:p-10 space-y-8 sm:space-y-12">
        {/* Executive Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="serif-display mb-2">Site Compliance Health</h2>
            <p className="text-sm text-[var(--color-brand-muted)] max-w-xl">
              Monitoring <strong>{onboardingData?.websiteUrl || 'candor.ai'}</strong> for deceptive patterns and regulatory risk. Our BERT classifier continuously scans your checkout, signup, and cancellation flows.
            </p>
          </div>
        </section>

      {/* Audit Launcher */}
      <section className="bg-white p-1 border border-[var(--color-brand-line)] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={14} />
          <input 
            type="text" 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter a specific page path to scan..."
            className="w-full bg-transparent border-none py-3 sm:py-4 pl-11 pr-4 text-sm focus:outline-none"
          />
        </div>
        <button 
          onClick={handleScan}
          disabled={isScanning || !urlInput}
          className={cn(
            "bg-[var(--color-brand-primary)] text-white px-6 sm:px-8 py-3 sm:py-4 font-medium text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors whitespace-nowrap flex items-center gap-2",
            (isScanning || !urlInput) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isScanning ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Scanning...
            </>
          ) : (
            'Scan Page'
          )}
        </button>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-brand-line)] border border-[var(--color-brand-line)] overflow-hidden">
        {[
          { label: 'Site Health Score', value: '54.2', sub: 'Critical Risk', icon: ShieldAlert, color: 'text-red-500' },
          { label: 'Total Violations', value: '42', sub: 'Across 5 Pages', icon: AlertTriangle, color: 'text-orange-500' },
          { label: 'Remediation Rate', value: '68%', sub: '+5% this week', icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Pages Monitored', value: '12', sub: 'Active Scans', icon: Clock, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 sm:p-8">
            <p className="col-header mb-4 sm:mb-6">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl sm:text-4xl font-light tracking-tight">{stat.value}</h3>
              <span className={cn("text-[9px] sm:text-[10px] font-medium uppercase", stat.color)}>{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-widest">Compliance Trend</h3>
            <span className="text-[10px] font-mono text-[var(--color-brand-muted)]">Last 30 Days</span>
          </div>
          <div className="h-[340px] w-full bg-white p-6 border border-[var(--color-brand-line)]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#6B7280'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#6B7280'}} 
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0A0A0A', 
                    border: 'none', 
                    borderRadius: '0px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10B981" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-medium uppercase tracking-widest">Risk Distribution</h3>
          <div className="bg-white p-8 border border-[var(--color-brand-line)] space-y-8">
            {[
              { label: 'Forced Continuity', value: 45, color: 'bg-red-500' },
              { label: 'False Urgency', value: 32, color: 'bg-orange-500' },
              { label: 'Fear-Based Threats', value: 23, color: 'bg-blue-500' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-[11px] font-medium mb-3 uppercase tracking-tight">
                  <span>{item.label}</span>
                  <span className="font-mono">{item.value}%</span>
                </div>
                <div className="h-1 w-full bg-neutral-100 overflow-hidden">
                  <div className={cn("h-full", item.color)} style={{ width: `${item.value}%` }}></div>
                </div>
              </div>
            ))}
            
            <div className="pt-6 border-t border-[var(--color-brand-line)]">
              <div className="flex items-start gap-3 p-4 bg-red-50/50 border border-red-100">
                <AlertTriangle size={14} className="text-red-500 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-red-900">
                  <strong>Critical Alert:</strong> Forced Continuity patterns have increased by 12% this week. Immediate remediation required for checkout flows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-widest">Page-Level Compliance</h3>
          <button className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-brand-muted)] hover:text-[var(--color-brand-primary)] transition-colors">
            View All Pages
          </button>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block bg-white border border-[var(--color-brand-line)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-brand-line)]">
                <th className="p-6 col-header">Page Path</th>
                <th className="p-6 col-header">Scan Type</th>
                <th className="p-6 col-header">Risk Level</th>
                <th className="p-6 col-header">Score</th>
                <th className="p-6 col-header">Violations</th>
                <th className="p-6 col-header">Last Scan</th>
                <th className="p-6 col-header text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDITS.map((audit) => (
                <tr 
                  key={audit.id} 
                  className="data-row group"
                  onClick={() => onViewAudit(audit.id)}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium truncate max-w-[200px]">{audit.url}</span>
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-[9px] font-medium uppercase tracking-widest text-[var(--color-brand-muted)]">
                      {audit.type}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        audit.score > 70 ? 'bg-emerald-500' : audit.score > 40 ? 'bg-orange-500' : 'bg-red-500'
                      )}></div>
                      <span className="text-[10px] font-medium uppercase">
                        {audit.score > 70 ? 'Low' : audit.score > 40 ? 'Medium' : 'High'}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="data-value font-medium">{audit.score || '--'}</span>
                  </td>
                  <td className="p-6">
                    <span className={cn("data-value font-medium", audit.violations > 0 ? 'text-red-500' : 'text-emerald-600')}>
                      {audit.violations}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="data-value text-[var(--color-brand-muted)]">{audit.date}</span>
                  </td>
                  <td className="p-6 text-right">
                    <button className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-primary)] transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {MOCK_AUDITS.map((audit) => (
            <div 
              key={audit.id} 
              onClick={() => onViewAudit(audit.id)}
              className="bg-white p-5 border border-[var(--color-brand-line)] space-y-4 active:bg-neutral-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[13px] font-medium text-[#111]">{audit.url}</h4>
                  <p className="text-[10px] text-[var(--color-brand-muted)] uppercase tracking-widest mt-0.5">{audit.type}</p>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-medium uppercase",
                  audit.score > 70 ? 'bg-emerald-50 text-emerald-600' : audit.score > 40 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                )}>
                  {audit.score > 70 ? 'Low Risk' : audit.score > 40 ? 'Medium Risk' : 'High Risk'}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--color-brand-line)]">
                <div>
                  <p className="text-[9px] text-[var(--color-brand-muted)] uppercase tracking-widest mb-1">Score</p>
                  <p className="text-sm font-medium">{audit.score || '--'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--color-brand-muted)] uppercase tracking-widest mb-1">Violations</p>
                  <p className={cn("text-sm font-medium", audit.violations > 0 ? 'text-red-500' : 'text-emerald-600')}>
                    {audit.violations}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--color-brand-muted)] uppercase tracking-widest mb-1">Last Scan</p>
                  <p className="text-sm text-[var(--color-brand-muted)]">{audit.date.split(',')[0]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
  );
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
