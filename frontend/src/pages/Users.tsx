import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users as UsersIcon, Building, RefreshCw } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import OrganizationForm from '@/components/OrganizationForm';
import UserForm from '@/components/UserForm';
import { keycloakAdminService } from '@/services/keycloakAdminService';
import { toast } from 'sonner';
import { authService } from '@/services/authService';

const Users = () => {
  const [activeTab, setActiveTab] = useState("organizations");
  const [isOrganizationFormOpen, setIsOrganizationFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ 
    id: string; 
    name: string; 
    alias?: string; 
    domain?: string; 
    description?: string; 
    redirectUrl?: string; 
    memberCount?: number;
  }>>([]);
  const [users, setUsers] = useState<Array<any>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [permissions, setPermissions] = useState<{ canManageOrganizations: boolean; canManageUsers: boolean }>({
    canManageOrganizations: false,
    canManageUsers: false
  });

  // Check user permissions on component mount
  React.useEffect(() => {
    const checkPermissions = async () => {
      try {
        const userPermissions = await keycloakAdminService.checkUserPermissions();
        setPermissions(userPermissions);
        
        // Debug: Log current user info
        const userInfo = await authService.getUserInfo();
        console.log('Current user:', userInfo);
        console.log('User permissions:', userPermissions);
      } catch (error) {
        console.error('Failed to check permissions:', error);
      }
    };
    checkPermissions();
  }, []);

  // Load organizations and users
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Load organizations
        const orgs = await keycloakAdminService.getOrganizations();
        
        // Load member counts for each organization
        const orgsWithMemberCounts = await Promise.all(
          orgs.map(async (org) => {
            try {
              const memberCount = await keycloakAdminService.getOrganizationMembersCount(org.id);
              return { ...org, memberCount };
            } catch (error) {
              console.error(`Failed to get member count for org ${org.id}:`, error);
              return { ...org, memberCount: 0 };
            }
          })
        );
        
        setOrganizations(orgsWithMemberCounts);
        console.log('Loaded organizations with member counts:', orgsWithMemberCounts);

        // Load users
        const userList = await keycloakAdminService.getUsers();
        setUsers(userList);
        console.log('Loaded users:', userList);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load organizations and users. Please try again.');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const refreshData = async () => {
    setIsLoadingData(true);
    try {
      // Load organizations
      const orgs = await keycloakAdminService.getOrganizations();
      
      // Load member counts for each organization
      const orgsWithMemberCounts = await Promise.all(
        orgs.map(async (org) => {
          try {
            const memberCount = await keycloakAdminService.getOrganizationMembersCount(org.id);
            return { ...org, memberCount };
          } catch (error) {
            console.error(`Failed to get member count for org ${org.id}:`, error);
            return { ...org, memberCount: 0 };
          }
        })
      );
      
      setOrganizations(orgsWithMemberCounts);

      // Load users
      const userList = await keycloakAdminService.getUsers();
      setUsers(userList);
      
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddOrganization = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('Creating organization:', data);
      
      // Check permissions first
      if (!permissions.canManageOrganizations) {
        toast.error('You do not have permission to create organizations. Please contact your administrator.');
        return;
      }
      
      // Call Keycloak Admin API to create organization
      const result = await keycloakAdminService.createOrganization(data);
      
      console.log('Organization created successfully:', result);
      toast.success(`Organization "${data.name}" created successfully!`);
      setIsOrganizationFormOpen(false);
      
      // Refresh organizations list
      const orgs = await keycloakAdminService.getOrganizations();
      
      // Load member counts for each organization
      const orgsWithMemberCounts = await Promise.all(
        orgs.map(async (org) => {
          try {
            const memberCount = await keycloakAdminService.getOrganizationMembersCount(org.id);
            return { ...org, memberCount };
          } catch (error) {
            console.error(`Failed to get member count for org ${org.id}:`, error);
            return { ...org, memberCount: 0 };
          }
        })
      );
      
      setOrganizations(orgsWithMemberCounts);
      
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      
      if (error.message?.includes('403')) {
        toast.error('Access denied. You do not have permission to create organizations. Please contact your administrator.');
      } else if (error.message?.includes('401')) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error('Failed to create organization. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('Creating user:', data);
      
      // Check permissions first
      if (!permissions.canManageUsers) {
        toast.error('You do not have permission to create users. Please contact your administrator.');
        return;
      }
      
      // Call Keycloak Admin API to create user
      const result = await keycloakAdminService.createUser(data);
      
      console.log('User created successfully:', result);
      
      if (data.organizationId) {
        toast.success(`User "${data.username}" created successfully and added to organization!`);
      } else {
        toast.success(`User "${data.username}" created successfully!`);
      }
      
      setIsUserFormOpen(false);
      
      // Refresh users list
      const userList = await keycloakAdminService.getUsers();
      setUsers(userList);
      
    } catch (error: any) {
      console.error('Failed to create user:', error);
      
      if (error.message?.includes('403')) {
        toast.error('Access denied. You do not have permission to create users. Please contact your administrator.');
      } else if (error.message?.includes('401')) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error('Failed to create user. Please try again.');
      }
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshData} 
              disabled={isLoadingData}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            </Button>
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
                        disabled={!permissions.canManageOrganizations}
                      >
                        <Plus className="h-4 w-4" />
                        Add Organization
                      </Button>
                    </div>
                    
                    {organizations.length > 0 ? (
                      <div className="grid gap-4">
                        {organizations.map((org) => (
                          <Card key={org.id} className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{org.name}</h4>
                                <p className="text-xs text-muted-foreground">ID: {org.id}</p>
                                {org.alias && org.alias !== org.name && (
                                  <p className="text-sm text-muted-foreground">Alias: {org.alias}</p>
                                )}
                                {org.domain && (
                                  <p className="text-sm text-muted-foreground">Domain: {org.domain}</p>
                                )}
                                {org.description && (
                                  <p className="text-sm text-muted-foreground">{org.description}</p>
                                )}
                                <p className="text-sm text-blue-600 font-medium">
                                  Members: {org.memberCount || 0}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive">
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : isLoadingData ? (
                      <div className="bg-muted/50 rounded-lg p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading organizations...</p>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-8 text-center">
                        <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">No Organizations</h4>
                        <p className="text-muted-foreground mb-4">
                          {permissions.canManageOrganizations 
                            ? 'Create your first organization to get started'
                            : 'You do not have permission to manage organizations'
                          }
                        </p>
                        <Button 
                          onClick={() => setIsOrganizationFormOpen(true)}
                          disabled={!permissions.canManageOrganizations}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Organization
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Users</h3>
                      <Button 
                        className="flex items-center gap-2"
                        onClick={() => setIsUserFormOpen(true)}
                        disabled={!permissions.canManageUsers}
                      >
                        <Plus className="h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                    
                    {users.length > 0 ? (
                      <div className="grid gap-4">
                        {users.map((user) => (
                          <Card key={user.id} className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{user.username}</h4>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <p className="text-sm text-muted-foreground">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Status: {user.enabled ? 'Active' : 'Inactive'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive">
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : isLoadingData ? (
                      <div className="bg-muted/50 rounded-lg p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading users...</p>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-8 text-center">
                        <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">No Users</h4>
                        <p className="text-muted-foreground mb-4">
                          {permissions.canManageUsers 
                            ? 'Add users to your organizations'
                            : 'You do not have permission to manage users'
                          }
                        </p>
                        <Button 
                          onClick={() => setIsUserFormOpen(true)}
                          disabled={!permissions.canManageUsers}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </div>
                    )}
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