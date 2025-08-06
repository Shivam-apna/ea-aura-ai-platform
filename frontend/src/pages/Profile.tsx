import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Briefcase, Fingerprint, Building, Home } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Profile = () => {
  const { user } = useAuth();
  const userProfile = user;
 const orgKeys = user && user.organization ? Object.keys(user.organization)[0] : "N/A";
  // Log all token parsed details to the console for verification
  useEffect(() => {
    if (userProfile) {
      console.log("Keycloak Token Parsed Details:", userProfile);
    }
  }, [userProfile]);
  const fullName = userProfile?.name?` ${userProfile.name}` : '';
  const userName = userProfile?.preferred_username || userProfile?.name || "Guest User";
  const userEmail = userProfile?.email || "guest@example.com";
  const userRole = userProfile?.realm_access?.roles?.includes('admin') ? 'Admin' : 'User'; // Example role logic
  const userId = userProfile?.sub || "N/A"; // Keycloak 'sub' is typically the user ID
  const tenantId = (userProfile as any)?.tenant_id || "N/A"; // Assuming 'tenant_id' is a custom claim
  const organizationId = orgKeys; // Assuming 'organization_id' is a custom claim

  // Mock company data - in a real app, this would come from your backend or Keycloak custom attributes
  const companyName = "Acme Corp";
  const department = "Engineering";
  const position = "Software Engineer";

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen flex flex-col items-center justify-center">
      <HolographicCard className="w-full neumorphic-card p-6 md:p-8 lg:p-10 flex flex-col items-center text-center">
        <CardHeader className="w-full flex flex-col items-center pb-6">
          <Avatar className="h-28 w-28 mb-4 border-4 border-primary shadow-lg">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt={userName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-foreground mb-2">
            {userName}
          </CardTitle>
          <p className="text-lg text-muted-foreground">{userEmail}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt={userName} />
              <AvatarFallback className="bg-primary text-primary-foreground">{userName.charAt(0)}</AvatarFallback> {/* Changed bg-blue-600 to bg-primary */}
            </Avatar>
            <h2 className="text-2xl font-bold text-foreground">{fullName}</h2>
            <p className="text-muted-foreground">{userEmail}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId" className="text-muted-foreground flex items-center gap-2 mb-2">
                <Fingerprint className="h-4 w-4" /> User ID
              </Label>
              <Input id="userId" type="text" value={userId} readOnly className="bg-input border-border text-foreground font-medium" />
            </div>
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-muted-foreground flex items-center gap-2 mb-1">
                <Building className="h-4 w-4 text-primary" /> Organization Name
              </Label>
              <Input id="organizationName" type="text" value={organizationName} readOnly className="bg-input border-border text-foreground font-medium" />
            </div>
            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-muted-foreground flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-primary" /> Role
              </Label>
              <Input id="name" type="text" value={fullName} readOnly className="bg-input border-border text-foreground" />
            </div>
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-muted-foreground flex items-center gap-2 mb-1">
                <Home className="h-4 w-4 text-primary" /> Company Name
              </Label>
              <Input id="companyName" type="text" value={companyName} readOnly className="bg-input border-border text-foreground font-medium" />
            </div>
            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="text-muted-foreground flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-primary" /> Department
              </Label>
              <Input id="department" type="text" value={department} readOnly className="bg-input border-border text-foreground font-medium" />
            </div>
            <div>
              <Label htmlFor="department" className="text-muted-foreground flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4" /> Department
              </Label>
              <Input id="department" type="text" value={department} readOnly className="bg-input border-border text-foreground" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="position" className="text-muted-foreground flex items-center gap-2 mb-2">
                <UserIcon className="h-4 w-4" /> Position
              </Label>
              <Input id="position" type="text" value={position} readOnly className="bg-input border-border text-foreground" />
            </div>
          </div>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Profile;