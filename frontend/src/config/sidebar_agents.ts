import { LayoutDashboard, DollarSign, Users2, Target, Award, Settings, Users, UploadCloud } from 'lucide-react';

export const allAgents = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, path: '/dashboard', requiredRoles: ['user'] },
  { id: 'business-vitality', name: 'Business Vitality', icon: DollarSign, path: '/business-vitality', requiredRoles: ['user'] },
  { id: 'customer-analyzer', name: 'Customer Analysis', icon: Users2, path: '/customer-analyzer', requiredRoles: ['user'] },
  { id: 'mission-alignment', name: 'Mission Alignment', icon: Target, path: '/mission-alignment', requiredRoles: ['user'] },
  { id: 'brand-index', name: 'Brand Index', icon: Award, path: '/brand-index', requiredRoles: ['user'] },
  { id: 'settings', name: 'Settings', icon: Settings, path: '/settings', requiredRoles: ['admin'] },
  { id: 'users', name: 'Users', icon: Users, path: '/users', requiredRoles: ['admin'] },
  { id: 'upload-data', name: 'Upload Data', icon: UploadCloud, path: '/upload-data', requiredRoles: ['admin'] },
];