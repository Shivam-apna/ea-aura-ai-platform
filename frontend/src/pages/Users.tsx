import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserIcon, Search, Filter } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

const mockUsers: User[] = [
  { id: 'user-001', name: 'Alice Smith', email: 'alice.s@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-07-29 10:30 AM' },
  { id: 'user-002', name: 'Bob Johnson', email: 'bob.j@example.com', role: 'Editor', status: 'Active', lastLogin: '2024-07-28 03:15 PM' },
  { id: 'user-003', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Viewer', status: 'Active', lastLogin: '2024-07-29 09:00 AM' },
  { id: 'user-004', name: 'Diana Prince', email: 'diana.p@example.com', role: 'Admin', status: 'Inactive', lastLogin: '2024-07-20 11:00 AM' },
  { id: 'user-005', name: 'Eve Adams', email: 'eve.a@example.com', role: 'Editor', status: 'Active', lastLogin: '2024-07-29 01:00 PM' },
  { id: 'user-006', name: 'Frank White', email: 'frank.w@example.com', role: 'Viewer', status: 'Active', lastLogin: '2024-07-27 05:00 PM' },
  { id: 'user-007', name: 'Grace Lee', email: 'grace.l@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-07-29 08:45 AM' },
  { id: 'user-008', name: 'Henry King', email: 'henry.k@example.com', role: 'Editor', status: 'Inactive', lastLogin: '2024-07-15 02:00 PM' },
];

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [users, setUsers] = useState<User[]>(mockUsers);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background"> {/* Apply background to the page */}
      <HolographicCard className="col-span-full neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-400" /> User Management
          </CardTitle>
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
                <SelectItem value="Editor" className="focus:bg-accent focus:text-accent-foreground">Editor</SelectItem>
                <SelectItem value="Viewer" className="focus:bg-accent focus:text-accent-foreground">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-foreground">{user.email}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold",
                        user.role === 'Admin' && "bg-blue-600/20 text-blue-400",
                        user.role === 'Editor' && "bg-purple-600/20 text-purple-400",
                        user.role === 'Viewer' && "bg-muted/20 text-muted-foreground"
                      )}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold",
                        user.status === 'Active' ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                      )}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Users;