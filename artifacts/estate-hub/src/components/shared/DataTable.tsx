import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  keyExtractor?: (row: T) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  emptyMessage = "No records found",
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50">
            {columns.map((col) => (
              <th key={col.key} className={cn("px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap", col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full bg-slate-800" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : idx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "hover:bg-slate-800/30 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-slate-300", col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
