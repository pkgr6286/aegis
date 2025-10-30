import { useEffect, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getDefaultRoute, getUserType } from "@/lib/userHelpers";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AcceptInvite from "@/pages/AcceptInvite";
import AccountProfile from "@/pages/AccountProfile";
import Forbidden from "@/pages/Forbidden";

// Consumer Pages (Public Screening Flow)
import Welcome from "@/pages/public/Welcome";
import Screener from "@/pages/public/Screener";
import EducationModule from "@/pages/public/EducationModule";
import ComprehensionModule from "@/pages/public/ComprehensionModule";
import Outcome from "@/pages/public/Outcome";
import VerificationCode from "@/pages/public/VerificationCode";

// EHR Integration Pages (Public)
import EhrLogin from "@/pages/ehr/EhrLogin";
import EhrConsent from "@/pages/ehr/EhrConsent";
import EhrShareData from "@/pages/ehr/EhrShareData";

// Super Admin Pages
import SuperAdminDashboard from "@/pages/Dashboard";
import TenantManagement from "@/pages/TenantManagement";
import SuperAdminUserManagement from "@/pages/UserManagement";
import SuperAdminAuditLogs from "@/pages/AuditLogs";

// Pharma Admin Pages
import PharmaAdminDashboard from "@/pages/admin/Dashboard";
import BrandManagement from "@/pages/admin/BrandManagement";
import UserManagement from "@/pages/admin/UserManagement";
import PartnerManagement from "@/pages/admin/PartnerManagement";
import AuditLogsPage from "@/pages/admin/AuditLogs";
import DrugPrograms from "@/pages/admin/DrugPrograms";
import DrugProgramDetail from "@/pages/admin/DrugProgramDetail";
import ScreenerBuilder from "@/pages/admin/ScreenerBuilder";
import Intelligence from "@/pages/admin/Intelligence";
import Regulatory from "@/pages/admin/Regulatory";
import { PharmaAdminLayout } from "@/components/admin/PharmaAdminLayout";

// Clinician Pages
import ReviewQueue from "@/pages/clinician/ReviewQueue";
import SessionReview from "@/pages/clinician/SessionReview";

import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";

// Protected Route wrapper for Super Admin
function SuperAdminRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !hasRedirected.current) {
    hasRedirected.current = true;
    setTimeout(() => setLocation('/login'), 0);
    return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-12 w-48" /></div>;
  }

  const userType = getUserType(user);
  if (userType !== 'superadmin' && !hasRedirected.current) {
    hasRedirected.current = true;
    setTimeout(() => setLocation(getDefaultRoute(user)), 0);
    return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-12 w-48" /></div>;
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

// Protected Route wrapper for Pharma Admin
function PharmaAdminRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !hasRedirected.current) {
    hasRedirected.current = true;
    setTimeout(() => setLocation('/login'), 0);
    return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-12 w-48" /></div>;
  }

  const userType = getUserType(user);
  if (userType !== 'pharma-admin' && !hasRedirected.current) {
    hasRedirected.current = true;
    setTimeout(() => setLocation(getDefaultRoute(user)), 0);
    return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-12 w-48" /></div>;
  }

  return (
    <PharmaAdminLayout>
      <Component />
    </PharmaAdminLayout>
  );
}

// Root redirect component - NO <Redirect> COMPONENT
function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  // Only redirect once when auth state is determined
  if (!isLoading && !hasRedirected.current) {
    hasRedirected.current = true;
    const targetRoute = isAuthenticated ? getDefaultRoute(user) : '/login';
    // Use setTimeout to avoid updating during render
    setTimeout(() => setLocation(targetRoute), 0);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Skeleton className="h-12 w-48" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Root redirect */}
      <Route path="/" component={RootRedirect} />
      
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/403" component={Forbidden} />

      {/* Consumer Screening Flow (Public) */}
      <Route path="/screen/:slug" component={Welcome} />
      <Route path="/screen/:slug/questions" component={Screener} />
      <Route path="/screen/:slug/education" component={EducationModule} />
      <Route path="/screen/:slug/comprehension" component={ComprehensionModule} />
      <Route path="/screen/:slug/outcome" component={Outcome} />
      <Route path="/screen/:slug/code" component={VerificationCode} />

      {/* EHR Integration Flow (Public) */}
      <Route path="/ehr/login" component={EhrLogin} />
      <Route path="/ehr/consent" component={EhrConsent} />
      <Route path="/ehr/share-data" component={EhrShareData} />
      
      {/* Account Profile (Protected) */}
      <Route path="/account/profile" component={AccountProfile} />
      
      {/* Super Admin Routes */}
      <Route path="/superadmin/dashboard">
        <SuperAdminRoute component={SuperAdminDashboard} />
      </Route>
      <Route path="/superadmin/tenants">
        <SuperAdminRoute component={TenantManagement} />
      </Route>
      <Route path="/superadmin/users">
        <SuperAdminRoute component={SuperAdminUserManagement} />
      </Route>
      <Route path="/superadmin/audit-logs">
        <SuperAdminRoute component={SuperAdminAuditLogs} />
      </Route>

      {/* Pharma Admin Routes */}
      <Route path="/admin/dashboard">
        <PharmaAdminRoute component={PharmaAdminDashboard} />
      </Route>
      <Route path="/admin/programs">
        <PharmaAdminRoute component={DrugPrograms} />
      </Route>
      <Route path="/admin/programs/:programId/screener/:versionId">
        <PharmaAdminRoute component={ScreenerBuilder} />
      </Route>
      <Route path="/admin/programs/:id">
        <PharmaAdminRoute component={DrugProgramDetail} />
      </Route>
      <Route path="/admin/users">
        <PharmaAdminRoute component={UserManagement} />
      </Route>
      <Route path="/admin/partners">
        <PharmaAdminRoute component={PartnerManagement} />
      </Route>
      <Route path="/admin/brands">
        <PharmaAdminRoute component={BrandManagement} />
      </Route>
      <Route path="/admin/audit-logs">
        <PharmaAdminRoute component={AuditLogsPage} />
      </Route>
      <Route path="/admin/intelligence">
        <PharmaAdminRoute component={Intelligence} />
      </Route>
      <Route path="/admin/regulatory">
        <PharmaAdminRoute component={Regulatory} />
      </Route>

      {/* Clinician Routes */}
      <Route path="/clinician/review-queue">
        <PharmaAdminRoute component={ReviewQueue} />
      </Route>
      <Route path="/clinician/sessions/:id">
        <PharmaAdminRoute component={SessionReview} />
      </Route>

      {/* 404 Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SessionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
