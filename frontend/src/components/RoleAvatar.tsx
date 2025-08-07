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
  const fullName = user?.name?` ${user.name}` : '';
  const getInitials = (fullName: string) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() || "";
  }
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
};
const initials = getInitials(fullName);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold rounded-full">
        {userRole}
      </Badge>
      <Avatar className={cn("h-8 w-8")}> {/* Adjusted avatar size for collapsed state */}
        {/* <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt={userName} /> */}
        <AvatarFallback className="w-full h-full flex items-center justify-center rounded-full text-blue-800 flex">
            {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default RoleAvatar;