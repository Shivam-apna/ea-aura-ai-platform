import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Briefcase, Fingerprint, Building, Home } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { useKeycloak } from '@/components/Auth/KeycloakProvider';

const Profile = () => {
  const { keycloak } = useKeycloak();
  const userProfile = keycloak?.tokenParsed;

  // Log all token parsed details to the console for verification
  useEffect(() => {
    if (userProfile) {
      console.log("Keycloak Token Parsed Details:", userProfile);
    }
  }, [userProfile]);

  const userName = userProfile?.preferred_username || userProfile?.name || "Guest User";
  const userEmail = userProfile?.email || "guest@example.com";
  const userRole = userProfile?.realm_access?.roles?.includes('admin') ? 'Admin' : 'User'; // Example role logic
  const userId = userProfile?.sub || "N/A"; // Keycloak 'sub' is typically the user ID
  const tenantId = (userProfile as any)?.tenant_id || "N/A"; // Assuming 'tenant_id' is a custom claim
  const organizationId = (userProfile as any)?.organization_id || "N/A"; // Assuming 'organization_id' is a custom claim

  // Mock company data - in a real app, this would come from your backend or Keycloak custom attributes
  const companyName = "Acme Corp";
  const department = "Engineering";
  const position = "Software Engineer";

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full">
      <HolographicCard className="col-span-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-600" /> User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt={userName} />
              <AvatarFallback className="text-4xl">{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
            <p className="text-gray-600">{userEmail}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId" className="text-gray-700 flex items-center gap-2 mb-2">
                <Fingerprint className="h-4 w-4" /> User ID
              </Label>
              <Input id="userId" type="text" value={userId} readOnly className="bg-white/50 border-blue-300/50 text-gray-900" />
            </div>
            <div>
              <Label htmlFor="tenantId" className="text-gray-700 flex items-center gap-2 mb-2">
                <Home className="h-4 w-4" /> Tenant ID
              </Label>
              <Input id="tenantId" type="text" value={tenantId} readOnly className="bg-white/50 border-blue-300/50 text-gray-900" />
            </div>
            <div>
              <Label htmlFor="organizationId" className="text-gray-700 flex items-center gap-2 mb-2">
                <Building className="h-4 w-4" /> Organization ID
              </Label>
              <Input id="organizationId" type="text" value={organizationId} readOnly className="bg-white/50 border-blue-300/50 text-gray-900" />
            </div>
            <div>
              <Label htmlFor="name" className="text-gray-700 flex items-center gap-2 mb-2">
                <UserIcon className="h-4 w-4" /> Name
              </Label>
              <Input id="name" type="text" value={userName} readOnly className="bg-white/50 border-blue-300/50 text-gray-900" />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-700 flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" /> Email
              </Label>
              <Input id="email" type="email" value={userEmail} readOnly className="bg-white/50 border-blue-300/50 text-gray-900" />
            </div>
            <div>
              <Label htmlFor="role" className="text-gray-700 flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4" /> Role
              </Label>
              <Input id="role" type="text" value={userRole} readOnly className="bg-white/50 border-blue-300/50 text-gray-900" />
            </div>
            <div>
              <Label htmlFor="companyName" className="text-gray-700 flex items-center gap-2 mb-2">
                <Building className="h-4 w-4" /> Company Name
              </Label>
              <Input id="companyName" type="text" value={companyName} readOnly className="bg-white/50 border-blue-300/50 text-gray-900" />
            </div>
            <div>
              <Label htmlFor="department" className="text-gray-700 flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4" /> Department
              </Label>
              <Input id="department" type="text" value={department} readOnly className="bg-white/50 border-blue-300/50 text-gray-900" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="position" className="text-gray-700 flex items-center gap-2 mb-2">
                <UserIcon className="h-4 w-4" /> Position
              </Label>
              <Input id="position" type="text" value={position} readOnly className="bg-white/50 border-blue-300/50 text-gray-900" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-200">Edit Profile</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
          </div>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Profile;