import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCustomer, getGetCustomerQueryKey,
  useGetOwnerships, getGetOwnershipsQueryKey,
  useGetPayments, getGetPaymentsQueryKey,
  useGetInstallments, getGetInstallmentsQueryKey,
} from "@workspace/api-client-react";
import { ChevronLeft } from "lucide-react";

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(0)}K`;
  return `৳${n}`;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const numId = Number(id);

  const { data: customer, isLoading } = useGetCustomer(numId, { query: { enabled: !!numId, queryKey: getGetCustomerQueryKey(numId) } });
  const { data: ownerships } = useGetOwnerships({ customer_id: numId } as any, { query: { queryKey: getGetOwnershipsQueryKey({ customer_id: numId } as any) } });
  const { data: payments } = useGetPayments({ customer_id: numId } as any, { query: { queryKey: getGetPaymentsQueryKey({ customer_id: numId } as any) } });

  if (isLoading) return <AppLayout title="Customer"><Skeleton className="h-48 bg-slate-800" /></AppLayout>;
  if (!customer) return <AppLayout title="Customer"><p className="text-slate-500">Not found.</p></AppLayout>;

  const c = customer as any;

  return (
    <AppLayout title={`Customer — ${c.name}`}>
      <button onClick={() => navigate("/customers")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-5">
        <ChevronLeft size={14} /> Back to Customers
      </button>

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Customer Info</h3>
          <div className="space-y-3">
            {[
              { label: "Name", value: c.name },
              { label: "Phone", value: c.phone },
              { label: "Email", value: c.email || "—" },
              { label: "NID", value: c.nid || "—" },
              { label: "Address", value: c.address || "—" },
              { label: "Added", value: new Date(c.created_at).toLocaleDateString() },
            ].map(f => (
              <div key={f.label} className="flex justify-between gap-2">
                <span className="text-xs text-slate-500 shrink-0">{f.label}</span>
                <span className="text-sm text-slate-300 font-medium text-right">{f.value}</span>
              </div>
            ))}
          </div>
          {c.notes && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Notes</div>
              <p className="text-sm text-slate-400">{c.notes}</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          {/* Properties owned */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Properties Owned</h3>
            {(ownerships as any[])?.length > 0 ? (
              <div className="space-y-2">
                {(ownerships as any[]).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-200">{o.property_name}</div>
                      <div className="text-xs text-slate-500">{o.project_name} · {o.ownership_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-400">{fmt(o.purchase_price)}</div>
                      <div className="text-xs text-slate-500">{o.purchase_date}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-600">No properties owned.</p>}
          </div>

          {/* Payments */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Payment Summary</h3>
            {(payments as any[])?.length > 0 ? (
              <div className="space-y-3">
                {(payments as any[]).map((p: any) => (
                  <div key={p.id} className="py-2 border-b border-slate-800 last:border-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-300">{p.property_name}</span>
                      <span className="text-xs text-slate-500">Total: {fmt(p.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400">Paid: {fmt(p.paid_amount)}</span>
                      <span className="text-amber-400">Due: {fmt(p.due_amount)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.paid_amount / p.total_amount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-600">No payment records.</p>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
