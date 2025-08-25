import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Briefcase, Fingerprint, Building, Home } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const userProfile = user;
  const orgKeys = user && user.organization ? Object.keys(user.organization)[0] : "N/A";
  // Determine organization name
  let organizationName = "N/A";
  if (userProfile?.organization && typeof userProfile.organization === 'object') {
    const orgKeys = Object.keys(userProfile.organization);
    if (orgKeys.length > 0) {
      const firstOrgKey = orgKeys[0];
      if (userProfile.organization[firstOrgKey] && userProfile.organization[firstOrgKey].name) {
        organizationName = userProfile.organization[firstOrgKey].name;
      }
    }
  }

  // Log all token parsed details to the console for verification
  useEffect(() => {
    if (userProfile) {
      console.log("Keycloak Token Parsed Details:", userProfile);
    }
  }, [userProfile]);

  const fullName = userProfile?.name ? ` ${userProfile.name}` : '';
  const userName = userProfile?.preferred_username || userProfile?.name || "Guest User";
  const userEmail = userProfile?.email || "guest@example.com";
  const userRole = userProfile?.realm_access?.roles?.includes('admin') ? 'Admin' : 'User'; // Example role logic
  const userId = userProfile?.sub || "N/A"; // Keycloak 'sub' is typically the user ID
  const tenantId = (userProfile as any)?.tenant_id || "N/A"; // Assuming 'tenant_id' is a custom claim
  const organizationId = orgKeys; // Corrected: Use organizationName here
  const userDomain = userProfile?.domain || "NA"
  // Get initials from full name (first letter of first and last word)
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
const initials = getInitials(fullName); // "SS" for "Shivam Singh"
console.log("Initials:", initials); // Log initials for debugging
  // Mock company data - in a real app, this would come from your backend or Keycloak custom attributes
  const department = "Engineering";
  const position = "Software Engineer";

  return (
    <div className="p-2 grid-cols-1 gap-4 bg-background h-full flex flex-col"> {/* Apply background, h-full, and flex-col */}
      <HolographicCard className="col-span-full neumorphic-card flex-grow"> {/* Apply neumorphic styling and flex-grow */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" /> User Profile {/* Changed text-blue-400 to text-primary */}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24 rounded-full bg-primary text-primary-foreground text-4xl font-bold text-blue-500 flex items-center justify-center">
  <AvatarFallback className="w-full h-full flex items-center justify-center rounded-full">
    {initials}
  </AvatarFallback>
</Avatar>

            <h2 className="text-2xl font-bold text-foreground">{fullName}</h2>
            <p className="text-muted-foreground">{userEmail}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId" className="text-muted-foreground flex items-center gap-2 mb-2">
                <Fingerprint className="h-4 w-4" /> User ID
              </Label>
              <Input id="userId" type="text" value={userId} readOnly className="bg-input border-border text-foreground" />
            </div>
            <div>
              <Label htmlFor="organizationId" className="text-muted-foreground flex items-center gap-2 mb-2">
                <Building className="h-4 w-4" /> Organization Name
              </Label>
              <Input id="organizationId" type="text" value={organizationId} readOnly className="bg-input border-border text-foreground" />
            </div>
            <div>
              <Label htmlFor="name" className="text-muted-foreground flex items-center gap-2 mb-2">
                <UserIcon className="h-4 w-4" /> Name
              </Label>
              <Input id="role" type="text" value={fullName} readOnly className="bg-input border-border text-foreground" />
            </div>
            <div>
              <Label htmlFor="email" className="text-muted-foreground flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" /> Email
              </Label>
              <Input id="email" type="email" value={userEmail} readOnly className="bg-input border-border text-foreground" />
            </div>
            <div>
              <Label htmlFor="role" className="text-muted-foreground flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4" /> Role
              </Label>
              <Input id="role" type="text" value={userRole} readOnly className="bg-input border-border text-foreground" />
            </div>
            <div>
              <Label htmlFor="department" className="text-muted-foreground flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4" /> Domain
              </Label>
              <Input id="department" type="text" value={userDomain} readOnly className="bg-input border-border text-foreground" />
            </div>
            {/* <div className="md:col-span-2">
              <Label htmlFor="position" className="text-muted-foreground flex items-center gap-2 mb-2">
                <UserIcon className="h-4 w-4" /> Position
              </Label>
              <Input id="position" type="text" value={position} readOnly className="bg-input border-border text-foreground" />
            </div> */}
          </div>

          {/* <div className="flex justify-end gap-2">
            <Button variant="outline" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Edit Profile</Button>
            <Button variant="default">Save Changes</Button>
          </div> */}
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Profile;