import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetInstallments, useUpdateInstallment, getGetInstallmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(2)}M`;
  return `৳${n?.toLocaleString()}`;
}

export default function InstallmentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetInstallments(
    { status: statusFilter || undefined } as any,
    { query: { queryKey: getGetInstallmentsQueryKey({ status: statusFilter || undefined } as any) } }
  );
  const updateMutation = useUpdateInstallment();

  async function markPaid(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const today = new Date().toISOString().slice(0, 10);
    await updateMutation.mutateAsync({ id, data: { status: "Paid", paid_date: today } } as any);
    await queryClient.invalidateQueries({ queryKey: getGetInstallmentsQueryKey({} as any) });
    toast({ title: "Installment marked as paid" });
  }

  const rows = (data as any[]) ?? [];

  const columns = [
    { key: "installment_no", label: "#", render: (r: any) => <span className="font-mono text-slate-400">#{r.installment_no}</span> },
    { key: "customer_name", label: "Customer", render: (r: any) => <span className="font-medium text-slate-200">{r.customer_name || `—`}</span> },
    { key: "property_name", label: "Property", render: (r: any) => r.property_name || "—" },
    { key: "amount", label: "Amount", render: (r: any) => <span className="font-medium text-emerald-400">{fmt(r.amount)}</span> },
    { key: "due_date", label: "Due Date" },
    { key: "paid_date", label: "Paid Date", render: (r: any) => r.paid_date || <span className="text-slate-600">—</span> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
    {
      key: "actions", label: "", render: (r: any) => r.status !== "Paid" ? (
        <button onClick={(e) => markPaid(r.id, e)}
          className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors px-2 py-1 rounded border border-emerald-900/40 hover:bg-emerald-900/20">
          <CheckCircle2 size={12} /> Mark Paid
        </button>
      ) : null
    },
  ];

  return (
    <AppLayout title="Installments">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-2">
          {["", "Pending", "Paid", "Overdue"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 ml-auto">{rows.length} installments</span>
      </div>

      <DataTable columns={columns} data={rows} isLoading={isLoading} keyExtractor={r => r.id}
        emptyMessage="No installments found." />
    </AppLayout>
  );
}
