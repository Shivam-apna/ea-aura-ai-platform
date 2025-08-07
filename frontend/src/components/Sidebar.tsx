import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LayoutDashboard, DollarSign, Users2, Target, Award, Settings, LogOut, ChevronLeft, Users, UploadCloud } from 'lucide-react'; // Added UploadCloud
import { useAuth } from '@/contexts/AuthContext';
import ProfileDisplay from './ProfileDisplay';
import { useKeycloakRoles } from '@/hooks/useKeycloakRoles';
import { useTheme } from '@/components/ThemeProvider'; // Import useTheme
// Removed: import { useKeycloak } from '@/components/Auth/KeycloakProvider'; // Import useKeycloak

interface SidebarProps {
  activeAgent: string;
  onSelectAgent: (agent: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Updated list of agents with required client roles and paths
const allAgents = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, path: '/dashboard', requiredRoles: ['user'] },
  { id: 'business-vitality', name: 'Business Vitality', icon: DollarSign, path: '/business-vitality', requiredRoles: ['user'] },
  { id: 'customer-analyzer', name: 'Customer Analysis', icon: Users2, path: '/customer-analyzer', requiredRoles: ['user'] },
  { id: 'mission-alignment', name: 'Mission Alignment', icon: Target, path: '/mission-alignment', requiredRoles: ['user'] },
  { id: 'brand-index', name: 'Brand Index', icon: Award, path: '/brand-index', requiredRoles: ['user'] },
  { id: 'settings', name: 'Settings', icon: Settings, path: '/settings', requiredRoles: ['admin'] },
  { id: 'users', name: 'Users', icon: Users, path: '/users', requiredRoles: ['admin'] },
  { id: 'upload-data', name: 'Upload Data', icon: UploadCloud, path: '/upload-data', requiredRoles: ['admin'] }, // New tab
];

const Sidebar: React.FC<SidebarProps> = ({ activeAgent, onSelectAgent, isCollapsed, onToggleCollapse }) => {
  const { isAuthenticated, loading: authLoading, logout } = useAuth(); // Destructure logout here
  const { clientRoles } = useKeycloakRoles(); // Removed 'loading' from destructuring
  // Removed: const { loading: keycloakLoading } = useKeycloak(); // Get loading from useKeycloak
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { theme } = useTheme(); // Get the current theme
  const isDark = theme === 'dark';

  useEffect(() => {
    console.log("Sidebar - Authenticated:", isAuthenticated, "Auth Loading:", authLoading, "Client Roles:", clientRoles); // Changed Keycloak Loading to Auth Loading
  }, [isAuthenticated, authLoading, clientRoles]); // Changed keycloakLoading to authLoading

  // Modified hasRequiredRole to implement stricter role-based visibility
  const hasRequiredRole = (required: string[], userRoles: string[]) => {
    if (!isAuthenticated || authLoading) return false; // Use authLoading here

    const isAdmin = userRoles.includes('admin');
    const isUser = userRoles.includes('user');

    // If the tab requires 'admin' and the user is an admin, show it.
    if (required.includes('admin') && isAdmin) {
      return true;
    }
    // If the tab requires 'user' AND the user is a user AND NOT an admin, show it.
    // This ensures that if a user has both roles, they only see admin tabs.
    if (required.includes('user') && isUser && !isAdmin) {
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

  // Don't render sidebar on login or landing page
  if (location.pathname === '/login' || location.pathname === '/landing') {
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

  // Determine if any of the non-dashboard routes are currently active
  const isNonDashboardRouteActive = ['/profile', '/settings', '/users', '/upload-data'].includes(location.pathname); // Added /upload-data

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
              // Determine active state for each button
              let isActive = false;
              if (['/settings', '/users', '/upload-data', '/profile'].includes(agent.path)) { // Added /upload-data and /profile
                isActive = location.pathname === agent.path;
              } else { // These are dashboard agents
                isActive = !isNonDashboardRouteActive && activeAgent === agent.id;
              }

              return (
                <Button
                  key={agent.id}
                  asChild
                  variant="ghost"
                  className={cn(
                    "w-full justify-start hover:bg-muted hover:text-foreground transition-all duration-200 h-8 text-sm",
                    isActive ? "bg-primary text-white hover:bg-primary hover:text-white shadow-md" : "text-foreground", // Changed text-primary-foreground to text-white
                    isCollapsed ? "justify-center px-0 rounded-xl" : "justify-start rounded-xl"
                  )}
                  onClick={() => {
                    // Only call onSelectAgent for dashboard-related agents
                    if (!['/settings', '/users', '/upload-data', '/profile'].includes(agent.path)) { // Added /upload-data and /profile
                      onSelectAgent(agent.id);
                    }
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
            ? "border-white text-white bg-card hover:bg-secondary" // White border/text, dark card background
            : "border-primary text-primary bg-background hover:bg-muted" // Primary border/text, light background
        )}
        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
      </Button>
    </div>
  );
};

export default Sidebar;