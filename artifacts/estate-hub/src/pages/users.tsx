import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser, getGetUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, UserX, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLES = ["company_admin", "sales_manager", "sales_executive", "client"];

export default function UsersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", clerk_user_id: "", role: "sales_executive" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetUsers({} as any, { query: { queryKey: getGetUsersQueryKey({} as any) } });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const rows = (data as any[]) ?? [];

  async function handleCreate() {
    if (!form.name || !form.email || !form.clerk_user_id) return;
    await createMutation.mutateAsync({ data: form } as any);
    await queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey({} as any) });
    setShowCreate(false);
    setForm({ name: "", email: "", clerk_user_id: "", role: "sales_executive" });
    toast({ title: "User created" });
  }

  async function toggleActive(id: number, isActive: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    await updateMutation.mutateAsync({ id, data: { is_active: !isActive } } as any);
    await queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey({} as any) });
    toast({ title: isActive ? "User deactivated" : "User activated" });
  }

  const columns = [
    { key: "name", label: "Name", render: (r: any) => <span className="font-medium text-slate-200">{r.name}</span> },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r: any) => <StatusBadge status={r.role} /> },
    { key: "is_active", label: "Status", render: (r: any) => (
      <span className={`text-xs font-medium ${r.is_active ? "text-emerald-400" : "text-slate-500"}`}>{r.is_active ? "Active" : "Inactive"}</span>
    )},
    { key: "created_at", label: "Joined", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
    {
      key: "actions", label: "", render: (r: any) => (
        <button onClick={(e) => toggleActive(r.id, r.is_active, e)}
          className={`p-1.5 rounded transition-colors ${r.is_active ? "text-slate-500 hover:text-red-400" : "text-slate-600 hover:text-emerald-400"}`}>
          {r.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
        </button>
      )
    },
  ];

  return (
    <AppLayout title="Users">
      <div className="flex items-center mb-5">
        <div className="text-xs text-slate-500">{rows.length} users</div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 ml-auto">
          <Plus size={14} className="mr-1" /> Invite User
        </Button>
      </div>

      <DataTable columns={columns} data={rows} isLoading={isLoading} keyExtractor={r => r.id}
        emptyMessage="No users found." />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
          <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: "Full Name *", key: "name", placeholder: "Ahmed Rahman" },
              { label: "Email *", key: "email", placeholder: "ahmed@company.com" },
              { label: "Clerk User ID *", key: "clerk_user_id", placeholder: "user_..." },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs text-slate-400">{f.label}</Label>
                <Input className="mt-1 bg-slate-800 border-slate-700 text-slate-200" placeholder={f.placeholder}
                  value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <div>
              <Label className="text-xs text-slate-400">Role</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {createMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
