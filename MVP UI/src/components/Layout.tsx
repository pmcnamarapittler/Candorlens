import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Settings, 
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  findingsCount?: number;
  userName?: string;
}

export default function Layout({ children, activeTab, setActiveTab, findingsCount = 0, userName = 'Paige McNamara' }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'findings', label: 'Findings', icon: AlertCircle, badge: findingsCount },
    { id: 'remediation', label: 'Remediation', icon: CheckCircle },
    { id: 'report', label: 'Report', icon: FileText },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-[var(--color-brand-bg)] overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[250px] border-r border-[#dbdee1] flex flex-col bg-white transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[20px] font-light tracking-[-0.02em] text-[#111]">
            <div className="w-5 h-5 rounded-full border border-[#111]" />
            <span className="font-medium">candor</span>
            <span>lens</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-[#888]">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 text-[14px] transition-all duration-150 rounded-lg group",
                activeTab === item.id 
                  ? "bg-[#f2f2f2] text-[#27272a]" 
                  : "text-[#888] hover:text-[#27272a] hover:bg-[#fafafa]"
              )}
            >
              <item.icon size={18} className={cn(activeTab === item.id ? "opacity-100" : "opacity-70")} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-[rgba(220,38,38,0.1)] text-[#dc2626] text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-[17px] h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {!item.badge && (
                <ChevronRight size={13} className="ml-auto opacity-30" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#f0f0f0]">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-[11px] font-medium text-white">
              {userName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-medium text-[#27272a] truncate">{userName}</p>
              <p className="text-[11px] text-[#a1a1aa] truncate">Lead Auditor</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] bg-white">
          <div className="flex items-center gap-2 text-[18px] font-light tracking-[-0.02em] text-[#111]">
            <div className="w-4 h-4 rounded-full border border-[#111]" />
            <span className="font-medium">candor</span>
            <span>lens</span>
          </div>
          <button onClick={toggleSidebar} className="p-1 text-[#111]">
            <Menu size={20} />
          </button>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
