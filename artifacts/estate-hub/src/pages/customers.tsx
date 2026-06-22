import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetCustomers, useCreateCustomer, useDeleteCustomer, getGetCustomersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CustomersPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", nid: "", notes: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetCustomers(
    {} as any,
    { query: { queryKey: getGetCustomersQueryKey({} as any) } }
  );

  const createMutation = useCreateCustomer();
  const deleteMutation = useDeleteCustomer();

  const filtered = (data?.data ?? []).filter(
    (c: any) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  async function handleCreate() {
    if (!form.name || !form.phone) return;
    await createMutation.mutateAsync({ data: form } as any);
    await queryClient.invalidateQueries({ queryKey: getGetCustomersQueryKey({} as any) });
    setShowCreate(false);
    setForm({ name: "", phone: "", email: "", address: "", nid: "", notes: "" });
    toast({ title: "Customer created" });
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteMutation.mutateAsync({ id } as any);
    await queryClient.invalidateQueries({ queryKey: getGetCustomersQueryKey({} as any) });
    toast({ title: "Customer deleted" });
  }

  const columns = [
    { key: "name", label: "Name", render: (r: any) => <span className="font-medium text-slate-200">{r.name}</span> },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email", render: (r: any) => r.email || <span className="text-slate-600">—</span> },
    { key: "address", label: "Address", render: (r: any) => r.address ? <span className="truncate max-w-[160px] block">{r.address}</span> : <span className="text-slate-600">—</span> },
    { key: "nid", label: "NID", render: (r: any) => r.nid || <span className="text-slate-600">—</span> },
    { key: "created_at", label: "Added", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
    {
      key: "actions", label: "", render: (r: any) => (
        <button onClick={(e) => handleDelete(r.id, e)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
          <Trash2 size={13} />
        </button>
      )
    },
  ];

  return (
    <AppLayout title="Customers">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
          />
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 ml-auto">
          <Plus size={14} className="mr-1" /> New Customer
        </Button>
      </div>

      <div className="mb-2 text-xs text-slate-500">{filtered.length} customers</div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} keyExtractor={r => r.id}
        onRowClick={r => navigate(`/customers/${r.id}`)} emptyMessage="No customers yet." />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
          <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: "Full Name *", key: "name", placeholder: "Mohammad Hossain" },
              { label: "Phone *", key: "phone", placeholder: "+880-1711-..." },
              { label: "Email", key: "email", placeholder: "email@example.com" },
              { label: "Address", key: "address", placeholder: "House 12, Road 5, Gulshan" },
              { label: "National ID", key: "nid", placeholder: "NID number" },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs text-slate-400">{f.label}</Label>
                <Input className="mt-1 bg-slate-800 border-slate-700 text-slate-200" placeholder={f.placeholder}
                  value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <div>
              <Label className="text-xs text-slate-400">Notes</Label>
              <textarea className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
