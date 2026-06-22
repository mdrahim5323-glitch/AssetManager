import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLead, useUpdateLead, getGetLeadsQueryKey, getGetLeadQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const LEAD_STATUSES = ["New", "Contacted", "Interested", "Site Visit", "Negotiation", "Booking", "Sold"];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const numId = Number(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: lead, isLoading } = useGetLead(numId, {
    query: { enabled: !!numId, queryKey: getGetLeadQueryKey(numId) },
  });

  const updateMutation = useUpdateLead();
  const [status, setStatus] = useState<string>("");

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    await updateMutation.mutateAsync({ id: numId, data: { status: newStatus } } as any);
    await queryClient.invalidateQueries({ queryKey: getGetLeadQueryKey(numId) });
    await queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey({} as any) });
    toast({ title: "Status updated" });
  }

  if (isLoading) {
    return (
      <AppLayout title="Lead Detail">
        <Skeleton className="h-48 bg-slate-800" />
      </AppLayout>
    );
  }

  if (!lead) {
    return <AppLayout title="Lead Detail"><p className="text-slate-500">Lead not found.</p></AppLayout>;
  }

  const currentStatus = status || (lead as any).status;

  return (
    <AppLayout title={`Lead — ${(lead as any).name}`}>
      <button onClick={() => navigate("/leads")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-5">
        <ChevronLeft size={14} /> Back to Leads
      </button>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Contact Info</h3>
          <div className="space-y-3">
            {[
              { label: "Name", value: (lead as any).name },
              { label: "Phone", value: (lead as any).phone },
              { label: "Email", value: (lead as any).email || "—" },
              { label: "Source", value: (lead as any).source },
              { label: "Assigned To", value: (lead as any).assigned_user_name || "Unassigned" },
              { label: "Follow-up Date", value: (lead as any).follow_up_date || "—" },
              { label: "Created", value: new Date((lead as any).created_at).toLocaleString() },
            ].map(f => (
              <div key={f.label} className="flex justify-between">
                <span className="text-xs text-slate-500">{f.label}</span>
                <span className="text-sm text-slate-300 font-medium">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Pipeline Stage</h3>
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={currentStatus} />
            </div>
            <Select value={currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Notes</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {(lead as any).notes || <span className="text-slate-600">No notes recorded.</span>}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-1 text-center">
                <div className="text-xs text-slate-500">Status</div>
                <StatusBadge status={currentStatus} className="mt-1" />
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-slate-500">Source</div>
                <div className="text-sm text-slate-300 mt-1">{(lead as any).source}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
