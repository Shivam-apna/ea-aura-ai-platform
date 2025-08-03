import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users as UsersIcon, Building } from 'lucide-react';

const Users = () => {
  const [activeTab, setActiveTab] = useState("organizations");
  const [isOrganizationFormOpen, setIsOrganizationFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddOrganization = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('Creating organization:', data);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Organization created successfully');
      setIsOrganizationFormOpen(false);
      
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('Creating user:', data);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('User created successfully');
      setIsUserFormOpen(false);
      
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background">
      <Card className="col-span-full">
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
      </Card>
      
      {/* Simple Modal Placeholder */}
      {isOrganizationFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Organization</h3>
            <p className="text-sm text-gray-600 mb-4">
              Organization form will be implemented here.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsOrganizationFormOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsOrganizationFormOpen(false)}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {isUserFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add User</h3>
            <p className="text-sm text-gray-600 mb-4">
              User form will be implemented here.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsUserFormOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsUserFormOpen(false)}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;