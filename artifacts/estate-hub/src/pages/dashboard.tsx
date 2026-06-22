import { AppLayout } from "@/components/layout/AppLayout";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDashboardSummary,
  useGetLeadPipeline,
  useGetRecentActivity,
  useGetCollectionSummary,
} from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Building2, CreditCard, TrendingUp, AlertCircle, Calendar, UserCheck } from "lucide-react";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: pipeline } = useGetLeadPipeline();
  const { data: activity } = useGetRecentActivity();
  const { data: collection } = useGetCollectionSummary();

  return (
    <AppLayout title="Dashboard">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Leads"
          value={summaryLoading ? "…" : (summary?.total_leads ?? 0)}
          icon={<UserCheck size={18} />}
          accent="text-blue-400"
        />
        <KpiCard
          label="Customers"
          value={summaryLoading ? "…" : (summary?.total_customers ?? 0)}
          icon={<Users size={18} />}
          accent="text-indigo-400"
        />
        <KpiCard
          label="Properties"
          value={summaryLoading ? "…" : (summary?.total_properties ?? 0)}
          icon={<Building2 size={18} />}
          accent="text-violet-400"
          sub={`${summary?.available_properties ?? 0} available`}
        />
        <KpiCard
          label="Revenue Collected"
          value={summaryLoading ? "…" : fmt(summary?.total_revenue)}
          icon={<TrendingUp size={18} />}
          accent="text-emerald-400"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Pipeline chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Lead Pipeline</h3>
          {pipeline ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipeline} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#6b7a9e" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7a9e" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#161b27", border: "1px solid #1e2740", borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: "#e8eaf0" }}
                  itemStyle={{ color: "#60a5fa" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[200px] bg-slate-800" />
          )}
        </div>

        {/* Collection summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Collection Summary</h3>
          {collection ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Total Portfolio Value</div>
                <div className="text-xl font-bold text-slate-100">{fmt(collection.total_amount)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Collected</div>
                <div className="text-lg font-semibold text-emerald-400">{fmt(collection.total_paid)}</div>
                <div className="mt-1.5 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${collection.total_amount ? (collection.total_paid / collection.total_amount) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Outstanding Due</div>
                <div className="text-base font-semibold text-amber-400">{fmt(collection.total_due)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">This Month</div>
                <div className="text-base font-semibold text-blue-400">{fmt(collection.this_month_collected)}</div>
              </div>
            </div>
          ) : (
            <Skeleton className="h-32 bg-slate-800" />
          )}
        </div>
      </div>

      {/* Property stats + Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Property Status</h3>
          {summary ? (
            <div className="space-y-3">
              {[
                { label: "Available", value: summary.available_properties, color: "bg-emerald-500" },
                { label: "Reserved", value: summary.reserved_properties, color: "bg-amber-500" },
                { label: "Sold", value: summary.sold_properties, color: "bg-blue-500" },
              ].map((s) => {
                const total = (summary.total_properties || 1);
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{s.label}</span>
                      <span className="text-slate-300 font-medium">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${(s.value! / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-800 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><AlertCircle size={11} className="text-red-400" /> {summary.overdue_installments} overdue installments</span>
              </div>
            </div>
          ) : <Skeleton className="h-28 bg-slate-800" />}
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h3>
          {activity ? (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {activity.length === 0 ? (
                <p className="text-sm text-slate-500">No activity yet.</p>
              ) : (
                activity.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 py-1.5 border-b border-slate-800/50 last:border-0">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-300">{log.description}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {log.user_name && <span className="text-slate-500">{log.user_name} · </span>}
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 bg-slate-800" />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
