import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LayoutDashboard, DollarSign, Users2, Target, Award, Settings, LogOut, ChevronLeft, User as UserIcon, Users, BarChart, Shield, FileText } from 'lucide-react'; // Added missing icons
import { useKeycloak } from '@/components/Auth/KeycloakProvider';
import ProfileDisplay from './ProfileDisplay';
import { useKeycloakRoles } from '@/hooks/useKeycloakRoles'; // Import the new hook

interface SidebarProps {
  activeAgent: string;
  onSelectAgent: (agent: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Updated list of agents with required client roles
const allAgents = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, requiredRoles: ['admin', 'user'] },
  { id: 'business-vitality', name: 'Business Vitality', icon: DollarSign, requiredRoles: ['admin', 'user'] },
  { id: 'customer-analyzer', name: 'Customer Analysis', icon: Users2, requiredRoles: ['admin', 'user'] },
  { id: 'mission-alignment', name: 'Mission Alignment', icon: Target, requiredRoles: ['admin', 'user'] },
  { id: 'brand-index', name: 'Brand Index', icon: Award, requiredRoles: ['admin', 'user'] },
  // Removed Security tab as requested
  { id: 'settings', name: 'Settings', icon: Settings, requiredRoles: ['admin'] },
  { id: 'users', name: 'Users', icon: Users, requiredRoles: ['admin'] },
];

const Sidebar: React.FC<SidebarProps> = ({ activeAgent, onSelectAgent, isCollapsed, onToggleCollapse }) => {
  const { keycloak, authenticated, loading } = useKeycloak();
  const { clientRoles } = useKeycloakRoles(); // Use the new hook

  // Debugging log for clientRoles and authentication status
  useEffect(() => {
    console.log("Sidebar - Current clientRoles:", clientRoles);
    console.log("Sidebar - Authenticated:", authenticated);
    console.log("Sidebar Roles Received:", clientRoles); // New log as requested
  }, [clientRoles, authenticated]);

  // Function to check if user has any of the required roles
  const hasRequiredRole = (required: string[]) => {
    if (!authenticated) return false; // If not authenticated, hide all

    // If no specific roles are required for the tab, show it if authenticated.
    if (!required || required.length === 0) return true;

    // Check if the user has *any* of the required roles.
    return required.some(role => clientRoles.includes(role));
  };

  const handleLogout = () => {
    if (keycloak) {
      keycloak.logout({ redirectUri: window.location.origin });
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "flex flex-col h-full bg-background p-3 transition-all duration-300",
        isCollapsed ? "w-16" : "w-[200px] min-w-[200px] max-w-[200px] flex-shrink-0",
        "rounded-r-3xl items-center justify-center text-muted-foreground"
      )}>
        Loading...
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background p-3 transition-all duration-300 shadow-lg", // Added shadow-lg
        isCollapsed ? "w-16" : "w-[200px] min-w-[200px] max-w-[200px] flex-shrink-0",
        "rounded-r-3xl relative" // Added relative for absolute positioning of the button
      )}
    >
      <div className="flex flex-col flex-grow"> {/* Removed space-y from here */}
        <ScrollArea className="flex-grow">
          <nav className="space-y-[20.16px]"> {/* Apply space-y here */}
            {allAgents
              .filter(agent => hasRequiredRole(agent.requiredRoles))
              .map((agent) => (
                <Button
                  key={agent.id}
                  asChild // Use asChild to render Link component directly
                  variant="ghost"
                  className={cn(
                    "w-full justify-start hover:bg-muted hover:text-foreground transition-all duration-200 h-8 text-sm",
                    activeAgent === agent.id ? "bg-primary text-white hover:bg-primary hover:text-white shadow-md" : "text-black",
                    isCollapsed ? "justify-center px-0 rounded-xl" : "justify-start rounded-xl"
                  )}
                  onClick={() => onSelectAgent(agent.id)}
                >
                  <Link to={`/${agent.id === 'overview' ? 'dashboard' : agent.id}`}> {/* Link to /dashboard for overview */}
                    <agent.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && agent.name}
                  </Link>
                </Button>
              ))}
          </nav>
        </ScrollArea>
      </div>
      {/* Profile Section at the bottom of the scrollable area */}
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
          "absolute top-1/2 -translate-y-1/2 rounded-full h-9 w-9 border border-primary shadow-lg", // Increased size to h-9 w-9
          "flex items-center justify-center text-primary bg-background hover:bg-muted hover:scale-105 transition-all duration-200", // Added bg-background, hover scale
          "-right-4" // Position it consistently
        )}
        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", isCollapsed && "rotate-180")} /> {/* Increased icon size */}
      </Button>
    </div>
  );
};

export default Sidebar;