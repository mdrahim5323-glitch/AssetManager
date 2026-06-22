import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetLeaveRequests, useCreateLeaveRequest, useUpdateLeaveRequest, getGetLeaveRequestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LEAVE_TYPES = ["Annual Leave", "Sick Leave", "Emergency Leave", "Maternity Leave", "Unpaid Leave"];

export default function LeavesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ leave_type: "Annual Leave", start_date: "", end_date: "", reason: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetLeaveRequests(
    { status: statusFilter || undefined } as any,
    { query: { queryKey: getGetLeaveRequestsQueryKey({ status: statusFilter || undefined } as any) } }
  );
  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveRequest();

  const rows = (data as any[]) ?? [];

  async function handleCreate() {
    if (!form.start_date || !form.end_date) return;
    await createMutation.mutateAsync({ data: form } as any);
    await queryClient.invalidateQueries({ queryKey: getGetLeaveRequestsQueryKey({} as any) });
    setShowCreate(false);
    setForm({ leave_type: "Annual Leave", start_date: "", end_date: "", reason: "" });
    toast({ title: "Leave request submitted" });
  }

  async function handleReview(id: number, status: string, e: React.MouseEvent) {
    e.stopPropagation();
    await updateMutation.mutateAsync({ id, data: { status } } as any);
    await queryClient.invalidateQueries({ queryKey: getGetLeaveRequestsQueryKey({} as any) });
    toast({ title: `Leave ${status.toLowerCase()}` });
  }

  const columns = [
    { key: "user_name", label: "Employee", render: (r: any) => <span className="font-medium text-slate-200">{r.user_name || `User #${r.user_id}`}</span> },
    { key: "leave_type", label: "Type" },
    { key: "start_date", label: "From" },
    { key: "end_date", label: "To" },
    { key: "reason", label: "Reason", render: (r: any) => r.reason ? <span className="truncate max-w-[160px] block">{r.reason}</span> : <span className="text-slate-600">—</span> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
    { key: "created_at", label: "Submitted", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
    {
      key: "actions", label: "", render: (r: any) => r.status === "Pending" ? (
        <div className="flex gap-1">
          <button onClick={(e) => handleReview(r.id, "Approved", e)} className="p-1.5 rounded text-emerald-500 hover:bg-emerald-900/30 transition-colors">
            <Check size={13} />
          </button>
          <button onClick={(e) => handleReview(r.id, "Rejected", e)} className="p-1.5 rounded text-red-500 hover:bg-red-900/30 transition-colors">
            <X size={13} />
          </button>
        </div>
      ) : null
    },
  ];

  return (
    <AppLayout title="Leave Management">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-2">
          {["", "Pending", "Approved", "Rejected"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 ml-auto">
          <Plus size={14} className="mr-1" /> Request Leave
        </Button>
      </div>

      <div className="mb-2 text-xs text-slate-500">{rows.length} requests</div>
      <DataTable columns={columns} data={rows} isLoading={isLoading} keyExtractor={r => r.id}
        emptyMessage="No leave requests." />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-slate-400">Leave Type</Label>
              <Select value={form.leave_type} onValueChange={v => setForm({ ...form, leave_type: v })}>
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Start Date *</Label>
                <Input type="date" className="mt-1 bg-slate-800 border-slate-700 text-slate-200"
                  value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-slate-400">End Date *</Label>
                <Input type="date" className="mt-1 bg-slate-800 border-slate-700 text-slate-200"
                  value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-400">Reason</Label>
              <textarea className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {createMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
