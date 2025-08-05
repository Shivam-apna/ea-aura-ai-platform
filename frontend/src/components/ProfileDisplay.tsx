import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom'; // Import Link and useLocation

interface ProfileDisplayProps {
  isCollapsed: boolean;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ isCollapsed }) => {
  const { user } = useAuth();
  const location = useLocation(); // Get current location
  const userProfile = user;

  const userName = userProfile?.preferred_username || userProfile?.name || "Guest";
  // Removed userEmail as per previous request

  const isActive = location.pathname === '/profile'; // Check if current path is /profile

  return (
    <Link to="/profile" className={cn( // Wrap the entire div with Link
      "flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
      isCollapsed ? "justify-center" : "justify-start",
      "mt-2 hover:bg-muted cursor-pointer",
      isActive ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-md" : "text-foreground" // Apply active styling
    )}>
      <Avatar className={cn("h-8 w-8", isCollapsed && "h-7 w-7")}> {/* Adjusted avatar size for collapsed state */}
        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt={userName} />
        <AvatarFallback className="bg-primary text-primary-foreground">{userName.charAt(0)}</AvatarFallback> {/* Changed bg-blue-600 to bg-primary */}
      </Avatar>
      {!isCollapsed && (
        <div className="flex flex-col overflow-hidden">
          <p className="text-sm font-medium text-foreground truncate">{userName}</p>
        </div>
      )}
    </Link>
  );
};

export default ProfileDisplay;