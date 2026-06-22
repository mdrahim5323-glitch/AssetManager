import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProperty, getGetPropertyQueryKey, useGetOwnerships, getGetOwnershipsQueryKey } from "@workspace/api-client-react";
import { ChevronLeft } from "lucide-react";

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(2)}M`;
  return `৳${n?.toLocaleString()}`;
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const numId = Number(id);

  const { data: property, isLoading } = useGetProperty(numId, { query: { enabled: !!numId, queryKey: getGetPropertyQueryKey(numId) } });
  const { data: ownerships } = useGetOwnerships({ property_id: numId } as any, { query: { queryKey: getGetOwnershipsQueryKey({ property_id: numId } as any) } });

  if (isLoading) return <AppLayout title="Property"><Skeleton className="h-48 bg-slate-800" /></AppLayout>;
  if (!property) return <AppLayout title="Property"><p className="text-slate-500">Not found.</p></AppLayout>;

  const p = property as any;

  return (
    <AppLayout title={`${p.property_name} — ${p.project_name}`}>
      <button onClick={() => navigate("/properties")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-5">
        <ChevronLeft size={14} /> Back to Properties
      </button>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Property Details</h3>
          <div className="space-y-3">
            {[
              { label: "Project", value: p.project_name },
              { label: "Property", value: p.property_name },
              { label: "Unit No", value: p.unit_no || "—" },
              { label: "Location", value: p.location || "—" },
              { label: "Type", value: p.property_type },
              { label: "Listed Price", value: fmt(p.price) },
              { label: "Status", value: <StatusBadge status={p.status} /> },
              { label: "Created", value: new Date(p.created_at).toLocaleDateString() },
            ].map(f => (
              <div key={f.label} className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{f.label}</span>
                <span className="text-sm text-slate-300 font-medium">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Ownership History</h3>
          {(ownerships as any[])?.length > 0 ? (
            <div className="space-y-3">
              {(ownerships as any[]).map((o: any) => (
                <div key={o.id} className="py-2.5 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200">{o.customer_name}</span>
                    <span className="text-sm font-semibold text-emerald-400">{fmt(o.purchase_price)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{o.ownership_type}</span>
                    <span>{o.purchase_date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No ownership records.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
