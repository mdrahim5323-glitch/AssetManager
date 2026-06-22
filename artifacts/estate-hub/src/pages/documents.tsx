import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetDocuments, useCreateDocument, useDeleteDocument, getGetDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DOC_TYPES = ["NID", "Booking Form", "Agreement", "Allotment Letter", "Money Receipt", "Other"];

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customer_id: "", property_id: "", doc_type: "Booking Form", file_name: "", file_url: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetDocuments(
    { doc_type: typeFilter || undefined } as any,
    { query: { queryKey: getGetDocumentsQueryKey({ doc_type: typeFilter || undefined } as any) } }
  );
  const createMutation = useCreateDocument();
  const deleteMutation = useDeleteDocument();

  const rows = (data as any[]) ?? [];

  async function handleCreate() {
    if (!form.file_name || !form.file_url || !form.doc_type) return;
    await createMutation.mutateAsync({
      data: {
        doc_type: form.doc_type,
        file_name: form.file_name,
        file_url: form.file_url,
        customer_id: form.customer_id ? Number(form.customer_id) : undefined,
        property_id: form.property_id ? Number(form.property_id) : undefined,
      }
    } as any);
    await queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey({} as any) });
    setShowCreate(false);
    setForm({ customer_id: "", property_id: "", doc_type: "Booking Form", file_name: "", file_url: "" });
    toast({ title: "Document added" });
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteMutation.mutateAsync({ id } as any);
    await queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey({} as any) });
    toast({ title: "Document removed" });
  }

  const columns = [
    { key: "file_name", label: "File Name", render: (r: any) => (
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-slate-500 shrink-0" />
        <span className="font-medium text-slate-200">{r.file_name}</span>
      </div>
    )},
    { key: "doc_type", label: "Type", render: (r: any) => (
      <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-300">{r.doc_type}</span>
    )},
    { key: "customer_name", label: "Customer", render: (r: any) => r.customer_name || <span className="text-slate-600">—</span> },
    { key: "property_name", label: "Property", render: (r: any) => r.property_name || <span className="text-slate-600">—</span> },
    { key: "created_at", label: "Uploaded", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
    {
      key: "actions", label: "", render: (r: any) => (
        <div className="flex items-center gap-1">
          <a href={r.file_url} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded text-slate-500 hover:text-blue-400 transition-colors">
            <Download size={13} />
          </a>
          <button onClick={(e) => handleDelete(r.id, e)} className="p-1.5 rounded text-slate-600 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      )
    },
  ];

  return (
    <AppLayout title="Documents">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {["", ...DOC_TYPES].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${typeFilter === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
              {t || "All"}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 ml-auto">
          <Plus size={14} className="mr-1" /> Add Document
        </Button>
      </div>

      <div className="mb-2 text-xs text-slate-500">{rows.length} documents</div>
      <DataTable columns={columns} data={rows} isLoading={isLoading} keyExtractor={r => r.id}
        emptyMessage="No documents found." />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
          <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-slate-400">Document Type</Label>
              <Select value={form.doc_type} onValueChange={v => setForm({ ...form, doc_type: v })}>
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {[
              { label: "File Name *", key: "file_name", placeholder: "agreement-2026.pdf" },
              { label: "File URL *", key: "file_url", placeholder: "https://..." },
              { label: "Customer ID", key: "customer_id", placeholder: "1" },
              { label: "Property ID", key: "property_id", placeholder: "1" },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs text-slate-400">{f.label}</Label>
                <Input className="mt-1 bg-slate-800 border-slate-700 text-slate-200" placeholder={f.placeholder}
                  value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {createMutation.isPending ? "Adding..." : "Add Document"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
