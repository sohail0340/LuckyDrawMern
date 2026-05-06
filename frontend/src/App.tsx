import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/useAuth";
import { WhatsAppSupportButton } from "@/components/WhatsAppSupportButton";

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const ReferEarn = lazy(() => import("@/pages/ReferEarn"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const ActiveDraws = lazy(() => import("@/pages/ActiveDraws"));
const DrawDetails = lazy(() => import("@/pages/DrawDetails"));
const Winners = lazy(() => import("@/pages/Winners"));
const Contact = lazy(() => import("@/pages/Contact"));
const About = lazy(() => import("@/pages/About"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const AdminOverview = lazy(() => import("@/pages/admin/Overview"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminDraws = lazy(() => import("@/pages/admin/Draws"));
const AdminPayments = lazy(() => import("@/pages/admin/Payments"));
const AdminWinners = lazy(() => import("@/pages/admin/Winners"));
const AdminReferrals = lazy(() => import("@/pages/admin/Referrals"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminStorage = lazy(() => import("@/pages/admin/Storage"));
const AdminSupportTickets = lazy(() => import("@/pages/admin/SupportTickets"));
const AdminFooterEditor = lazy(() => import("@/pages/admin/FooterEditor"));
const DynamicPage = lazy(() => import("@/pages/DynamicPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#FFD700]/30 border-t-[#FFD700] rounded-full animate-spin" />
  </div>
);

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  if (loading) return <PageLoader />;
  if (!user) { navigate("/auth"); return null; }
  if (!user.isAdmin) { navigate("/dashboard"); return null; }
  return <Component />;
}

function ProtectedBuyRedirect() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  if (loading) return <PageLoader />;
  if (!user) {
    navigate("/auth?tab=signup&next=/buy-tokens");
    return null;
  }
  return <Redirect to="/buy" />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/draws" component={ActiveDraws} />
        <Route path="/draws/:id" component={DrawDetails} />
        <Route path="/winners" component={Winners} />
        <Route path="/buy" component={ProtectedBuyRedirect} />
        <Route path="/buy-tokens" component={ProtectedBuyRedirect} />
        <Route path="/checkout"><Redirect to="/buy" /></Route>
        <Route path="/participate"><Redirect to="/buy" /></Route>
        <Route path="/refer" component={ReferEarn} />
        <Route path="/contact" component={Contact} />
        <Route path="/about" component={About} />
        <Route path="/auth" component={Auth} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/tokens" component={lazy(() => import("@/pages/dashboard/Tokens"))} />
        <Route path="/dashboard/transactions"><Redirect to="/dashboard" /></Route>
        <Route path="/dashboard/draws"><Redirect to="/dashboard" /></Route>
        <Route path="/dashboard/referrals"><Redirect to="/dashboard" /></Route>
        <Route path="/dashboard/profile"><Redirect to="/dashboard" /></Route>
        <Route path="/dashboard/notifications"><Redirect to="/dashboard" /></Route>
        <Route path="/admin">{() => <AdminRoute component={AdminOverview} />}</Route>
        <Route path="/admin/users">{() => <AdminRoute component={AdminUsers} />}</Route>
        <Route path="/admin/draws">{() => <AdminRoute component={AdminDraws} />}</Route>
        <Route path="/admin/payments">{() => <AdminRoute component={AdminPayments} />}</Route>
        <Route path="/admin/winners">{() => <AdminRoute component={AdminWinners} />}</Route>
        <Route path="/admin/referrals">{() => <AdminRoute component={AdminReferrals} />}</Route>
        <Route path="/admin/settings">{() => <AdminRoute component={AdminSettings} />}</Route>
        <Route path="/admin/storage">{() => <AdminRoute component={AdminStorage} />}</Route>
        <Route path="/admin/support">{() => <AdminRoute component={AdminSupportTickets} />}</Route>
        <Route path="/admin/footer">{() => <AdminRoute component={AdminFooterEditor} />}</Route>
        <Route path="/p/:slug" component={DynamicPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={BASE_PATH}>
            <Router />
          </WouterRouter>
          <WhatsAppSupportButton />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
