import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useGetLeads, useUpdateLead, getGetLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Phone, Calendar, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "New", color: "border-slate-600", dot: "bg-slate-500", header: "bg-slate-800/60" },
  { key: "Contacted", color: "border-blue-800", dot: "bg-blue-500", header: "bg-blue-900/30" },
  { key: "Interested", color: "border-indigo-800", dot: "bg-indigo-500", header: "bg-indigo-900/30" },
  { key: "Site Visit", color: "border-violet-800", dot: "bg-violet-500", header: "bg-violet-900/30" },
  { key: "Negotiation", color: "border-amber-800", dot: "bg-amber-500", header: "bg-amber-900/30" },
  { key: "Booking", color: "border-emerald-800", dot: "bg-emerald-500", header: "bg-emerald-900/30" },
  { key: "Sold", color: "border-green-700", dot: "bg-green-500", header: "bg-green-900/30" },
];

export default function PipelinePage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const dragSourceStage = useRef<string | null>(null);

  const { data, isLoading } = useGetLeads(
    { limit: 200 } as any,
    { query: { queryKey: getGetLeadsQueryKey({ limit: 200 } as any) } }
  );

  const updateMutation = useUpdateLead();

  const leads = (data?.data ?? []) as any[];

  // Group leads by status
  const byStage: Record<string, any[]> = {};
  for (const stage of STAGES) byStage[stage.key] = [];
  for (const lead of leads) {
    if (byStage[lead.status]) byStage[lead.status].push(lead);
    else byStage["New"].push(lead);
  }

  function handleDragStart(e: React.DragEvent, leadId: number, stage: string) {
    setDraggingId(leadId);
    dragSourceStage.current = stage;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("leadId", String(leadId));
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverStage(null);
    dragSourceStage.current = null;
  }

  function handleDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverStage(stage);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the column entirely
    const related = e.relatedTarget as HTMLElement | null;
    if (!related?.closest("[data-stage]")) {
      setOverStage(null);
    }
  }

  async function handleDrop(e: React.DragEvent, targetStage: string) {
    e.preventDefault();
    const leadId = Number(e.dataTransfer.getData("leadId"));
    setOverStage(null);
    setDraggingId(null);

    if (!leadId || dragSourceStage.current === targetStage) return;

    // Optimistic update
    await queryClient.cancelQueries({ queryKey: getGetLeadsQueryKey({ limit: 200 } as any) });
    const prev = queryClient.getQueryData(getGetLeadsQueryKey({ limit: 200 } as any));
    queryClient.setQueryData(getGetLeadsQueryKey({ limit: 200 } as any), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((l: any) => l.id === leadId ? { ...l, status: targetStage } : l),
      };
    });

    try {
      await updateMutation.mutateAsync({ id: leadId, data: { status: targetStage } } as any);
      toast({ title: `Moved to ${targetStage}` });
    } catch {
      queryClient.setQueryData(getGetLeadsQueryKey({ limit: 200 } as any), prev);
      toast({ title: "Failed to update lead", variant: "destructive" });
    }
  }

  return (
    <AppLayout title="Lead Pipeline">
      <div className="flex items-center justify-between mb-5">
        <div className="text-xs text-slate-500">{leads.length} total leads across all stages</div>
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-md px-3 py-1.5 transition-colors"
        >
          <Plus size={12} /> Add Lead
        </button>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-180px)]">
        {STAGES.map((stage) => {
          const stageLeads = byStage[stage.key] ?? [];
          const isOver = overStage === stage.key;

          return (
            <div
              key={stage.key}
              data-stage={stage.key}
              className={cn(
                "flex flex-col rounded-lg border shrink-0 w-60 transition-all duration-150",
                stage.color,
                isOver
                  ? "bg-slate-800/50 scale-[1.01]"
                  : "bg-slate-900/40"
              )}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              {/* Column header */}
              <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-lg", stage.header)}>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", stage.dot)} />
                  <span className="text-xs font-semibold text-slate-200">{stage.key}</span>
                </div>
                <span className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  stageLeads.length > 0 ? "bg-slate-700 text-slate-200" : "bg-slate-800 text-slate-600"
                )}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Drop zone */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-20 bg-slate-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : stageLeads.length === 0 ? (
                  <div className={cn(
                    "h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-xs transition-colors",
                    isOver
                      ? "border-slate-500 text-slate-400 bg-slate-800/40"
                      : "border-slate-800 text-slate-700"
                  )}>
                    {isOver ? "Drop here" : "Empty"}
                  </div>
                ) : (
                  <>
                    {stageLeads.map((lead: any) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        isDragging={draggingId === lead.id}
                        onDragStart={(e) => handleDragStart(e, lead.id, stage.key)}
                        onDragEnd={handleDragEnd}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                      />
                    ))}

                    {isOver && draggingId !== null && !stageLeads.find(l => l.id === draggingId) && (
                      <div className="h-12 rounded-lg border-2 border-dashed border-slate-500 bg-slate-800/40 flex items-center justify-center text-xs text-slate-400">
                        Drop here
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}

interface LeadCardProps {
  lead: any;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

function LeadCard({ lead, isDragging, onDragStart, onDragEnd, onClick }: LeadCardProps) {
  const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date();
  const today = new Date().toISOString().slice(0, 10);
  const isToday = lead.follow_up_date === today;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-grab active:cursor-grabbing select-none",
        "hover:border-slate-600 hover:bg-slate-800/80 transition-all duration-100",
        isDragging && "opacity-40 scale-95 rotate-1"
      )}
    >
      {/* Name */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <span className="text-sm font-semibold text-slate-100 leading-tight">{lead.name}</span>
        {lead.source && (
          <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded shrink-0">{lead.source}</span>
        )}
      </div>

      {/* Phone */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        <Phone size={10} className="shrink-0" />
        <span className="truncate">{lead.phone}</span>
      </div>

      {/* Assigned */}
      {lead.assigned_user_name && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <User size={10} className="shrink-0" />
          <span className="truncate">{lead.assigned_user_name}</span>
        </div>
      )}

      {/* Follow-up */}
      {lead.follow_up_date && (
        <div className={cn(
          "flex items-center gap-1.5 text-xs mt-2 pt-2 border-t border-slate-700/60",
          isOverdue ? "text-red-400" : isToday ? "text-amber-400" : "text-slate-500"
        )}>
          <Calendar size={10} className="shrink-0" />
          <span>
            {isToday ? "Today" : isOverdue ? `Overdue · ${lead.follow_up_date}` : lead.follow_up_date}
          </span>
        </div>
      )}

      {/* Notes preview */}
      {lead.notes && (
        <p className="text-xs text-slate-600 mt-1.5 truncate">{lead.notes}</p>
      )}
    </div>
  );
}
