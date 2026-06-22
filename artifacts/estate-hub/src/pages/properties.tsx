import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetProperties, useCreateProperty, useDeleteProperty, useGetPropertyStats, getGetPropertiesQueryKey, getGetPropertyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TYPES = ["Flat", "Plot", "Share"];
const STATUSES = ["Available", "Reserved", "Sold"];

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(2)}M`;
  return `৳${n?.toLocaleString()}`;
}

export default function PropertiesPage() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ project_name: "", property_name: "", unit_no: "", location: "", property_type: "Flat", price: "", status: "Available" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetProperties(
    { status: statusFilter || undefined, property_type: typeFilter || undefined } as any,
    { query: { queryKey: getGetPropertiesQueryKey({ status: statusFilter || undefined, property_type: typeFilter || undefined } as any) } }
  );
  const { data: stats } = useGetPropertyStats({ query: { queryKey: getGetPropertyStatsQueryKey() } });

  const createMutation = useCreateProperty();
  const deleteMutation = useDeleteProperty();

  const filtered = (data?.data ?? []).filter(
    (p: any) => !search || p.property_name.toLowerCase().includes(search.toLowerCase()) || p.project_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!form.project_name || !form.property_name || !form.price) return;
    await createMutation.mutateAsync({ data: { ...form, price: Number(form.price) } } as any);
    await queryClient.invalidateQueries({ queryKey: getGetPropertiesQueryKey({} as any) });
    await queryClient.invalidateQueries({ queryKey: getGetPropertyStatsQueryKey() });
    setShowCreate(false);
    setForm({ project_name: "", property_name: "", unit_no: "", location: "", property_type: "Flat", price: "", status: "Available" });
    toast({ title: "Property created" });
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteMutation.mutateAsync({ id } as any);
    await queryClient.invalidateQueries({ queryKey: getGetPropertiesQueryKey({} as any) });
    toast({ title: "Property deleted" });
  }

  const columns = [
    { key: "project_name", label: "Project", render: (r: any) => <span className="text-slate-400">{r.project_name}</span> },
    { key: "property_name", label: "Property", render: (r: any) => <span className="font-medium text-slate-200">{r.property_name}</span> },
    { key: "unit_no", label: "Unit", render: (r: any) => r.unit_no || "—" },
    { key: "location", label: "Location", render: (r: any) => r.location || "—" },
    { key: "property_type", label: "Type" },
    { key: "price", label: "Price", render: (r: any) => <span className="font-medium text-emerald-400">{fmt(r.price)}</span> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
    {
      key: "actions", label: "", render: (r: any) => (
        <button onClick={(e) => handleDelete(r.id, e)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
          <Trash2 size={13} />
        </button>
      )
    },
  ];

  return (
    <AppLayout title="Properties">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Available", value: (stats as any).available, color: "text-emerald-400" },
            { label: "Reserved", value: (stats as any).reserved, color: "text-amber-400" },
            { label: "Sold", value: (stats as any).sold, color: "text-blue-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
              <Building2 size={14} className={s.color} />
              <span className="text-xs text-slate-500">{s.label}</span>
              <span className={`ml-auto text-lg font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="">All types</SelectItem>
            {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 ml-auto">
          <Plus size={14} className="mr-1" /> Add Property
        </Button>
      </div>

      <div className="mb-2 text-xs text-slate-500">{filtered.length} properties</div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} keyExtractor={r => r.id}
        onRowClick={r => navigate(`/properties/${r.id}`)} emptyMessage="No properties found." />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
          <DialogHeader><DialogTitle>Add Property</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: "Project Name *", key: "project_name", placeholder: "Skyline Residency" },
              { label: "Property Name *", key: "property_name", placeholder: "Apartment A1" },
              { label: "Unit No", key: "unit_no", placeholder: "A1-301" },
              { label: "Location", key: "location", placeholder: "Gulshan, Dhaka" },
              { label: "Price (BDT) *", key: "price", placeholder: "8500000" },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs text-slate-400">{f.label}</Label>
                <Input className="mt-1 bg-slate-800 border-slate-700 text-slate-200" placeholder={f.placeholder}
                  type={f.key === "price" ? "number" : "text"} value={(form as any)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Type</Label>
                <Select value={form.property_type} onValueChange={v => setForm({ ...form, property_type: v })}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {createMutation.isPending ? "Adding..." : "Add Property"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
