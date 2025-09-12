import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LayoutDashboard, DollarSign, Users2, Target, Award, Settings, LogOut, ChevronLeft, Users, UploadCloud, User as UserIcon } from 'lucide-react'; // Added UserIcon
import { useAuth } from '@/contexts/AuthContext';
import ProfileDisplay from './ProfileDisplay';
import { useKeycloakRoles } from '@/hooks/useKeycloakRoles';
import { useTheme } from '@/components/ThemeProvider'; // Import useTheme
import { allAgents } from '@/config/sidebar_agents'; // Import allAgents from new config file

interface SidebarProps {
  activeAgent: string;
  onSelectAgent: (agent: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeAgent, onSelectAgent, isCollapsed, onToggleCollapse }) => {
  const { isAuthenticated, loading: authLoading, logout, isLoggingOut } = useAuth(); // Destructure logout and isLoggingOut here
  const { clientRoles } = useKeycloakRoles(); // Removed 'loading' from destructuring
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { theme } = useTheme(); // Get the current theme
  const isDark = theme === 'dark';

  useEffect(() => {
   // Changed Keycloak Loading to Auth Loading
  }, [isAuthenticated, authLoading, clientRoles]); // Changed keycloakLoading to authLoading

  // Modified hasRequiredRole to implement proper role-based visibility
  const hasRequiredRole = (required: string[], userRoles: string[]) => {
    if (!isAuthenticated || authLoading) return false; // Use authLoading here

    // Convert all roles to lowercase for case-insensitive comparison
    const normalizedUserRoles = userRoles.map(role => role.toLowerCase());
    const normalizedRequiredRoles = required.map(role => role.toLowerCase());

    const isAdmin = normalizedUserRoles.includes('admin');
    const isUser = normalizedUserRoles.includes('user');

    // If the tab requires 'admin' and the user is an admin, show it.
    if (normalizedRequiredRoles.includes('admin') && isAdmin) {
      return true;
    }
    // If the tab requires 'user' and the user has user role, show it.
    // Admin users can also see user tabs (they have access to everything)
    if (normalizedRequiredRoles.includes('user') && isUser) {
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Don't render sidebar on login, landing page, or if logging out
  if (location.pathname === '/login' || location.pathname === '/landing' || isLoggingOut) {
    return null;
  }

  if (authLoading) { // Use authLoading here
    return (
      <div className={cn(
        "flex flex-col h-full bg-sidebar p-3 transition-all duration-300",
        isCollapsed ? "w-16" : "w-[200px] min-w-[200px] max-w-[200px] flex-shrink-0",
        "rounded-r-3xl items-center justify-center text-muted-foreground"
      )}>
        Loading...
      </div>
    );
  }

  const visibleAgents = allAgents.filter(agent => hasRequiredRole(agent.requiredRoles, clientRoles));

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar p-2 transition-all duration-300 shadow-lg",
        isCollapsed ? "w-16" : "w-[200px] min-w-[200px] max-w-[200px] flex-shrink-0",
        "rounded-r-3xl relative"
      )}
    >
      <div className="flex flex-col flex-grow">
        <ScrollArea className="flex-grow">
          <nav className="space-y-[20.16px]">
            {visibleAgents.map((agent) => {
              // An agent is active if its ID matches the activeAgent prop
              const isActive = activeAgent === agent.id;

              return (
                <Button
                  key={agent.id}
                  asChild
                  variant="ghost"
                  className={cn(
                    "w-full justify-start hover:bg-muted hover:text-foreground transition-all duration-200 h-8 text-sm",
                    isActive ? "bg-primary text-white hover:bg-primary hover:text-blue shadow-md" : "text-foreground",
                    isCollapsed ? "justify-center px-0 rounded-xl" : "justify-start rounded-xl"
                  )}
                  onClick={() => {
                    // Always call onSelectAgent to update the activeAgent state in AppLayout
                    onSelectAgent(agent.id);
                  }}
                >
                  <Link to={agent.path}>
                    <agent.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && agent.name}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
      {/* Profile Section at the bottom of the scrollable area */}
      {/* ProfileDisplay already handles its own active state based on location.pathname */}
      <ProfileDisplay isCollapsed={isCollapsed} />
      <div className="mt-auto pt-3">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-destructive hover:bg-destructive/20 hover:text-destructive transition-all duration-200 h-8 text-sm",
            isCollapsed ? "justify-center px-0 rounded-xl" : "justify-start rounded-xl"
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>

      {/* Sidebar Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleCollapse}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full h-9 w-9 shadow-lg",
          "flex items-center justify-center hover:scale-105 transition-all duration-200",
          "-right-4",
          isDark
            ? "border-white text-white bg-card hover:bg-secondary"
            : "border-primary text-primary bg-background hover:bg-muted"
        )}
        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
      </Button>
    </div>
  );
};

export default Sidebar;