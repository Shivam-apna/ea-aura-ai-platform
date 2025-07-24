import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useKeycloak } from '@/components/Auth/KeycloakProvider';
import { cn } from '@/lib/utils';

interface ProfileDisplayProps {
  isCollapsed: boolean;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ isCollapsed }) => {
  const { keycloak } = useKeycloak();
  const userProfile = keycloak?.tokenParsed;

  const userName = userProfile?.preferred_username || userProfile?.name || "Guest";
  const userEmail = userProfile?.email || "guest@example.com";

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
      isCollapsed ? "justify-center" : "justify-start",
      "mt-2" // Reduced margin from the nav items to mt-2
    )}>
      <Avatar className={cn("h-8 w-8", isCollapsed && "h-7 w-7")}> {/* Adjusted avatar size for collapsed state */}
        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt={userName} />
        <AvatarFallback className="bg-blue-600 text-white">{userName.charAt(0)}</AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <div className="flex flex-col overflow-hidden">
          <p className="text-sm font-medium text-foreground truncate">{userName}</p>
          {/* Removed email as per reference image */}
          {/* <p className="text-xs text-muted-foreground truncate">{userEmail}</p> */}
        </div>
      )}
    </div>
  );
};

export default ProfileDisplay;