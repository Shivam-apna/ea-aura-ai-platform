import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LayoutDashboard, DollarSign, Users2, Target, Award, FileText, Settings, LogOut, ChevronLeft, User as UserIcon, Users } from 'lucide-react';
import { useKeycloak } from '@/components/Auth/KeycloakProvider';
import ProfileDisplay from './ProfileDisplay';

interface SidebarProps {
  activeAgent: string;
  onSelectAgent: (agent: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Updated list of agents
const allAgents = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'business-vitality', name: 'Business Vitality', icon: DollarSign },
  { id: 'customer-analyzer', name: 'Customer Analysis', icon: Users2 },
  { id: 'mission-alignment', name: 'Mission Alignment', icon: Target },
  { id: 'brand-index', name: 'Brand Index', icon: Award },
  { id: 'reports', name: 'Reports', icon: FileText },
  { id: 'settings', name: 'Settings', icon: Settings },
  { id: 'profile', name: 'Profile', icon: UserIcon },
  { id: 'users', name: 'Users', icon: Users },
];

const Sidebar: React.FC<SidebarProps> = ({ activeAgent, onSelectAgent, isCollapsed, onToggleCollapse }) => {
  const { keycloak, authenticated, loading } = useKeycloak();

  const handleLogout = () => {
    if (keycloak) {
      keycloak.logout({ redirectUri: window.location.origin });
    }
  };

  return (
    <div
      className={cn(
        // Glassmorphism sidebar
        "flex flex-col h-full bg-white/60 backdrop-blur-xl border-r border-blue-100 p-3 transition-all duration-300",
        isCollapsed ? "w-16" : "w-[200px] min-w-[200px] max-w-[200px] flex-shrink-0",
        "rounded-r-3xl shadow-xl",
        "bg-gradient-to-b from-white/80 via-blue-50/60 to-green-50/60"
      )}
    >
      {/* Combined Overview and Collapse Button */}
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-between text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 h-8 text-sm mb-2",
          activeAgent === 'overview' && "bg-[#4AB1FF] text-white shadow-lg border border-[#4AB1FF] backdrop-blur-md",
          isCollapsed ? "justify-center px-0 rounded-xl" : "justify-between rounded-xl pr-2" // Adjust padding for expanded state
        )}
        onClick={() => {
          onSelectAgent('overview');
        }}
      >
        <div className="flex items-center">
          <LayoutDashboard className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Overview"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation(); // Prevent the parent button's onClick from firing
            onToggleCollapse();
          }}
          className={cn(
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            isCollapsed ? "h-7 w-7" : "h-7 w-7" // Smaller button for collapse icon
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
        </Button>
      </Button>

      <ScrollArea className="flex-grow">
        <nav className="space-y-1">
          {allAgents.filter(agent => agent.id !== 'overview').map((agent) => ( // Filter out overview
            <Button
              key={agent.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 h-8 text-sm",
                activeAgent === agent.id && "bg-[#4AB1FF] text-white shadow-lg border border-[#4AB1FF] backdrop-blur-md",
                isCollapsed ? "justify-center px-0 rounded-xl" : "justify-start rounded-xl"
              )}
              onClick={() => onSelectAgent(agent.id)}
            >
              <agent.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && agent.name}
            </Button>
          ))}
        </nav>
      </ScrollArea>
      {/* Profile Section at the bottom of the scrollable area */}
      <ProfileDisplay isCollapsed={isCollapsed} />
      <div className="mt-auto pt-3 border-t border-border/50">
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
    </div>
  );
};

export default Sidebar;