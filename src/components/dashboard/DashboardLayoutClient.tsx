
'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AppLogo } from '@/components/common/AppLogo';
import { LayoutDashboard, User, FileText, Users, Briefcase, LogOut, Settings, ShieldCheck, Loader2, Search, KeyRound, ShieldAlert, Landmark, Umbrella, Database } from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['enduser', 'consultant', 'admin'] },
  { href: '/dashboard/user/profile', label: 'My Profile', icon: User, roles: ['enduser'] },
  { href: '/dashboard/user/documents', label: 'My Documents', icon: FileText, roles: ['enduser'] },
  { href: '/dashboard/user/access', label: 'Access Control', icon: KeyRound, roles: ['enduser'] },
  { href: '/dashboard/user/insurance', label: 'Insurance', icon: Umbrella, roles: ['enduser'] },
  { href: '/dashboard/consultant/profile', label: 'My Profile', icon: User, roles: ['consultant'] },
  { href: '/dashboard/consultant/view-user', label: 'View User', icon: Search, roles: ['consultant'] },
  { href: '/dashboard/admin/users', label: 'Manage Users', icon: Users, roles: ['admin'] },
  { href: '/dashboard/admin/consultants', label: 'Manage Consultants', icon: Briefcase, roles: ['admin'] },
  { href: '/dashboard/admin/access', label: 'Access Control', icon: ShieldAlert, roles: ['admin'] },
  { href: '/dashboard/admin/insurance', label: 'Insurance', icon: Landmark, roles: ['admin'] },
  { href: '/dashboard/admin/data-explorer', label: 'Data Explorer', icon: Database, roles: ['admin'] },
];

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClientLoading, setIsClientLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setIsClientLoading(false);
      if (!user) {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isClientLoading || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-page-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Or a redirect component, though useEffect handles it
  }
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2);
  };
  
  const userDisplayName = user.role === 'admin' ? (user.profile as any).name : `${(user.profile as any).firstName} ${(user.profile as any).lastName}`;

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
        <SidebarHeader className="p-4 items-start">
           <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
            <AppLogo />
            <SidebarTrigger className="md:hidden group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {filteredNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.label, className: "bg-primary text-primary-foreground" }}
                  >
                    <span>
                      <item.icon />
                      <span>{item.label}</span>
                    </span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto">
           <div className="group-data-[collapsible=icon]:hidden">
             <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MyDocula</p>
           </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center">
            <SidebarTrigger className="hidden md:flex group-data-[state=expanded]:group-data-[collapsible=offcanvas]:hidden" />
             {/* Placeholder for breadcrumbs or page title if needed */}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={(user.profile as any).avatarUrl || `https://placehold.co/100x100.png`} alt={userDisplayName} data-ai-hint="profile avatar" />
                  <AvatarFallback>{getInitials(userDisplayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Privacy</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
