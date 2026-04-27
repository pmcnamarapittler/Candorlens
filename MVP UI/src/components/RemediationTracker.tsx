import React, { useState, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Finding } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RemediationTrackerProps {
  findings: Finding[];
  onStatusChange: (id: string, status: Finding['status']) => void;
  onSelectFinding: (finding: Finding) => void;
  onRequestVerificationScan: () => void;
  isVerificationScanRunning?: boolean;
  verificationStatusMessage?: string | null;
}

type ColumnId = 'Open' | 'In Progress' | 'Completed';

interface KanbanColumnProps {
  id: ColumnId;
  title: string;
  count: number;
  children: React.ReactNode;
  color: string;
}

const KanbanColumn = ({ id, title, count, children, color }: KanbanColumnProps) => {
  const { setNodeRef } = useSortable({
    id,
    data: {
      type: 'Column',
      columnId: id,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className="flex-1 min-w-[320px] bg-[#f9f9f9]/50 rounded-xl border border-[#f0f0f0] flex flex-col h-full min-h-[500px]"
    >
      <div className="p-4 border-b border-[#f0f0f0] flex items-center justify-between bg-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", color)} />
          <h3 className="text-[13px] font-medium text-[#111]">{title}</h3>
        </div>
        <span className="text-[11px] font-medium text-[#888] bg-[#f5f5f5] px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {children}
        {count === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-[#f0f0f0]">
              <CheckCircle2 className="text-[#ddd]" size={24} />
            </div>
            <p className="text-[12px] font-medium text-[#888]">No issues {title.toLowerCase()} yet</p>
            <p className="text-[10px] text-[#aaa] mt-1">Drag cards here when complete</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SortableFindingCardProps {
  finding: Finding;
  onSelect: (finding: Finding) => void;
  key?: string | number;
}

const SortableFindingCard = ({ finding, onSelect }: SortableFindingCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: finding.id,
    data: {
      type: 'Finding',
      finding,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(finding)}
      className={cn(
        "group bg-white border border-[#eee] rounded-lg p-4 shadow-sm hover:shadow-md hover:border-[#ddd] transition-all cursor-grab active:cursor-grabbing",
        isDragging && "shadow-xl border-emerald-500/30 ring-2 ring-emerald-500/10"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className={cn(
            "text-[8px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider",
            finding.severity === 'HIGH' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
          )}>
            {finding.severity}
          </span>
          <span className="text-[8px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
            {finding.regulation}
          </span>
        </div>
        <button className="text-[#ccc] hover:text-[#888] transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </div>
      
      <h4 className="text-[13px] font-medium text-[#111] leading-tight mb-3 group-hover:text-emerald-600 transition-colors">
        {finding.title}
      </h4>
      
      <div className="flex items-center justify-between pt-3 border-t border-[#f5f5f5]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-[#888]">
            <span className="font-mono">{finding.page}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#aaa]">
            <span className="font-mono uppercase">{finding.code}</span>
          </div>
        </div>
        <div className="w-5 h-5 rounded-full bg-[#f9f9f9] flex items-center justify-center text-[#ccc] group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
          <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
};

export default function RemediationTracker({
  findings,
  onStatusChange,
  onSelectFinding,
  onRequestVerificationScan,
  isVerificationScanRunning = false,
  verificationStatusMessage = null,
}: RemediationTrackerProps) {
  const [view, setView] = useState<'board' | 'list'>('board');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | Finding['severity']>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | Finding['status']>('All');
  const [flowFilter, setFlowFilter] = useState('All Flows');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const availableFlows = useMemo(
    () => ['All Flows', ...Array.from(new Set(findings.map((finding) => finding.flow).filter(Boolean))).sort()],
    [findings],
  );

  const filteredFindings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return findings.filter((finding) => {
      if (severityFilter !== 'All' && finding.severity !== severityFilter) return false;
      if (statusFilter !== 'All' && finding.status !== statusFilter) return false;
      if (flowFilter !== 'All Flows' && finding.flow !== flowFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        finding.title,
        finding.description,
        finding.code,
        finding.page,
        finding.flow,
        finding.regulation,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [findings, flowFilter, searchQuery, severityFilter, statusFilter]);

  const columns = useMemo(() => {
    const grouped = {
      'Open': filteredFindings.filter(f => f.status === 'Open'),
      'In Progress': filteredFindings.filter(f => f.status === 'In Progress'),
      'Completed': filteredFindings.filter(f => f.status === 'Completed'),
    };
    return grouped;
  }, [filteredFindings]);

  const stats = useMemo(() => {
    const total = findings.length;
    const completed = findings.filter(f => f.status === 'Completed').length;
    const inProgress = findings.filter(f => f.status === 'In Progress').length;
    const open = findings.filter(f => f.status === 'Open').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, inProgress, open, percentage };
  }, [findings]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const finding = findings.find(f => f.id === active.id);
    if (finding) setActiveFinding(finding);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveAFinding = active.data.current?.type === 'Finding';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (isActiveAFinding && isOverAColumn) {
      const newStatus = overId as Finding['status'];
      const finding = findings.find(f => f.id === activeId);
      if (finding && finding.status !== newStatus) {
        onStatusChange(activeId, newStatus);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveFinding(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isActiveAFinding = active.data.current?.type === 'Finding';
    const isOverAFinding = over.data.current?.type === 'Finding';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (isActiveAFinding && isOverAFinding) {
      const overFinding = findings.find(f => f.id === overId);
      if (overFinding) {
        onStatusChange(activeId, overFinding.status);
      }
    }

    if (isActiveAFinding && isOverAColumn) {
      onStatusChange(activeId, overId as Finding['status']);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-light tracking-tight text-[#111]">Remediation Tracker</h1>
          <p className="text-[13px] text-[#888] mt-1">Track progress on fixing compliance violations</p>
        </div>
        <button
          onClick={onRequestVerificationScan}
          disabled={isVerificationScanRunning}
          className="px-5 py-2.5 bg-[#111] text-white text-[12px] font-medium rounded-lg hover:bg-[#222] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isVerificationScanRunning ? 'Running Verification...' : 'Request Verification Scan'}
        </button>
      </div>
      {verificationStatusMessage && (
        <div className="mb-4 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-[12px] text-[#4b5563]">
          {verificationStatusMessage}
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-white border border-[#f0f0f0] rounded-2xl p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-12">
          {/* Progress Circle */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="#f5f5f5"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeDasharray={276}
                strokeDashoffset={276 - (276 * stats.percentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[20px] font-medium text-[#111]">{stats.percentage}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            <div className="text-center">
              <div className="text-[24px] font-medium text-[#111]">{stats.open}</div>
              <div className="text-[10px] font-medium text-red-500 uppercase tracking-widest mt-1">Open</div>
            </div>
            <div className="text-center">
              <div className="text-[24px] font-medium text-[#111]">{stats.inProgress}</div>
              <div className="text-[10px] font-medium text-amber-500 uppercase tracking-widest mt-1">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-[24px] font-medium text-[#111]">{stats.completed}</div>
              <div className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest mt-1">Fixed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md ml-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[12px] font-medium text-[#888]">{stats.completed} of {stats.total} issues resolved</span>
            </div>
            <div className="h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center bg-[#f5f5f5] p-1 rounded-lg">
          <button 
            onClick={() => setView('board')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-[11px] font-medium rounded-md transition-all",
              view === 'board' ? "bg-white text-[#111] shadow-sm" : "text-[#888] hover:text-[#555]"
            )}
          >
            <LayoutGrid size={14} />
            Board
          </button>
          <button 
            onClick={() => setView('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-[11px] font-medium rounded-md transition-all",
              view === 'list' ? "bg-white text-[#111] shadow-sm" : "text-[#888] hover:text-[#555]"
            )}
          >
            <List size={14} />
            List
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" size={14} />
            <input 
              type="text" 
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#eee] rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#888]" />
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as 'All' | Finding['severity'])}
              className="px-2 py-2 bg-white border border-[#eee] rounded-lg text-[12px] text-[#555] focus:outline-none"
            >
              <option value="All">All severities</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'All' | Finding['status'])}
              className="px-2 py-2 bg-white border border-[#eee] rounded-lg text-[12px] text-[#555] focus:outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Fixed</option>
            </select>
            <select
              value={flowFilter}
              onChange={(event) => setFlowFilter(event.target.value)}
              className="px-2 py-2 bg-white border border-[#eee] rounded-lg text-[12px] text-[#555] focus:outline-none"
            >
              {availableFlows.map((flow) => (
                <option key={flow} value={flow}>
                  {flow}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="mb-4 text-[11px] text-[#888]">
        Showing {filteredFindings.length} of {findings.length} issues after filters.
      </div>

      {/* Kanban Board */}
      {view === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
            <KanbanColumn 
              id="Open" 
              title="Open" 
              count={columns['Open'].length}
              color="bg-red-500"
            >
              <SortableContext items={columns['Open'].map(f => f.id)} strategy={verticalListSortingStrategy}>
                {columns['Open'].map(finding => (
                  <SortableFindingCard 
                    key={finding.id} 
                    finding={finding} 
                    onSelect={onSelectFinding}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>

            <KanbanColumn 
              id="In Progress" 
              title="In Progress" 
              count={columns['In Progress'].length}
              color="bg-amber-500"
            >
              <SortableContext items={columns['In Progress'].map(f => f.id)} strategy={verticalListSortingStrategy}>
                {columns['In Progress'].map(finding => (
                  <SortableFindingCard 
                    key={finding.id} 
                    finding={finding} 
                    onSelect={onSelectFinding}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>

            <KanbanColumn 
              id="Completed" 
              title="Fixed" 
              count={columns['Completed'].length}
              color="bg-emerald-500"
            >
              <SortableContext items={columns['Completed'].map(f => f.id)} strategy={verticalListSortingStrategy}>
                {columns['Completed'].map(finding => (
                  <SortableFindingCard 
                    key={finding.id} 
                    finding={finding} 
                    onSelect={onSelectFinding}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeFinding ? (
              <div className="bg-white border-2 border-emerald-500 rounded-lg p-4 shadow-2xl w-[300px] rotate-2 cursor-grabbing">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn(
                      "text-[8px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider",
                      activeFinding.severity === 'HIGH' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {activeFinding.severity}
                    </span>
                    <span className="text-[8px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {activeFinding.regulation}
                    </span>
                  </div>
                </div>
                <h4 className="text-[13px] font-medium text-[#111] leading-tight mb-3">
                  {activeFinding.title}
                </h4>
                <div className="flex items-center justify-between pt-3 border-t border-[#f5f5f5]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] text-[#888]">
                      <span className="font-mono">{activeFinding.page}</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-[#ccc]" />
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="bg-white border border-[#f0f0f0] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9f9f9] border-b border-[#f0f0f0]">
                <th className="px-6 py-4 text-[11px] font-medium text-[#888] uppercase tracking-wider">Issue</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#888] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#888] uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#888] uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#888] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {filteredFindings.map(finding => (
                <tr 
                  key={finding.id} 
                  className="hover:bg-[#fcfcfc] transition-colors cursor-pointer group"
                  onClick={() => onSelectFinding(finding)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-[#111] group-hover:text-emerald-600 transition-colors">{finding.title}</span>
                      <span className="text-[10px] text-[#aaa] mt-0.5">{finding.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        finding.status === 'Open' ? "bg-red-500" : 
                        finding.status === 'In Progress' ? "bg-amber-500" : "bg-emerald-500"
                      )} />
                      <span className="text-[12px] text-[#555]">{finding.status === 'Completed' ? 'Fixed' : finding.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider",
                      finding.severity === 'HIGH' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {finding.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-mono text-[#888]">{finding.page}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#ccc] group-hover:text-emerald-600 transition-colors">
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
