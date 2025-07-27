import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import { KeycloakProvider, useKeycloak } from "./components/Auth/KeycloakProvider";
import React from "react";
import AppHeader from "./components/AppHeader"; // Import AppHeader
import Sidebar from "./components/Sidebar"; // Import Sidebar
import BusinessVitality from "./pages/BusinessVitality";
import CustomerAnalyzer from "./pages/CustomerAnalyzer";
import MissionAlignment from "./pages/MissionAlignment";
import BrandIndex from "./pages/BrandIndex";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import DataAnalysis from "./pages/DataAnalysis";
import Security from "./pages/Security";
import ChatbotLauncher from "./components/ChatbotLauncher"; // Import ChatbotLauncher
import { cn } from "@/lib/utils"; // Import cn for conditional classes


const queryClient = new QueryClient();

// ProtectedRoute component to guard routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticated, loading } = useKeycloak();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
};

const App = () => {
  const [activeAgent, setActiveAgent] = React.useState('overview'); // State to manage active agent for header and sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const handleToggleCollapse = () => {
    console.log('handleToggleCollapse called. Before:', isSidebarCollapsed, 'After:', !isSidebarCollapsed);
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <KeycloakProvider>
            <div className="flex flex-col w-full h-screen bg-background text-foreground"> {/* Added w-full and h-screen */}
              <AppHeader companyName="EA AURA" onSelectAgent={setActiveAgent} />
              <div className="flex flex-grow overflow-hidden relative"> {/* Added overflow-hidden and relative for positioning toggle */}
                <Sidebar
                  activeAgent={activeAgent}
                  onSelectAgent={setActiveAgent}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={handleToggleCollapse}
                />
                {/* Removed the vertical divider and toggle button from here */}
                <main className="flex-grow overflow-auto">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Dashboard activeAgent={activeAgent} onSelectAgent={setActiveAgent} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard activeAgent={activeAgent} onSelectAgent={setActiveAgent} />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/business-vitality" element={<ProtectedRoute><BusinessVitality /></ProtectedRoute>} />
                    <Route path="/customer-analyzer" element={<ProtectedRoute><CustomerAnalyzer /></ProtectedRoute>} />
                    <Route path="/mission-alignment" element={<ProtectedRoute><MissionAlignment /></ProtectedRoute>} />
                    <Route path="/brand-index" element={<ProtectedRoute><BrandIndex /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                    <Route path="/data-analysis" element={<ProtectedRoute><DataAnalysis /></ProtectedRoute>} />
                    <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
              {/* Chatbot Launcher */}
              <ChatbotLauncher
                onOpen={() => console.log('Chatbot opened!')}
                onClose={() => console.log('Chatbot closed!')}
                onMessageSend={(msg) => console.log('Message sent:', msg)}
                // You can customize position and colors here:
                // position="bottom-left"
                // backgroundColor="#FF5733"
                // iconColor="#000000"
              />
            </div>
          </KeycloakProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;