import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useKeycloakRoles } from '@/hooks/useKeycloakRoles';
import { useTheme } from '@/components/ThemeProvider'; // Import useTheme

interface RoleAvatarProps {
  className?: string;
}

const RoleAvatar: React.FC<RoleAvatarProps> = ({ className }) => {
  const { user } = useAuth();
  const { clientRoles } = useKeycloakRoles();
  const { theme } = useTheme(); // Get current theme

  const userName = user?.preferred_username || user?.name || "Guest";
  const userRole = clientRoles.includes('admin') ? 'Admin' : 'User'; // Simple role logic

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold rounded-full">
        {userRole}
      </Badge>
      <Avatar className="h-9 w-9 border-2 border-primary"> {/* Changed border-blue-500 to border-primary */}
        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt={userName} />
        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base"> {/* Changed bg-blue-500 to bg-primary and text-white to text-primary-foreground */}
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default RoleAvatar;