import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserIcon, Search, Filter, UserPlus, Edit, Trash2, Building, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import UserForm from '@/components/UserForm';
import OrganizationForm from '@/components/OrganizationForm';
import { keycloakAdminService } from '@/services/keycloakAdminService';
import { useAuth } from '@/contexts/AuthContext';

// Type definition for a User displayed in the table
interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  // Organization-related properties
  companyName?: string;
  tenantId?: string;
  currentOrganizationId?: string;
  domain?: string; // Added domain
  location?: string;
  role: 'Admin' | 'User';
  status: 'Active' | 'Suspended';
  lastLogin: string;
}

// Type definition for data submitted from UserForm
interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  domain?: string; // Added domain
}

// Type definition for data submitted from OrganizationForm
interface OrganizationFormData {
  name: string;
  alias: string;
  domain: string;
  redirectUrl: string;
  description: string;
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterTenant, setFilterTenant] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);

  // Loading and error states
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Dialog states
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreateOrganizationDialogOpen, setIsCreateOrganizationDialogOpen] = useState(false);
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);
  
  // Edit User Dialog states
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [selectedEditOrganizationId, setSelectedEditOrganizationId] = useState<string>('');

  // Confirm Action Dialog states (only for suspend/delete now)
  const [isConfirmActionDialogOpen, setIsConfirmActionDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'suspend' | 'delete'; user: User | null } | null>(null);

  const { selectedPrimaryColor, previewPrimaryColorHex, themeColors } = useTheme();
  const { user: currentUser } = useAuth();

  const getPrimaryColorHex = () => {
    if (previewPrimaryColorHex) return previewPrimaryColorHex;
    if (selectedPrimaryColor) return selectedPrimaryColor;
    return themeColors[0].hex;
  };

  const primaryColorHex = getPrimaryColorHex();

  // Enhanced error handling function
  const handleApiError = (error: any, operation: string): string => {
    console.error(`Users.tsx: Error during ${operation}:`, error);
    
    if (error.message?.includes('401')) {
      return `Authentication failed during ${operation}. Please check your permissions and try again.`;
    } else if (error.message?.includes('403')) {
      return `Access denied during ${operation}. You may not have sufficient permissions.`;
    } else if (error.message?.includes('404')) {
      return `Resource not found during ${operation}. The organization or user may not exist.`;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return `Network error during ${operation}. Please check your connection.`;
    } else if (error.message?.includes('timeout')) {
      return `Request timeout during ${operation}. Please try again.`;
    } else {
      return `Failed to ${operation}: ${error.message || 'Unknown error occurred'}`;
    }
  };

  // Enhanced fetch function with Organizations API
  const fetchUsersAndOrganizations = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsFetchingUsers(true);
    }
    setFetchError(null);
    
    console.log("Users.tsx: Starting fetchUsersAndOrganizations using Organizations API...");
    
    try {
      // Clear any cached tokens on first fetch or after multiple failures
      if (retryCount > 0) {
        keycloakAdminService.clearTokens();
      }

      // Fetch users and organizations using Organizations API ONLY
      const [fetchedUsers, fetchedOrgs] = await Promise.all([
        keycloakAdminService.getUsers(),
        keycloakAdminService.getOrganizations() // Uses Organizations API
      ]);
      
      console.log("Users.tsx: Fetched Users (raw):", fetchedUsers);
      console.log("Users.tsx: Fetched Organizations (raw):", fetchedOrgs);

      // Build organization details map
      const orgDetailsMap = new Map<string, { name: string; domain: string; alias: string }>();
      fetchedOrgs.forEach((org: any) => {
        orgDetailsMap.set(org.id, {
          name: org.name,
          domain: org.domains?.[0]?.name || org.domain || 'N/A',
          alias: org.alias || org.name
        });
      });

      console.log("Users.tsx: Organization Details Map:", orgDetailsMap);

      // Map users to their organizations using Organizations API
      const userOrgMap = new Map<string, string>();

      // Fetch members for each organization using Organizations API
      for (const org of fetchedOrgs) {
        try {
          const members = await keycloakAdminService.getOrganizationMembers(org.id); // Uses Organizations API
          console.log(`Users.tsx: Members for org ${org.name} (${org.id}):`, members);
          
          members.forEach((member: any) => {
            if (!userOrgMap.has(member.id)) {
              userOrgMap.set(member.id, org.id);
            }
          });
        } catch (memberError) {
          console.warn(`Users.tsx: Failed to fetch members for organization ${org.name} (${org.id}):`, memberError);
          // Continue with other organizations even if one fails
        }
      }

      console.log("Users.tsx: User Organization Map:", userOrgMap);

      // Process users with organization information
      const processedUsers: User[] = fetchedUsers.map((user: any) => {
        const orgId = userOrgMap.get(user.id);
        const orgDetails = orgId ? orgDetailsMap.get(orgId) : undefined;

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          enabled: user.enabled !== false,
          companyName: orgDetails?.name || 'N/A',
          tenantId: orgId || 'none',
          currentOrganizationId: orgId || 'none',
          domain: user.attributes?.domain?.[0] || orgDetails?.domain || 'N/A', // Get domain from user attributes or org details
          location: 'N/A',
          role: user.realmRoles?.includes('admin') || user.realm_access?.roles?.includes('admin') ? 'Admin' : 'User',
          status: (user.enabled !== false) ? 'Active' : 'Suspended',
          lastLogin: 'N/A',
        };
      });

      console.log("Users.tsx: Processed Users (for table):", processedUsers);

      setUsers(processedUsers);
      setOrganizations(fetchedOrgs.map((org: any) => ({ id: org.id, name: org.name })));
      setRetryCount(0);
      setFetchError(null);

    } catch (error: any) {
      const errorMessage = handleApiError(error, 'load user data');
      setFetchError(errorMessage);
      
      if (error.message?.includes('401')) {
        toast.error('Authentication failed. Please check your permissions or try logging out and back in.');
      } else if (error.message?.includes('404') && error.message?.includes('organizations')) {
        toast.error('Organizations API not found. Please ensure Organizations feature is enabled in your Keycloak.');
      } else {
        toast.error(errorMessage);
      }
      
      setUsers([]);
      setOrganizations([]);
      setRetryCount(prev => prev + 1);
    } finally {
      if (showLoading) {
        setIsFetchingUsers(false);
      }
    }
  }, [retryCount]);

  useEffect(() => {
    fetchUsersAndOrganizations();
  }, [fetchUsersAndOrganizations]);

  // Retry function
  const handleRetry = () => {
    setRetryCount(0);
    fetchUsersAndOrganizations();
  };

  // Manual refresh function
  const handleRefresh = () => {
    toast.info('Refreshing user data...');
    fetchUsersAndOrganizations(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.domain || '').toLowerCase().includes(searchTerm.toLowerCase()); // Search by domain
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    const matchesTenant = filterTenant === 'All' || user.tenantId === filterTenant;
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesTenant && matchesStatus;
  });

  const handleCreateUser = async (data: UserFormData) => {
    setIsCreatingUser(true);
    try {
      const newUser = await keycloakAdminService.createUser(data);
      
      // Set permanent password immediately after user creation
      if (data.password) {
        await keycloakAdminService.resetUserPassword(newUser.id, data.password, false); // Set temporary to false
        toast.success(`User ${data.username} created and password set permanently.`);
      } else {
        toast.success(`User ${data.username} created successfully.`);
      }

      setIsCreateUserDialogOpen(false);
      await fetchUsersAndOrganizations(false);
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'create user');
      toast.error(errorMessage);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateOrganization = async (data: OrganizationFormData) => {
    setIsCreatingOrganization(true);
    try {
      const newOrg = await keycloakAdminService.createOrganization(data); // Uses Organizations API
      toast.success(`Organization "${data.name}" created successfully!`);
      setIsCreateOrganizationDialogOpen(false);

      // Try to assign current user to the new organization using Organizations API
      if (currentUser?.sub && newOrg?.id) {
        try {
          await keycloakAdminService.addUserToOrganization(currentUser.sub, newOrg.id); // Uses Organizations API
          toast.info(`You have been added as a member of "${data.name}".`);
        } catch (assignError: any) {
          console.error('Failed to add current user to new organization:', assignError);
          toast.warning(`Organization created, but failed to add you as a member: ${handleApiError(assignError, 'assign user to organization')}`);
        }
      }
      
      await fetchUsersAndOrganizations(false);
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'create organization');
      toast.error(errorMessage);
    } finally {
      setIsCreatingOrganization(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewPassword(''); // Clear password field on edit
    setShowNewPassword(false);
    setNewPasswordError(null);
    setSelectedEditOrganizationId(user.currentOrganizationId || 'none');
    setIsEditUserDialogOpen(true);
  };

  const handleSaveEditedUser = async () => {
    if (!editingUser) return;

    setIsUpdatingUser(true);
    setNewPasswordError(null);

    // Validate new password if provided
    if (newPassword.length > 0 && newPassword.length < 8) {
      setNewPasswordError('Password must be at least 8 characters');
      setIsUpdatingUser(false);
      return;
    }

    try {
      // Update basic user attributes
      const userUpdatePayload = {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        username: editingUser.username,
        enabled: editingUser.enabled,
        attributes: {
          domain: [editingUser.domain || ''] // Send domain as an array attribute
        }
      };
      await keycloakAdminService.updateUser(editingUser.id, userUpdatePayload);

      // Update password if provided (now always permanent)
      if (newPassword.length > 0) {
        await keycloakAdminService.resetUserPassword(editingUser.id, newPassword, false); // Set temporary to false
        toast.success(`Password for ${editingUser.username} updated permanently.`);
      }

      // Update organization membership using Organizations API ONLY
      if (selectedEditOrganizationId !== editingUser.currentOrganizationId) {
        console.log(`Users.tsx: Organization change detected: ${editingUser.currentOrganizationId} -> ${selectedEditOrganizationId}`);
        
        // Remove from old organization if user was in one
        if (editingUser.currentOrganizationId && editingUser.currentOrganizationId !== 'none') {
          console.log(`Users.tsx: Removing user from old organization: ${editingUser.currentOrganizationId}`);
          await keycloakAdminService.removeUserFromOrganization(editingUser.id, editingUser.currentOrganizationId); // Uses Organizations API
          toast.info(`User removed from old organization.`);
        }
        
        // Add to new organization if selected
        if (selectedEditOrganizationId !== 'none') {
          console.log(`Users.tsx: Adding user to new organization: ${selectedEditOrganizationId}`);
          await keycloakAdminService.addUserToOrganization(editingUser.id, selectedEditOrganizationId); // Uses Organizations API
          const assignedOrg = organizations.find(org => org.id === selectedEditOrganizationId);
          toast.success(`User assigned to "${assignedOrg?.name || 'organization'}".`);
        }
      }

      toast.success(`User ${editingUser.username} updated successfully.`);
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
      setNewPassword('');
      await fetchUsersAndOrganizations(false);

    } catch (error: any) {
      const errorMessage = handleApiError(error, 'update user');
      toast.error(errorMessage);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Removed handleResetPassword as it's now handled via edit dialog

  const handleSuspendUser = (user: User) => {
    setConfirmAction({ type: 'suspend', user });
    setIsConfirmActionDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setConfirmAction({ type: 'delete', user });
    setIsConfirmActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction?.user) {
      try {
        if (confirmAction.type === 'suspend') {
          await keycloakAdminService.suspendUser(confirmAction.user.id);
          setUsers(prev => prev.map(u => (u.id === confirmAction.user?.id ? { ...u, status: 'Suspended', enabled: false } : u)));
          toast.success(`User ${confirmAction.user.username} has been suspended.`);
          setIsConfirmActionDialogOpen(false);
          setConfirmAction(null);
        } else if (confirmAction.type === 'delete') {
          await keycloakAdminService.deleteUser(confirmAction.user.id);
          setUsers(prev => prev.filter(u => u.id !== confirmAction.user?.id));
          toast.success(`User ${confirmAction.user.username} has been deleted.`);
          setIsConfirmActionDialogOpen(false);
          setConfirmAction(null);
        }
      } catch (error: any) {
        const errorMessage = handleApiError(error, `${confirmAction.type} user`);
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background">
      <HolographicCard className="col-span-full neumorphic-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-400" /> User Management (Organizations API)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-muted"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateUserDialogOpen(true)}
              style={{ backgroundColor: primaryColorHex }}
              className="text-white hover:opacity-90"
              disabled={!!fetchError}
            >
              <UserPlus className="h-4 w-4 mr-2" /> Create New User
            </Button>
            <Button
              onClick={() => setIsCreateOrganizationDialogOpen(true)}
              style={{ backgroundColor: primaryColorHex }}
              className="text-white hover:opacity-90"
              disabled={!!fetchError}
            >
              <Building className="h-4 w-4 mr-2" /> Create Organization
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error display */}
          {fetchError && (
            <div className="mb-4 p-4 border border-destructive/20 bg-destructive/10 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-destructive font-medium">Failed to load data</p>
                <p className="text-destructive/80 text-sm">{fetchError}</p>
                {fetchError.includes('Organizations API') && (
                  <p className="text-destructive/80 text-sm mt-1">
                    Please ensure Organizations feature is enabled in Keycloak (requires Keycloak 22+)
                  </p>
                )}
              </div>
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Search and filter controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
                disabled={isFetchingUsers}
              />
            </div>
            <Select onValueChange={setFilterRole} value={filterRole} disabled={isFetchingUsers}>
              <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                <SelectItem value="All" className="focus:bg-accent focus:text-accent-foreground">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setFilterStatus} value={filterStatus} disabled={isFetchingUsers}>
              <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setFilterTenant} value={filterTenant} disabled={isFetchingUsers}>
              <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Organization" />
              </SelectTrigger>
              <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                <SelectItem value="All">All Organizations</SelectItem>
                {Array.from(new Set(users.map(user => user.tenantId || 'none'))).map(tenant => (
                  <SelectItem key={tenant} value={tenant}>
                    {tenant === 'none' ? 'No Organization' : 
                     organizations.find(org => org.id === tenant)?.name || tenant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-auto max-h-[calc(100vh-300px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Username</TableHead>
                  <TableHead className="text-muted-foreground">Full Name</TableHead>
                  <TableHead className="text-muted-foreground">Email ID</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Organization</TableHead>
                  <TableHead className="text-muted-foreground">Domain</TableHead> {/* New TableHead for Domain */}
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetchingUsers ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground"> {/* Updated colSpan */}
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading users via Organizations API...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : fetchError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground"> {/* Updated colSpan */}
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                        <span>Failed to load user data</span>
                        <Button onClick={handleRetry} size="sm" variant="outline">
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{user.username}</TableCell>
                      <TableCell className="font-medium text-foreground">{user.firstName} {user.lastName}</TableCell>
                      <TableCell className="text-foreground">{user.email}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          user.role === 'Admin' && "bg-blue-600/20 text-blue-400",
                          user.role === 'User' && "bg-purple-600/20 text-purple-400"
                        )}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground">{user.companyName || 'N/A'}</TableCell>
                      <TableCell className="text-foreground">{user.domain || 'N/A'}</TableCell> {/* New TableCell for Domain */}
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          user.status === 'Active' && "bg-green-600/20 text-green-400",
                          user.status === 'Suspended' && "bg-red-600/20 text-red-400"
                        )}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-muted"
                            onClick={() => handleEditUser(user)}
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUser(user)}
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground"> {/* Updated colSpan */}
                      No users found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </HolographicCard>

      {/* All your existing dialogs remain the same... */}
      <UserForm
        isOpen={isCreateUserDialogOpen}
        onClose={() => setIsCreateUserDialogOpen(false)}
        onSubmit={handleCreateUser}
        isLoading={isCreatingUser}
        organizations={organizations}
      />

      <OrganizationForm
        isOpen={isCreateOrganizationDialogOpen}
        onClose={() => setIsCreateOrganizationDialogOpen(false)}
        onSubmit={handleCreateOrganization}
        isLoading={isCreatingOrganization}
      />

      {/* Edit User Dialog - Same as before */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px] neumorphic-card border border-border text-foreground bg-card">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit User (Organizations API)</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Make changes to user profile and organization membership. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editUsername" className="text-right text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="editUsername"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editFullName" className="text-right text-muted-foreground">
                  First Name
                </Label>
                <Input
                  id="editFullName"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editLastName" className="text-right text-muted-foreground">
                  Last Name
                </Label>
                <Input
                  id="editLastName"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editEmail" className="text-right text-muted-foreground">
                  Email ID
                </Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="col-span-3 bg-input border-border text-foreground"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDomain" className="text-right text-muted-foreground">
                  Domain
                </Label>
                <Input
                  id="editDomain"
                  value={editingUser.domain || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, domain: e.target.value })}
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newPassword" className="text-right text-muted-foreground">
                  New Password
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setNewPasswordError(null);
                    }}
                    placeholder="Leave blank to keep current"
                    className={cn("pr-10", newPasswordError && 'border-red-500')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
                {newPasswordError && (
                  <p className="col-span-4 text-sm text-red-500 text-right">{newPasswordError}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editOrganization" className="text-right text-muted-foreground">
                  Organization
                </Label>
                <Select onValueChange={setSelectedEditOrganizationId} value={selectedEditOrganizationId}>
                  <SelectTrigger id="editOrganization" className="col-span-3 bg-input border-border text-foreground">
                    <SelectValue placeholder="Select Organization" />
                  </SelectTrigger>
                  <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                    <SelectItem value="none">No Organization</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editStatus" className="text-right text-muted-foreground">
                  Status
                </Label>
                <Select onValueChange={(value: 'Active' | 'Suspended') => setEditingUser({ ...editingUser, status: value, enabled: value === 'Active' })} value={editingUser.status}>
                  <SelectTrigger id="editStatus" className="col-span-3 bg-input border-border text-foreground">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveEditedUser} 
              style={{ backgroundColor: primaryColorHex }} 
              className="text-white hover:opacity-90"
              disabled={isUpdatingUser}
            >
              {isUpdatingUser ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog - Same as before */}
      <Dialog open={isConfirmActionDialogOpen} onOpenChange={setIsConfirmActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px] neumorphic-card border border-border text-foreground bg-card">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {confirmAction?.type === 'suspend' ? 'Suspend User' : 'Delete User'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to {confirmAction?.type === 'suspend' ? 'suspend' : 'delete'} {confirmAction?.user?.username}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConfirmActionDialogOpen(false)} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Cancel
            </Button>
            <Button variant={confirmAction?.type === 'delete' ? 'destructive' : 'default'} onClick={handleConfirmAction}>
              {confirmAction?.type === 'suspend' ? 'Suspend' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;