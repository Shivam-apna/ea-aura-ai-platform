import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import React, { useEffect } from "react";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import BusinessVitality from "./pages/BusinessVitality";
import CustomerAnalyzer from "./pages/CustomerAnalyzer";
import MissionAlignment from "./pages/MissionAlignment";
import BrandIndex from "./pages/BrandIndex";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import LoginPage from "./pages/Login";
import { cn } from "@/lib/utils";
import { useKeycloakRoles } from "./hooks/useKeycloakRoles";
import Landing from "./pages/Landing";
import UploadData from "./pages/UploadData";
import { DashboardRefreshProvider } from "./contexts/DashboardRefreshContext";
import { useTheme } from "./components/ThemeProvider";
import { allAgents } from "./config/sidebar_agents"; // Import allAgents

const queryClient = new QueryClient();

// ProtectedRoute component to guard routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { clientRoles } = useKeycloakRoles();
  const location = useLocation();

  console.log("ProtectedRoute Render:", {
    location: location.pathname,
    authLoading,
    isAuthenticated,
    clientRoles,
  });

  // Add a specific check for roles loading: if authenticated but roles are empty and AuthProvider isn't loading anymore
  const rolesAreLoading = isAuthenticated && clientRoles.length === 0 && !authLoading;

  if (authLoading || rolesAreLoading) {
    console.log("ProtectedRoute: Still loading authentication or roles. Showing loading screen.");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading authentication and user roles...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated. Redirecting to /login.");
    return <Navigate to="/login" replace />;
  }

  // Define allowed paths based on roles
  let allowedPaths: string[] = ['/profile', '/landing']; // Profile and Landing are always accessible if authenticated
  let defaultRedirectPath = '/dashboard'; // Default for users

  console.log("ProtectedRoute: Checking roles for path", location.pathname, "with roles:", clientRoles);

  if (clientRoles.some(role => role.toLowerCase() === 'admin')) {
    console.log("ProtectedRoute: User is admin.");
    allowedPaths = allowedPaths.concat([
      '/settings', '/users', '/upload-data', '/dashboard', '/business-vitality',
      '/customer-analyzer', '/mission-alignment', '/brand-index',
    ]);
    defaultRedirectPath = '/settings';
  } else if (clientRoles.some(role => role.toLowerCase() === 'user') && !clientRoles.some(role => role.toLowerCase() === 'admin')) {
    console.log("ProtectedRoute: User is a standard user (not admin).");
    allowedPaths = allowedPaths.concat([
      '/dashboard', '/business-vitality', '/customer-analyzer',
      '/mission-alignment', '/brand-index',
    ]);
    defaultRedirectPath = '/dashboard';
  } else {
    // This block should ideally not be hit if roles are properly loaded and user has a role
    console.warn("ProtectedRoute: User has no recognized roles. Redirecting to login. Current roles:", clientRoles);
    return <Navigate to="/login" replace />;
  }

  // Check if the current path is allowed
  if (!allowedPaths.includes(location.pathname)) {
    console.warn(`ProtectedRoute: Access denied for ${location.pathname}. Redirecting to ${defaultRedirectPath}. Allowed paths:`, allowedPaths);
    return <Navigate to={defaultRedirectPath} replace />;
  }

  console.log(`ProtectedRoute: User is authenticated and authorized for ${location.pathname}. Rendering children.`);
  return <>{children}</>;
};

// Layout component that conditionally renders header and sidebar
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { clientRoles } = useKeycloakRoles();
  const [activeAgent, setActiveAgent] = React.useState('overview'); // Default to 'overview'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const { theme } = useTheme(); // Get the current theme from context

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/landing';

  // Effect to force light mode for auth pages and restore theme for others
  useEffect(() => {
    const root = window.document.documentElement;
    if (isAuthPage) {
      // Force light mode for auth pages
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // Let ThemeProvider manage for other pages
      root.classList.remove('light', 'dark'); // Clear any forced state
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    }
  }, [isAuthPage, theme]); // Depend on isAuthPage and theme

  // Effect to initialize activeAgent based on user role and stored preference
  useEffect(() => {
    if (isAuthenticated && !authLoading && clientRoles.length > 0) {
      const isAdmin = clientRoles.some(role => role.toLowerCase() === 'admin');
      const isUser = clientRoles.some(role => role.toLowerCase() === 'user');

      if (isUser && !isAdmin) {
        // For 'user' role, check local storage for last active agent, default to 'overview'
        const lastActiveAgent = localStorage.getItem('last_active_agent_user_role');
        setActiveAgent(lastActiveAgent || 'overview');
      } else if (isAdmin) {
        // For 'admin' role, keep existing behavior (e.g., default to settings or last visited)
        // For now, we'll just keep the default 'overview' or whatever the sidebar's default is
        // If admin has a specific default, it should be set here.
        // For this request, admin behavior remains unchanged, so no explicit override needed here.
      }
    }
  }, [isAuthenticated, authLoading, clientRoles, location.pathname]); // Add location.pathname to re-evaluate on route change

  // NEW useEffect to sync activeAgent with current route
  useEffect(() => {
    const currentAgent = allAgents.find(agent => agent.path === location.pathname);
    if (currentAgent) {
      setActiveAgent(currentAgent.id);
    } else if (location.pathname === '/') {
      // Default to 'overview' if at root and not an auth page
      if (!isAuthPage) {
        setActiveAgent('overview');
      }
    }
  }, [location.pathname, isAuthPage]); // Only re-run when pathname or authPage status changes

  if (isAuthPage) {
    // For login and landing pages, just render children directly.
    // These pages will manage their own full-screen styling.
    return <>{children}</>;
  }

  return (
    // This div now only handles the flex layout for the main app, not global background/text colors
    <div className="flex flex-col w-full h-screen">
      <AppHeader companyName="EA AURA" onSelectAgent={setActiveAgent} />
      <div className="flex flex-grow overflow-hidden relative">
        <Sidebar
          activeAgent={activeAgent}
          onSelectAgent={setActiveAgent}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <main className={cn(
          "flex-grow overflow-auto h-full flex flex-col",
          // No need for this conditional class anymore, as the html element will control the theme
          // !isAuthPage && "bg-background text-foreground"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DashboardRefreshProvider>
              <AppLayout>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        {/* Redirect to landing page if authenticated */}
                        <Navigate to="/landing" replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/landing" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard activeAgent="overview" onSelectAgent={() => { }} />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/business-vitality" element={<ProtectedRoute><BusinessVitality /></ProtectedRoute>} />
                  <Route path="/customer-analyzer" element={<ProtectedRoute><CustomerAnalyzer /></ProtectedRoute>} />
                  <Route path="/mission-alignment" element={<ProtectedRoute><MissionAlignment /></ProtectedRoute>} />
                  <Route path="/brand-index" element={<ProtectedRoute><BrandIndex /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                  <Route path="/upload-data" element={<ProtectedRoute><UploadData /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/login" element={<LoginPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </DashboardRefreshProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;