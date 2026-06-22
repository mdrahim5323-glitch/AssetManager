import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  // Lead statuses
  New: "bg-slate-700 text-slate-300",
  Contacted: "bg-blue-900/60 text-blue-300",
  Interested: "bg-indigo-900/60 text-indigo-300",
  "Site Visit": "bg-violet-900/60 text-violet-300",
  Negotiation: "bg-amber-900/60 text-amber-300",
  Booking: "bg-emerald-900/60 text-emerald-300",
  Sold: "bg-green-900/60 text-green-300",
  // Property statuses
  Available: "bg-emerald-900/60 text-emerald-300",
  Reserved: "bg-amber-900/60 text-amber-300",
  // Installment statuses
  Pending: "bg-amber-900/60 text-amber-300",
  Paid: "bg-green-900/60 text-green-300",
  Overdue: "bg-red-900/60 text-red-300",
  // Leave statuses
  Approved: "bg-green-900/60 text-green-300",
  Rejected: "bg-red-900/60 text-red-300",
  // Role
  company_admin: "bg-violet-900/60 text-violet-300",
  super_admin: "bg-red-900/60 text-red-300",
  sales_manager: "bg-blue-900/60 text-blue-300",
  sales_executive: "bg-slate-700 text-slate-300",
  client: "bg-emerald-900/60 text-emerald-300",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      statusColors[status] ?? "bg-slate-700 text-slate-300",
      className
    )}>
      {status}
    </span>
  );
}
