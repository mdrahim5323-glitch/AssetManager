import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetLeads, useCreateLead, useDeleteLead, getGetLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LEAD_STATUSES = ["New", "Contacted", "Interested", "Site Visit", "Negotiation", "Booking", "Sold"];
const SOURCES = ["Direct", "Facebook", "Google", "Referral", "Walk-in", "Website", "Other"];

export default function LeadsPage() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "Direct", status: "New", notes: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetLeads(
    { status: statusFilter || undefined, limit: 100 } as any,
    { query: { queryKey: getGetLeadsQueryKey({ status: statusFilter || undefined } as any) } }
  );

  const createMutation = useCreateLead();
  const deleteMutation = useDeleteLead();

  const filtered = (data?.data ?? []).filter(
    (l: any) => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
  );

  async function handleCreate() {
    if (!form.name || !form.phone) return;
    await createMutation.mutateAsync({ data: form } as any);
    await queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey({} as any) });
    setShowCreate(false);
    setForm({ name: "", phone: "", email: "", source: "Direct", status: "New", notes: "" });
    toast({ title: "Lead created" });
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteMutation.mutateAsync({ id } as any);
    await queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey({} as any) });
    toast({ title: "Lead deleted" });
  }

  const columns = [
    { key: "name", label: "Name", render: (r: any) => <span className="font-medium text-slate-200">{r.name}</span> },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email", render: (r: any) => r.email || <span className="text-slate-600">—</span> },
    { key: "source", label: "Source" },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
    { key: "assigned_user_name", label: "Assigned To", render: (r: any) => r.assigned_user_name || <span className="text-slate-600">—</span> },
    { key: "follow_up_date", label: "Follow-up", render: (r: any) => r.follow_up_date || <span className="text-slate-600">—</span> },
    {
      key: "actions", label: "", render: (r: any) => (
        <button onClick={(e) => handleDelete(r.id, e)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
          <Trash2 size={13} />
        </button>
      )
    },
  ];

  return (
    <AppLayout title="Leads">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="">All statuses</SelectItem>
            {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 ml-auto">
          <Plus size={14} className="mr-1" /> New Lead
        </Button>
      </div>

      <div className="mb-2 text-xs text-slate-500">{filtered.length} leads</div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        keyExtractor={r => r.id}
        onRowClick={r => navigate(`/leads/${r.id}`)}
        emptyMessage="No leads found. Create your first lead."
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
          <DialogHeader>
            <DialogTitle>New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: "Full Name *", key: "name", placeholder: "Mohammad Hossain" },
              { label: "Phone *", key: "phone", placeholder: "+880-1711-..." },
              { label: "Email", key: "email", placeholder: "email@example.com" },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs text-slate-400">{f.label}</Label>
                <Input
                  className="mt-1 bg-slate-800 border-slate-700 text-slate-200"
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Source</Label>
                <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-400">Notes</Label>
              <textarea
                className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                placeholder="Notes..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {createMutation.isPending ? "Creating..." : "Create Lead"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
