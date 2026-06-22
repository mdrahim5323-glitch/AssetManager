import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetPayments, useCreatePayment, getGetPaymentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(2)}M`;
  return `৳${n?.toLocaleString()}`;
}

export default function PaymentsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customer_id: "", property_id: "", total_amount: "", paid_amount: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetPayments({} as any, { query: { queryKey: getGetPaymentsQueryKey({} as any) } });
  const createMutation = useCreatePayment();

  async function handleCreate() {
    if (!form.customer_id || !form.property_id || !form.total_amount) return;
    await createMutation.mutateAsync({
      data: { customer_id: Number(form.customer_id), property_id: Number(form.property_id), total_amount: Number(form.total_amount), paid_amount: Number(form.paid_amount || 0) }
    } as any);
    await queryClient.invalidateQueries({ queryKey: getGetPaymentsQueryKey({} as any) });
    setShowCreate(false);
    setForm({ customer_id: "", property_id: "", total_amount: "", paid_amount: "" });
    toast({ title: "Payment record created" });
  }

  const rows = (data as any[]) ?? [];

  const columns = [
    { key: "customer_name", label: "Customer", render: (r: any) => <span className="font-medium text-slate-200">{r.customer_name || `Customer #${r.customer_id}`}</span> },
    { key: "property_name", label: "Property", render: (r: any) => r.property_name || `Property #${r.property_id}` },
    { key: "total_amount", label: "Total", render: (r: any) => <span className="font-medium">{fmt(r.total_amount)}</span> },
    { key: "paid_amount", label: "Paid", render: (r: any) => <span className="text-emerald-400">{fmt(r.paid_amount)}</span> },
    { key: "due_amount", label: "Due", render: (r: any) => <span className={r.due_amount > 0 ? "text-amber-400" : "text-slate-500"}>{fmt(r.due_amount)}</span> },
    {
      key: "progress", label: "Progress", render: (r: any) => {
        const pct = r.total_amount ? Math.round((r.paid_amount / r.total_amount) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-24">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-500">{pct}%</span>
          </div>
        );
      }
    },
    { key: "created_at", label: "Date", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <AppLayout title="Payments">
      <div className="flex items-center mb-5">
        <div className="text-xs text-slate-500">{rows.length} records</div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 ml-auto">
          <Plus size={14} className="mr-1" /> Add Payment
        </Button>
      </div>

      <DataTable columns={columns} data={rows} isLoading={isLoading} keyExtractor={r => r.id}
        emptyMessage="No payment records found." />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
          <DialogHeader><DialogTitle>Add Payment Record</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: "Customer ID *", key: "customer_id", placeholder: "1" },
              { label: "Property ID *", key: "property_id", placeholder: "1" },
              { label: "Total Amount (BDT) *", key: "total_amount", placeholder: "5500000" },
              { label: "Paid So Far (BDT)", key: "paid_amount", placeholder: "0" },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs text-slate-400">{f.label}</Label>
                <Input className="mt-1 bg-slate-800 border-slate-700 text-slate-200" placeholder={f.placeholder}
                  type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {createMutation.isPending ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
