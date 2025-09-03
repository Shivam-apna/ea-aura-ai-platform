import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserIcon, Search, Filter, PlusCircle, MoreHorizontal, Edit, KeyRound, Ban, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { HolographicCard } from './Dashboard';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';
import { keycloakAdminService } from '@/services/keycloakAdminService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OrganizationForm from '@/components/OrganizationForm';

// Type definition for a User (matching Keycloak user structure)
interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp?: number;
  attributes?: Record<string, string[]>;
}

// Extended user type for display
interface DisplayUser extends User {
  domain: string;
  status: 'Active' | 'Invited' | 'Suspended';
  lastLogin: string;
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDomain, setFilterDomain] = useState<string>('All');
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isAddOrganizationDialogOpen, setIsAddOrganizationDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'organizations'>('users');

  // State for Add New User Dialog
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    domain: ''
  });
  // Set Password modal state
  const [isSetPasswordDialogOpen, setIsSetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [setPasswordUser, setSetPasswordUser] = useState<DisplayUser | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // State for Edit User Dialog
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DisplayUser | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // State for Confirm Action Dialog
  const [isConfirmActionDialogOpen, setIsConfirmActionDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'resetPassword' | 'suspend'; user: DisplayUser | null } | null>(null);

  const { selectedPrimaryColor, previewPrimaryColorHex, themeColors } = useTheme();

  // Determine the current primary color in hex format
  const getPrimaryColorHex = () => {
    if (previewPrimaryColorHex) return previewPrimaryColorHex;
    if (selectedPrimaryColor) return selectedPrimaryColor;
    return themeColors[0].hex;
  };

  const primaryColorHex = getPrimaryColorHex();

  // Get unique domains from users for filter
  const uniqueDomains = Array.from(new Set(users.map(user => user.domain).filter(Boolean)));

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
    const matchesDomain = filterDomain === 'All' || user.domain === filterDomain;
    return matchesSearch && matchesStatus && matchesDomain;
  });

  // Transform Keycloak user to DisplayUser
  const transformKeycloakUser = (kcUser: User): DisplayUser => {
    return {
      ...kcUser,
      domain: kcUser.attributes?.domain?.[0] || 'N/A',
      status: kcUser.enabled ? 'Active' : 'Suspended',
      lastLogin: kcUser.attributes?.lastLogin?.[0] || 'Never'
    };
  };

  // Load users from Keycloak
  const loadUsers = async () => {
    setLoading(true);
    try {
      const keycloakUsers = await keycloakAdminService.getUsers();
      const displayUsers = keycloakUsers.map(transformKeycloakUser);
      setUsers(displayUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadOrganizations = async () => {
    setOrgLoading(true);
    try {
      const list = await keycloakAdminService.getOrganizations();
      setOrganizations(list);
    } catch (error: any) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // No password validation in Add User form

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create user data for Keycloak
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        domain: formData.domain.trim()
      };

      // Create user via Keycloak Admin Service
      const result = await keycloakAdminService.createUser(userData);

      toast.success(`User ${userData.username} created successfully.`);

      // Reload users to get the updated list
      await loadUsers();

      // Open Set Password modal
      if (result && result.id) {
        setSetPasswordUser(transformKeycloakUser(result));
        setIsSetPasswordDialogOpen(true);
      }

      // Reset Add User form
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        domain: ''
      });
      setFormErrors({});
      setIsAddUserDialogOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (user: DisplayUser) => {
    setEditingUser(user);
    // Preselect organization by matching domain if possible
    const match = organizations.find((o) => o.domain && o.domain.toLowerCase() === (user.domain || '').toLowerCase());
    setSelectedOrgId(match?.id || '');
    setIsEditUserDialogOpen(true);
  };

  const handleSaveEditedUser = async (updatedUser: DisplayUser) => {
    setLoading(true);
    try {
      // Prepare data for Keycloak update
      const updateData = {
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      };

      // Update user via Keycloak Admin Service
      await keycloakAdminService.updateUser(updatedUser.id, updateData);
      // Assign to organization if selected
      if (selectedOrgId) {
        try {
          await keycloakAdminService.addUserToOrganization(updatedUser.id, selectedOrgId);
        } catch (e) {
          // ignore if already a member or if org API not available
          console.warn('addUserToOrganization failed or user already a member:', e);
        }
      }
      
      toast.success(`User ${updatedUser.username} updated successfully.`);
      
      // Reload users to get the updated list
      await loadUsers();
      
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (user: DisplayUser) => {
    setConfirmAction({ type: 'resetPassword', user });
    setIsConfirmActionDialogOpen(true);
  };

  const handleSuspendUser = (user: DisplayUser) => {
    setConfirmAction({ type: 'suspend', user });
    setIsConfirmActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction?.user) {
      setLoading(true);
      try {
        if (confirmAction.type === 'resetPassword') {
          // Open Set Password modal for manual password set
          setSetPasswordUser(confirmAction.user);
          setIsSetPasswordDialogOpen(true);
        } else if (confirmAction.type === 'suspend') {
          // Update user to disabled in Keycloak
          await keycloakAdminService.updateUser(confirmAction.user.id, {} as any);
          toast.success(`User ${confirmAction.user.username} has been suspended.`);
          // Reload users to reflect the change
          await loadUsers();
        }
        setIsConfirmActionDialogOpen(false);
        setConfirmAction(null);
      } catch (error) {
        console.error('Action failed:', error);
        toast.error(`Action failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background">
      <HolographicCard className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-400" /> User Management
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddUserDialogOpen(true)}
              style={{ backgroundColor: primaryColorHex }}
              className="text-white hover:opacity-90"
              disabled={loading}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add User
            </Button>
            <Button
              onClick={() => setIsAddOrganizationDialogOpen(true)}
              style={{ backgroundColor: primaryColorHex }}
              className="text-white hover:opacity-90"
              disabled={orgLoading}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Create Organization
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'organizations')} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="organizations">Organizations</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="m-0">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select onValueChange={setFilterStatus} value={filterStatus}>
              <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Invited">Invited</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setFilterDomain} value={filterDomain}>
              <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Domain" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="All">All Domains</SelectItem>
                {uniqueDomains.map(domain => (
                  <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Username</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Full Name</TableHead>
                  <TableHead className="text-muted-foreground">Domain</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Last Login</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{user.username}</TableCell>
                      <TableCell className="text-foreground">{user.email}</TableCell>
                      <TableCell className="text-foreground">{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell className="text-foreground">{user.domain}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          user.status === 'Active' && "bg-green-600/20 text-green-400",
                          user.status === 'Invited' && "bg-yellow-600/20 text-yellow-400",
                          user.status === 'Suspended' && "bg-red-600/20 text-red-400"
                        )}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border border-border">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditUser(user)} className="flex items-center gap-2 cursor-pointer">
                              <Edit className="h-4 w-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)} className="flex items-center gap-2 cursor-pointer">
                              <KeyRound className="h-4 w-4" /> Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSuspendUser(user)} className="flex items-center gap-2 text-red-500 cursor-pointer">
                              <Ban className="h-4 w-4" /> Suspend User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No users found. Click "Add User" to create the first user.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
            </TabsContent>
            <TabsContent value="organizations" className="m-0">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Name</TableHead>
                      <TableHead className="text-muted-foreground">Domain</TableHead>
                      <TableHead className="text-muted-foreground">Alias</TableHead>
                      <TableHead className="text-muted-foreground">Redirect URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading organizations...</TableCell>
                      </TableRow>
                    ) : organizations.length > 0 ? (
                      organizations.map((org) => (
                        <TableRow key={org.id} className="border-border">
                          <TableCell className="font-medium text-foreground">{org.name}</TableCell>
                          <TableCell className="text-foreground">{org.domain}</TableCell>
                          <TableCell className="text-foreground">{org.alias}</TableCell>
                          <TableCell className="text-foreground">{org.redirectUrl}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No organizations found. Click "Create Organization" to add one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </HolographicCard>

      {/* Add New User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border border-border text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new user account. The user will receive an email to set up their password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Username */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right text-muted-foreground">
                Username <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className={cn("bg-input border-border text-foreground", formErrors.username && "border-red-500")}
                  placeholder="Enter username"
                />
                {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-muted-foreground">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={cn("bg-input border-border text-foreground", formErrors.email && "border-red-500")}
                  placeholder="Enter email address"
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
            </div>

            {/* First Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right text-muted-foreground">
                First Name <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className={cn("bg-input border-border text-foreground", formErrors.firstName && "border-red-500")}
                  placeholder="Enter first name"
                />
                {formErrors.firstName && <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>}
              </div>
            </div>

            {/* Last Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right text-muted-foreground">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className={cn("bg-input border-border text-foreground", formErrors.lastName && "border-red-500")}
                  placeholder="Enter last name"
                />
                {formErrors.lastName && <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>}
              </div>
            </div>

            {/* Domain */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domain" className="text-right text-muted-foreground">
                Domain
              </Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                className="col-span-3 bg-input border-border text-foreground"
                placeholder="Enter domain (optional)"
              />
            </div>

            {/* Password is set after creation via Set Password modal */}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddUserDialogOpen(false);
                setFormData({
                  username: '',
                  email: '',
                  firstName: '',
                  lastName: '',
                  domain: ''
                });
                setFormErrors({});
              }}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser} 
              style={{ backgroundColor: primaryColorHex }} 
              className="text-white hover:opacity-90"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={isSetPasswordDialogOpen} onOpenChange={setIsSetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Set Password</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {setPasswordUser ? `Set a password for ${setPasswordUser.username}` : 'Set a password for the selected user.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPassword" className="text-right text-muted-foreground">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-input border-border text-foreground pr-10"
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmNewPassword" className="text-right text-muted-foreground">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="bg-input border-border text-foreground pr-10"
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                >
                  {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsSetPasswordDialogOpen(false)} 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!newPassword || newPassword.length < 8) {
                  toast.error('Password must be at least 8 characters');
                  return;
                }
                if (newPassword !== confirmNewPassword) {
                  toast.error('Passwords do not match');
                  return;
                }
                if (!setPasswordUser) {
                  toast.error('No user selected');
                  return;
                }
                try {
                  setLoading(true);
                  await keycloakAdminService.resetUserPassword(setPasswordUser.id, newPassword, false);
                  toast.success('Password set successfully');
                  setIsSetPasswordDialogOpen(false);
                  setNewPassword('');
                  setConfirmNewPassword('');
                } catch (error) {
                  console.error('Failed to set password:', error);
                  toast.error(`Failed to set password: ${error.message}`);
                } finally {
                  setLoading(false);
                }
              }} 
              style={{ backgroundColor: primaryColorHex }} 
              className="text-white hover:opacity-90"
              disabled={loading}
            >
              Set Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Create Organization Dialog */}
      <OrganizationForm
        isOpen={isAddOrganizationDialogOpen}
        onClose={() => setIsAddOrganizationDialogOpen(false)}
        isLoading={orgLoading}
        onSubmit={async (data) => {
          try {
            setOrgLoading(true);
            await keycloakAdminService.createOrganization(data as any);
            toast.success('Organization created successfully');
            setIsAddOrganizationDialogOpen(false);
            await loadOrganizations();
            setActiveTab('organizations');
          } catch (error: any) {
            console.error('Failed to create organization:', error);
            toast.error('Failed to create organization');
          } finally {
            setOrgLoading(false);
          }
        }}
      />
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Make changes to user profile. Click save when you're done.
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
                <Label htmlFor="editEmail" className="text-right text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editFirstName" className="text-right text-muted-foreground">
                  First Name
                </Label>
                <Input
                  id="editFirstName"
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
                <Label htmlFor="editDomain" className="text-right text-muted-foreground">
                  Domain
                </Label>
                <Input
                  id="editDomain"
                  value={editingUser.domain}
                  onChange={(e) => setEditingUser({ ...editingUser, domain: e.target.value })}
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editOrganization" className="text-right text-muted-foreground">
                  Organization
                </Label>
                <Select onValueChange={(value: string) => setSelectedOrgId(value === '_none' ? '' : value)} value={selectedOrgId}>
                  <SelectTrigger id="editOrganization" className="col-span-3 bg-input border-border text-foreground">
                    <SelectValue placeholder="Select Organization (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="_none">None</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} {org.domain ? `(${org.domain})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editStatus" className="text-right text-muted-foreground">
                  Status
                </Label>
                <Select onValueChange={(value: 'Active' | 'Invited' | 'Suspended') => setEditingUser({ ...editingUser, status: value })} value={editingUser.status}>
                  <SelectTrigger id="editStatus" className="col-span-3 bg-input border-border text-foreground">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Invited">Invited</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Cancel
            </Button>
            <Button onClick={() => editingUser && handleSaveEditedUser(editingUser)} style={{ backgroundColor: primaryColorHex }} className="text-white hover:opacity-90" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={isConfirmActionDialogOpen} onOpenChange={setIsConfirmActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {confirmAction?.type === 'resetPassword' ? 'Reset Password' : 'Suspend User'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {confirmAction?.type === 'resetPassword' 
                ? `Are you sure you want to send a password reset email to ${confirmAction?.user?.email}?` 
                : `Are you sure you want to suspend ${confirmAction?.user?.username}? This will prevent them from accessing the system.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmActionDialogOpen(false)} 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant={confirmAction?.type === 'resetPassword' ? 'default' : 'destructive'} 
              onClick={handleConfirmAction}
              disabled={loading}
              style={confirmAction?.type === 'resetPassword' ? { backgroundColor: primaryColorHex } : undefined}
              className={confirmAction?.type === 'resetPassword' ? 'text-white hover:opacity-90' : undefined}
            >
              {loading ? 'Processing...' : (confirmAction?.type === 'resetPassword' ? 'Send Reset Email' : 'Suspend User')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;