import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAuditLogs, getGetAuditLogsQueryKey } from "@workspace/api-client-react";
import { Activity, User, Building2, CreditCard, FileText, UserCheck } from "lucide-react";

const entityIcon: Record<string, any> = {
  lead: UserCheck,
  customer: User,
  property: Building2,
  payment: CreditCard,
  installment: CreditCard,
  document: FileText,
  user: User,
};

const actionColor: Record<string, string> = {
  created: "bg-emerald-500",
  updated: "bg-blue-500",
  deleted: "bg-red-500",
  assigned: "bg-violet-500",
  added: "bg-indigo-500",
  paid: "bg-green-500",
};

export default function AuditLogsPage() {
  const { data, isLoading } = useGetAuditLogs({} as any, { query: { queryKey: getGetAuditLogsQueryKey({} as any) } });
  const rows = (data as any[]) ?? [];

  return (
    <AppLayout title="Activity Logs">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 bg-slate-800 rounded-lg" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Activity size={32} className="mx-auto mb-3 opacity-30" />
          <p>No activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {rows.map((log: any) => {
            const Icon = entityIcon[log.entity_type] ?? Activity;
            const dotColor = actionColor[log.action] ?? "bg-slate-500";
            return (
              <div key={log.id} className="flex items-start gap-4 py-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-900/30 rounded px-2 transition-colors">
                <div className="shrink-0 mt-1 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <Icon size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300">{log.description}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-600">
                    {log.user_name && <span className="text-slate-500">{log.user_name}</span>}
                    <span className="capitalize">{log.action}</span>
                    <span>{log.entity_type}</span>
                    {log.entity_id && <span>#{log.entity_id}</span>}
                  </div>
                </div>
                <div className="text-xs text-slate-600 shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
