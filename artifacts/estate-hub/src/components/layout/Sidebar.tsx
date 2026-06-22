import { Link, useRoute } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, UserCheck, Building2, CreditCard,
  Calendar, FileText, UserCog, Umbrella, Activity, Settings,
  ChevronLeft, ChevronRight, Menu, X, Building, Kanban
} from "lucide-react";
import { useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/leads", label: "Leads", icon: UserCheck },
  { path: "/pipeline", label: "Pipeline Board", icon: Kanban },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/properties", label: "Properties", icon: Building2 },
  { path: "/payments", label: "Payments", icon: CreditCard },
  { path: "/installments", label: "Installments", icon: Calendar },
  { path: "/documents", label: "Documents", icon: FileText },
  { path: "/users", label: "Users", icon: UserCog },
  { path: "/leaves", label: "Leave Management", icon: Umbrella },
  { path: "/audit-logs", label: "Activity Logs", icon: Activity },
  { path: "/settings", label: "Settings", icon: Settings },
];

function NavItem({ path, label, icon: Icon, collapsed }: { path: string; label: string; icon: any; collapsed: boolean }) {
  const [isActive] = useRoute(path + "/:rest*");
  const [isExact] = useRoute(path);
  const active = isActive || isExact;

  return (
    <Link href={path}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 group",
        active
          ? "bg-blue-600/20 text-blue-400 font-medium"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
      )}>
        <Icon size={16} className={cn("shrink-0", active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
        {!collapsed && <span className="text-sm truncate">{label}</span>}
        {!collapsed && active && <div className="ml-auto w-1 h-4 bg-blue-400 rounded-full" />}
      </div>
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 px-4 py-5 border-b border-slate-800", collapsed && "justify-center px-2")}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Building size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-white text-sm tracking-tight">Estate Hub</span>
            <div className="text-xs text-slate-500">ERP Platform</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.path} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User */}
      <div className={cn("px-3 py-3 border-t border-slate-800", collapsed && "px-2")}>
        {!collapsed && user && (
          <div className="mb-2 px-1">
            <div className="text-xs font-medium text-slate-300 truncate">{user.fullName || user.primaryEmailAddress?.emailAddress}</div>
            <div className="text-xs text-slate-500">Company Admin</div>
          </div>
        )}
        <button
          onClick={() => signOut()}
          className={cn(
            "w-full text-xs text-slate-500 hover:text-red-400 transition-colors px-1 py-1 text-left",
            collapsed && "text-center"
          )}
        >
          {collapsed ? "↪" : "Sign out"}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className={cn(
        "relative hidden md:flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-200 shrink-0",
        collapsed ? "w-14" : "w-56"
      )}>
        <SidebarContent />
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-slate-300"
      >
        <Menu size={16} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-56 h-full bg-slate-900 border-r border-slate-800">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-3 text-slate-400">
              <X size={16} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
