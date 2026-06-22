import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignIn, SignUp, Show, RedirectToSignIn } from "@clerk/react";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import LeadsPage from "@/pages/leads";
import LeadDetailPage from "@/pages/lead-detail";
import CustomersPage from "@/pages/customers";
import CustomerDetailPage from "@/pages/customer-detail";
import PropertiesPage from "@/pages/properties";
import PropertyDetailPage from "@/pages/property-detail";
import PaymentsPage from "@/pages/payments";
import InstallmentsPage from "@/pages/installments";
import UsersPage from "@/pages/users";
import LeavesPage from "@/pages/leaves";
import DocumentsPage from "@/pages/documents";
import AuditLogsPage from "@/pages/audit-logs";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  );
}

function ClerkSignInPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
      <div className="text-center mb-8 absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="w-7 h-7 bg-blue-600 rounded-lg" />
          <span className="font-bold text-white text-lg">Estate Hub</span>
        </div>
      </div>
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}

function ClerkSignUpPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
      <div className="text-center mb-8 absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="w-7 h-7 bg-blue-600 rounded-lg" />
          <span className="font-bold text-white text-lg">Estate Hub</span>
        </div>
      </div>
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in/:rest*" component={ClerkSignInPage} />
      <Route path="/sign-up/:rest*" component={ClerkSignUpPage} />
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/leads">
        <ProtectedRoute component={LeadsPage} />
      </Route>
      <Route path="/leads/:id">
        <ProtectedRoute component={LeadDetailPage} />
      </Route>
      <Route path="/customers">
        <ProtectedRoute component={CustomersPage} />
      </Route>
      <Route path="/customers/:id">
        <ProtectedRoute component={CustomerDetailPage} />
      </Route>
      <Route path="/properties">
        <ProtectedRoute component={PropertiesPage} />
      </Route>
      <Route path="/properties/:id">
        <ProtectedRoute component={PropertyDetailPage} />
      </Route>
      <Route path="/payments">
        <ProtectedRoute component={PaymentsPage} />
      </Route>
      <Route path="/installments">
        <ProtectedRoute component={InstallmentsPage} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={UsersPage} />
      </Route>
      <Route path="/leaves">
        <ProtectedRoute component={LeavesPage} />
      </Route>
      <Route path="/documents">
        <ProtectedRoute component={DocumentsPage} />
      </Route>
      <Route path="/audit-logs">
        <ProtectedRoute component={AuditLogsPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
