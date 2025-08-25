import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserIcon, Search, Filter, PlusCircle, MoreHorizontal, Edit, KeyRound, Ban } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { getApiEndpoint } from '@/config/environment'; // Import getApiEndpoint
import { authService } from '@/services/authService'; // Import authService

// Type definition for a User
interface User {
  id: string;
  companyName: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'User';
  tenantId: string;
  domain: string;
  location: string;
  status: 'Active' | 'Invited' | 'Suspended';
  lastLogin: string;
}

// Mock data for users - keeping the same for now, but will be replaced with API calls
const mockUsers: User[] = [
  { id: 'user-001', companyName: 'Innovate Inc.', fullName: 'Alice Smith', email: 'alice.s@example.com', role: 'Admin', tenantId: 'T-1A2B', domain: 'SaaS', location: 'New York, USA', status: 'Active', lastLogin: '2024-07-29 10:30 AM' },
  { id: 'user-002', companyName: 'Innovate Inc.', fullName: 'Bob Johnson', email: 'bob.j@example.com', role: 'User', tenantId: 'T-1A2B', domain: 'Fintech', location: 'London, UK', status: 'Active', lastLogin: '2024-07-28 03:15 PM' },
  { id: 'user-003', companyName: 'Data Corp.', fullName: 'Charlie Brown', email: 'charlie.b@example.com', role: 'User', tenantId: 'T-3C4D', domain: 'N/A', location: 'San Francisco, USA', status: 'Active', lastLogin: '2024-07-29 09:00 AM' },
  { id: 'user-004', companyName: 'Data Corp.', fullName: 'Diana Prince', email: 'diana.p@example.com', role: 'Admin', tenantId: 'T-3C4D', domain: 'Healthcare', location: 'Toronto, Canada', status: 'Suspended', lastLogin: '2024-07-20 11:00 AM' },
  { id: 'user-005', companyName: 'Innovate Inc.', fullName: 'Eve Adams', email: 'eve.a@example.com', role: 'User', tenantId: 'T-1A2B', domain: 'N/A', location: 'Berlin, Germany', status: 'Active', lastLogin: '2024-07-29 01:00 PM' },
  { id: 'user-006', companyName: 'Innovate Inc.', fullName: 'Frank White', email: 'frank.w@example.com', role: 'User', tenantId: 'T-1A2B', domain: 'Fintech', location: 'London, UK', status: 'Invited', lastLogin: 'N/A' },
  { id: 'user-007', companyName: 'Data Corp.', fullName: 'Grace Lee', email: 'grace.l@example.com', role: 'Admin', tenantId: 'T-3C4D', domain: 'SaaS', location: 'New York, USA', status: 'Active', lastLogin: '2024-07-29 08:45 AM' },
  { id: 'user-008', companyName: 'Innovate Inc.', fullName: 'Henry King', email: 'henry.k@example.com', role: 'User', tenantId: 'T-1A2B', domain: 'Healthcare', location: 'Toronto, Canada', status: 'Suspended', lastLogin: '2024-07-15 02:00 PM' },
];

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterTenant, setFilterTenant] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // State for Invite New User Dialog
  const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'User'>('User');
  const [inviteCompanyName, setInviteCompanyName] = useState('');
  const [inviteTenantId, setInviteTenantId] = useState('');
  const [inviteDomain, setInviteDomain] = useState('');
  const [inviteLocation, setInviteLocation] = useState('');

  // State for Edit User Dialog
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // State for Confirm Action Dialog
  const [isConfirmActionDialogOpen, setIsConfirmActionDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'resetPassword' | 'suspend'; user: User | null } | null>(null);

  const { selectedPrimaryColor, previewPrimaryColorHex, themeColors } = useTheme();

  // Load users from Keycloak API on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Call API using your specified pattern
      const response = await fetch(getApiEndpoint("/v1/keycloak/users"), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authService.getAccessToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`Get users failed: ${response.status}`);
      }

      const keycloakUsers = await response.json();
      
      // Transform Keycloak user format to our User interface
      const transformedUsers: User[] = keycloakUsers.map(keycloakUser => ({
        id: keycloakUser.id,
        companyName: keycloakUser.attributes?.companyName?.[0] || 'N/A',
        fullName: `${keycloakUser.firstName || ''} ${keycloakUser.lastName || ''}`.trim() || keycloakUser.username,
        email: keycloakUser.email || 'N/A',
        role: keycloakUser.attributes?.role?.[0] === 'Admin' ? 'Admin' : 'User',
        tenantId: keycloakUser.attributes?.tenantId?.[0] || 'N/A',
        domain: keycloakUser.attributes?.domain?.[0] || 'N/A',
        location: keycloakUser.attributes?.location?.[0] || 'N/A',
        status: keycloakUser.enabled ? 'Active' : 'Suspended',
        lastLogin: keycloakUser.attributes?.lastLogin?.[0] || 'N/A'
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users from Keycloak');
      // Fallback to mock data if API fails
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique values for filters
  const uniqueTenants = Array.from(new Set(users.map(user => user.tenantId)));
  const uniqueDomains = Array.from(new Set(users.map(user => user.domain)));
  const uniqueCompanyNames = Array.from(new Set(users.map(user => user.companyName)));

  // Determine the current primary color in hex format
  const getPrimaryColorHex = () => {
    if (previewPrimaryColorHex) return previewPrimaryColorHex;
    if (selectedPrimaryColor) return selectedPrimaryColor;
    return themeColors[0].hex;
  };

  const primaryColorHex = getPrimaryColorHex();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    const matchesTenant = filterTenant === 'All' || user.tenantId === filterTenant;
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesTenant && matchesStatus;
  });

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Email is required to invite a user.");
      return;
    }

    try {
      const userData = {
        username: inviteEmail.split('@')[0],
        email: inviteEmail.trim(),
        firstName: inviteName.split(' ')[0] || '',
        lastName: inviteName.split(' ').slice(1).join(' ') || '',
        enabled: true,
        emailVerified: false,
        attributes: {
          companyName: [inviteCompanyName || ''],
          role: [inviteRole],
          tenantId: [inviteTenantId || ''],
          domain: [inviteDomain || ''],
          location: [inviteLocation || '']
        }
      };

      // Call API using your specified pattern
      const response = await fetch(getApiEndpoint("/v1/keycloak/users"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`User creation failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Reload users list
      await loadUsers();
      
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setIsInviteUserDialogOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('User');
      setInviteCompanyName('');
      setInviteTenantId('');
      setInviteDomain('');
      setInviteLocation('');
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user. Please try again.');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleSaveEditedUser = async (updatedUser: User) => {
    try {
      const userData = {
        firstName: updatedUser.fullName.split(' ')[0] || '',
        lastName: updatedUser.fullName.split(' ').slice(1).join(' ') || '',
        email: updatedUser.email,
        enabled: updatedUser.status === 'Active',
        attributes: {
          companyName: [updatedUser.companyName],
          role: [updatedUser.role],
          tenantId: [updatedUser.tenantId],
          domain: [updatedUser.domain],
          location: [updatedUser.location]
        }
      };

      // Call API using your specified pattern
      const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${updatedUser.id}`), {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Update user failed: ${response.status}`);
      }
      
      // Reload users list
      await loadUsers();
      
      toast.success(`User ${updatedUser.fullName} updated successfully.`);
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user. Please try again.');
    }
  };

  const handleResetPassword = (user: User) => {
    setConfirmAction({ type: 'resetPassword', user });
    setIsConfirmActionDialogOpen(true);
  };

  const handleSuspendUser = (user: User) => {
    setConfirmAction({ type: 'suspend', user });
    setIsConfirmActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction?.user) {
      try {
        if (confirmAction.type === 'resetPassword') {
          // Generate a temporary password
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
          let password = '';
          for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
          }

          const passwordData = {
            type: 'password',
            temporary: true,
            value: password
          };

          // Call API using your specified pattern
          const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${confirmAction.user.id}/reset-password`), {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authService.getAccessToken()}`
            },
            body: JSON.stringify(passwordData),
          });

          if (!response.ok) {
            throw new Error(`Reset password failed: ${response.status}`);
          }

          toast.success(`Password for ${confirmAction.user.fullName} has been reset.`);
          setIsConfirmActionDialogOpen(false);
          setConfirmAction(null);
        } else if (confirmAction.type === 'suspend') {
          const userData = {
            enabled: false
          };

          // Call API using your specified pattern
          const response = await fetch(getApiEndpoint(`/v1/keycloak/users/${confirmAction.user.id}`), {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authService.getAccessToken()}`
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            throw new Error(`Suspend user failed: ${response.status}`);
          }
          
          // Reload users list
          await loadUsers();
          
          toast.success(`User ${confirmAction.user.fullName} has been suspended.`);
          setIsConfirmActionDialogOpen(false);
          setConfirmAction(null);
        }
      } catch (error) {
        console.error('Failed to perform action:', error);
        toast.error('Failed to perform action. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background">
        <HolographicCard className="col-span-full neumorphic-card">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading users...</div>
          </CardContent>
        </HolographicCard>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background">
      <HolographicCard className="col-span-full neumorphic-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-400" /> User Management
          </CardTitle>
          <Button
            onClick={() => setIsInviteUserDialogOpen(true)}
            style={{ backgroundColor: primaryColorHex }}
            className="text-white hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Invite New User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select onValueChange={setFilterRole} value={filterRole}>
              <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                <SelectItem value="All" className="focus:bg-accent focus:text-accent-foreground">All Roles</SelectItem>
                <SelectItem value="Admin" className="focus:bg-accent focus:text-accent-foreground">Admin</SelectItem>
                <SelectItem value="User" className="focus:bg-accent focus:text-accent-foreground">User</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setFilterStatus} value={filterStatus}>
              <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                <SelectItem value="All" className="focus:bg-accent focus:text-accent-foreground">All Statuses</SelectItem>
                <SelectItem value="Active" className="focus:bg-accent focus:text-accent-foreground">Active</SelectItem>
                <SelectItem value="Invited">Invited</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setFilterTenant} value={filterTenant}>
              <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Tenant" />
              </SelectTrigger>
              <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                <SelectItem value="All" className="focus:bg-accent focus:text-accent-foreground">All Tenants</SelectItem>
                {uniqueTenants.map(tenant => (
                  <SelectItem key={tenant} value={tenant} className="focus:bg-accent focus:text-accent-foreground">{tenant}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Company Name</TableHead>
                <TableHead className="text-muted-foreground">Full Name</TableHead>
                <TableHead className="text-muted-foreground">Email ID</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Tenant ID</TableHead>
                <TableHead className="text-muted-foreground">Domain</TableHead>
                <TableHead className="text-muted-foreground">Location</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Last Login</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{user.companyName}</TableCell>
                    <TableCell className="font-medium text-foreground">{user.fullName}</TableCell>
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
                    <TableCell className="text-foreground">{user.tenantId}</TableCell>
                    <TableCell className="text-foreground">{user.domain}</TableCell>
                    <TableCell className="text-foreground">{user.location}</TableCell>
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
                        <DropdownMenuContent align="end" className="neumorphic-card text-popover-foreground border border-border">
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
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </HolographicCard>

      {/* Invite New User Dialog */}
      <Dialog open={isInviteUserDialogOpen} onOpenChange={setIsInviteUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px] neumorphic-card border border-border text-foreground bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Invite New User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the details for the new user. An invitation email will be sent.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inviteCompanyName" className="text-right text-muted-foreground">
                Company Name
              </Label>
              <Input
                id="inviteCompanyName"
                value={inviteCompanyName}
                onChange={(e) => setInviteCompanyName(e.target.value)}
                className="col-span-3 bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inviteName" className="text-right text-muted-foreground">
                Full Name (Optional)
              </Label>
              <Input
                id="inviteName"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="col-span-3 bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inviteEmail" className="text-right text-muted-foreground">
                Email ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="col-span-3 bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inviteRole" className="text-right text-muted-foreground">
                Role
              </Label>
              <Select onValueChange={(value: 'Admin' | 'User') => setInviteRole(value)} value={inviteRole}>
                <SelectTrigger id="inviteRole" className="col-span-3 bg-input border-border text-foreground">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inviteTenantId" className="text-right text-muted-foreground">
                Tenant ID
              </Label>
              <Input
                id="inviteTenantId"
                value={inviteTenantId}
                onChange={(e) => setInviteTenantId(e.target.value)}
                className="col-span-3 bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inviteDomain" className="text-right text-muted-foreground">
                Domain
              </Label>
              <Input
                id="inviteDomain"
                value={inviteDomain}
                onChange={(e) => setInviteDomain(e.target.value)}
                className="col-span-3 bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inviteLocation" className="text-right text-muted-foreground">
                Location
              </Label>
              <Input
                id="inviteLocation"
                value={inviteLocation}
                onChange={(e) => setInviteLocation(e.target.value)}
                className="col-span-3 bg-input border-border text-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleInviteUser} style={{ backgroundColor: primaryColorHex }} className="text-white hover:opacity-90">
              Send Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px] neumorphic-card border border-border text-foreground bg-card">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Make changes to user profile. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editCompanyName" className="text-right text-muted-foreground">
                  Company Name
                </Label>
                <Input
                  id="editCompanyName"
                  value={editingUser.companyName}
                  onChange={(e) => setEditingUser({ ...editingUser, companyName: e.target.value })}
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editFullName" className="text-right text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="editFullName"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
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
                <Label htmlFor="editRole" className="text-right text-muted-foreground">
                  Role
                </Label>
                <Select onValueChange={(value: 'Admin' | 'User') => setEditingUser({ ...editingUser, role: value })} value={editingUser.role}>
                  <SelectTrigger id="editRole" className="col-span-3 bg-input border-border text-foreground">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editTenantId" className="text-right text-muted-foreground">
                  Tenant ID
                </Label>
                <Input
                  id="editTenantId"
                  value={editingUser.tenantId}
                  onChange={(e) => setEditingUser({ ...editingUser, tenantId: e.target.value })}
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
                <Label htmlFor="editLocation" className="text-right text-muted-foreground">
                  Location
                </Label>
                <Input
                  id="editLocation"
                  value={editingUser.location}
                  onChange={(e) => setEditingUser({ ...editingUser, location: e.target.value })}
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editStatus" className="text-right text-muted-foreground">
                  Status
                </Label>
                <Select onValueChange={(value: 'Active' | 'Invited' | 'Suspended') => setEditingUser({ ...editingUser, status: value })} value={editingUser.status}>
                  <SelectTrigger id="editStatus" className="col-span-3 bg-input border-border text-foreground">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Invited">Invited</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => editingUser && handleSaveEditedUser(editingUser)} style={{ backgroundColor: primaryColorHex }} className="text-white hover:opacity-90">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={isConfirmActionDialogOpen} onOpenChange={setIsConfirmActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px] neumorphic-card border border-border text-foreground bg-card">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {confirmAction?.type === 'resetPassword' ? 'Reset Password' : 'Suspend User'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to {confirmAction?.type === 'resetPassword' ? 'reset the password for' : 'suspend'} {confirmAction?.user?.fullName}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConfirmActionDialogOpen(false)} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmAction}>
              {confirmAction?.type === 'resetPassword' ? 'Reset' : 'Suspend'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
