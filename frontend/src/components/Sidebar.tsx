import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LayoutDashboard, BarChart2, Shield, FileText, Settings, Users, ChevronLeft, DollarSign, Users2, Target, Award, LogOut } from 'lucide-react';
import { useKeycloak } from '@/components/Auth/KeycloakProvider'; // Import useKeycloak

interface SidebarProps {
  activeAgent: string;
  onSelectAgent: (agent: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const agents = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'business-vitality', name: 'Business Vitality', icon: DollarSign },
  { id: 'customer-analyzer', name: 'Customer Analyzer', icon: Users2 },
  { id: 'mission-alignment', name: 'Mission Alignment', icon: Target },
  { id: 'brand-index', name: 'Brand Index', icon: Award },
  { id: 'data-analysis', name: 'Data Analysis', icon: BarChart2 },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'reports', name: 'Reports', icon: FileText },
  { id: 'settings', name: 'Settings', icon: Settings },
  { id: 'users', name: 'Users', icon: Users },
];

const Sidebar: React.FC<SidebarProps> = ({ activeAgent, onSelectAgent, isCollapsed, onToggleCollapse }) => {
  const { keycloak } = useKeycloak(); // Get the keycloak instance

  const handleLogout = () => {
    if (keycloak) {
      keycloak.logout({ redirectUri: window.location.origin }); // Redirect to the app's root after logout
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        {!isCollapsed && <div className="text-xl font-bold text-sidebar-primary">Agents</div>}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed ? "mx-auto" : "ml-auto"
          )}
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
        </Button>
      </div>
      <ScrollArea className="flex-grow">
        <nav className="space-y-2">
          {agents.map((agent) => (
            <Button
              key={agent.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                activeAgent === agent.id && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                isCollapsed ? "justify-center px-0" : "justify-start"
              )}
              onClick={() => onSelectAgent(agent.id)}
            >
              <agent.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && agent.name}
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-500 hover:bg-red-100 hover:text-red-600",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;