import { AppLayout } from "@/components/layout/AppLayout";
import { useGetMe } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, User, Shield } from "lucide-react";

export default function SettingsPage() {
  const { data: me } = useGetMe();
  const user = me as any;

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-slate-500" />
            <h3 className="text-sm font-medium text-slate-300">Profile</h3>
          </div>
          {user ? (
            <div className="space-y-3">
              {[
                { label: "Name", value: user.name },
                { label: "Email", value: user.email || "—" },
                { label: "Role", value: <StatusBadge status={user.role} /> },
                { label: "Status", value: user.is_active ? "Active" : "Inactive" },
                { label: "Member since", value: new Date(user.created_at).toLocaleDateString() },
              ].map(f => (
                <div key={f.label} className="flex justify-between items-center py-1 border-b border-slate-800 last:border-0">
                  <span className="text-xs text-slate-500">{f.label}</span>
                  <span className="text-sm text-slate-300">{f.value}</span>
                </div>
              ))}
            </div>
          ) : <Skeleton className="h-32 bg-slate-800" />}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building size={15} className="text-slate-500" />
            <h3 className="text-sm font-medium text-slate-300">Company</h3>
          </div>
          <p className="text-sm text-slate-500">Company configuration coming soon.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="text-slate-500" />
            <h3 className="text-sm font-medium text-slate-300">Security & Access</h3>
          </div>
          <p className="text-sm text-slate-500">Role-based access control is managed by the system administrator. Contact your admin to change your role or permissions.</p>
        </div>
      </div>
    </AppLayout>
  );
}
