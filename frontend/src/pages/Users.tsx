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
    <div className="p-4 grid grid-cols-1 gap-4 h-full">
      <HolographicCard className="col-span-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-600" /> User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/50 border-blue-300/50 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <Select onValueChange={setFilterRole} value={filterRole}>
              <SelectTrigger className="w-full md:w-[180px] bg-white/50 border-blue-300/50 text-gray-900">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="All">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Editor">Editor</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold",
                        user.role === 'Admin' && "bg-blue-100 text-blue-800",
                        user.role === 'Editor' && "bg-purple-100 text-purple-800",
                        user.role === 'Viewer' && "bg-gray-100 text-gray-800"
                      )}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold",
                        user.status === 'Active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{user.lastLogin}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-gray-500">
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