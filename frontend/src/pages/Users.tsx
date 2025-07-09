import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Inactive';
}

const mockUsers: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Viewer', status: 'Inactive' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Admin', status: 'Active' },
  { id: '5', name: 'Eve Adams', email: 'eve@example.com', role: 'Viewer', status: 'Active' },
];

const Users = () => {
  const [users, setUsers] = React.useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'Admin': return 'default';
      case 'Editor': return 'secondary';
      case 'Viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: User['status']) => {
    return status === 'Active' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full">
      <HolographicCard className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-blue-600" /> User Management
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-white/50 border-blue-300/50 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" /> Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className={getStatusColor(user.status)}>{user.status}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-600 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No users found matching your search.</p>
          )}
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Users;