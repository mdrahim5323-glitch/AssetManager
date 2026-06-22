import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  accent?: string;
}

export function KpiCard({ label, value, icon, sub, accent = "text-blue-400" }: KpiCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-start gap-3">
      {icon && (
        <div className={cn("mt-0.5 shrink-0", accent)}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</div>
        <div className={cn("text-2xl font-bold tracking-tight", accent)}>{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
