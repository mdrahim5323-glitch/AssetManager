import { Link } from "wouter";
import { Show } from "@clerk/react";
import { Building, ChevronRight, Users, TrendingUp, FileText, Shield, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Users, title: "Lead & CRM Management", desc: "Track leads through a full sales pipeline. Assign to agents, log follow-ups, convert to customers." },
  { icon: Building, title: "Property Inventory", desc: "Manage your entire property portfolio — flats, plots, shares. Track availability, reservations, and sales." },
  { icon: TrendingUp, title: "Payment & Installments", desc: "Record payments, generate installment schedules, mark paid installments, and track overdue collections." },
  { icon: FileText, title: "Document Center", desc: "Store and manage all client documents — agreements, allotment letters, money receipts — in one place." },
  { icon: Shield, title: "Role-Based Access", desc: "Super admin, company admin, sales manager, executive, and client roles with fine-grained access control." },
  { icon: BarChart2, title: "Analytics Dashboard", desc: "Role-scoped dashboards with pipeline charts, collection summaries, KPIs, and activity feeds." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building size={16} />
            </div>
            <span className="font-bold text-white">Estate Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Open Dashboard
                </Button>
              </Link>
            </Show>
            <Show when="signed-out">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">Sign in</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
              </Link>
            </Show>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800/40 text-blue-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          Production-Ready Real Estate ERP
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          The command center for<br />real estate professionals
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Estate Hub unifies your leads, customers, properties, payments, and team in one authoritative platform. Built for the way real estate businesses actually operate.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Show when="signed-out">
            <Link href="/sign-up">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Start for free <ChevronRight size={16} className="ml-1" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Sign in
              </Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Open Dashboard <ChevronRight size={16} className="ml-1" />
              </Button>
            </Link>
          </Show>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-800 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Properties Managed", value: "10,000+" },
            { label: "Leads Tracked", value: "50,000+" },
            { label: "Payments Processed", value: "$2B+" },
            { label: "Team Members", value: "500+" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-3 text-white">Everything a real estate company needs</h2>
        <p className="text-slate-400 text-center mb-14">One platform replacing a dozen spreadsheets, WhatsApp groups, and disconnected tools.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
              <div className="w-9 h-9 bg-blue-900/40 rounded-lg flex items-center justify-center mb-4">
                <f.icon size={18} className="text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-800/30 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to modernize your real estate operations?</h2>
          <p className="text-slate-400 mb-8">Join hundreds of companies managing their full portfolio on Estate Hub.</p>
          <Show when="signed-out">
            <Link href="/sign-up">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-10">
                Create your account
              </Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-10">
                Go to Dashboard
              </Button>
            </Link>
          </Show>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>Estate Hub &copy; 2026. Real Estate ERP Platform.</span>
          <span>Built with precision for real estate professionals.</span>
        </div>
      </footer>
    </div>
  );
}
