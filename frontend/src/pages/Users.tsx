import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users as UsersIcon, Building } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import OrganizationForm from '@/components/OrganizationForm';
import UserForm from '@/components/UserForm';
import { keycloakAdminService } from '@/services/keycloakAdminService';
import { toast } from 'sonner';

const Users = () => {
  const [activeTab, setActiveTab] = useState("organizations");
  const [isOrganizationFormOpen, setIsOrganizationFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);

  const handleAddOrganization = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('Creating organization:', data);
      
      // Call Keycloak Admin API to create organization
      await keycloakAdminService.createOrganization(data);
      
      console.log('Organization created successfully');
      toast.success('Organization created successfully!');
      setIsOrganizationFormOpen(false);
      
      // TODO: Refresh organizations list
      // await loadOrganizations();
      
    } catch (error) {
      console.error('Failed to create organization:', error);
      toast.error('Failed to create organization. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('Creating user:', data);
      
      // Call Keycloak Admin API to create user
      await keycloakAdminService.createUser(data);
      
      console.log('User created successfully');
      toast.success('User created successfully!');
      setIsUserFormOpen(false);
      
      // TODO: Refresh users list
      // await loadUsers();
      
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background">
      <HolographicCard className="col-span-full neumorphic-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-blue-400" /> User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex gap-6">
              {/* Vertical Tabs List */}
              <TabsList className="flex flex-col h-auto bg-transparent border-r border-border pr-6">
                <TabsTrigger 
                  value="organizations" 
                  className="flex items-center gap-2 justify-start w-full h-12 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Building className="h-4 w-4" />
                  Organizations
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 justify-start w-full h-12 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <UsersIcon className="h-4 w-4" />
                  Users
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <div className="flex-1">
                <TabsContent value="organizations" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Organizations</h3>
                      <Button 
                        className="flex items-center gap-2"
                        onClick={() => setIsOrganizationFormOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add Organization
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-8 text-center">
                      <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h4 className="text-lg font-medium mb-2">No Organizations</h4>
                      <p className="text-muted-foreground mb-4">
                        Create your first organization to get started
                      </p>
                      <Button onClick={() => setIsOrganizationFormOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Organization
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Users</h3>
                      <Button 
                        className="flex items-center gap-2"
                        onClick={() => setIsUserFormOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-8 text-center">
                      <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h4 className="text-lg font-medium mb-2">No Users</h4>
                      <p className="text-muted-foreground mb-4">
                        Add users to your organizations
                      </p>
                      <Button onClick={() => setIsUserFormOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </HolographicCard>
      
             {/* Organization Form Modal */}
       <OrganizationForm
         isOpen={isOrganizationFormOpen}
         onClose={() => setIsOrganizationFormOpen(false)}
         onSubmit={handleAddOrganization}
         isLoading={isLoading}
       />

             {/* User Form Modal */}
       <UserForm
         isOpen={isUserFormOpen}
         onClose={() => setIsUserFormOpen(false)}
         onSubmit={handleAddUser}
         isLoading={isLoading}
         organizations={organizations}
       />
    </div>
  );
};

export default Users;