import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {title && (
          <header className="shrink-0 px-6 py-4 border-b border-slate-800 bg-[#0f1117]">
            <h1 className="text-base font-semibold text-slate-100">{title}</h1>
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
