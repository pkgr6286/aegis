import { useLocation, Link } from 'wouter';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Building2, Users, FileText, Shield } from 'lucide-react';

const navigationGroups = [
  {
    label: 'OVERVIEW',
    items: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        url: '/dashboard',
      },
    ],
  },
  {
    label: 'PLATFORM MANAGEMENT',
    items: [
      {
        title: 'Tenant Management',
        icon: Building2,
        url: '/tenants',
      },
      {
        title: 'User Management',
        icon: Users,
        url: '/users',
      },
    ],
  },
  {
    label: 'COMPLIANCE & SECURITY',
    items: [
      {
        title: 'Platform Audit Logs',
        icon: FileText,
        url: '/audit-logs',
      },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">Aegis Platform</span>
            <span className="text-xs text-muted-foreground">Super Admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3 py-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location === item.url;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="h-10"
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Link href={item.url}>
                          <Icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-muted-foreground">
          v1.0.0 | © 2025 Aegis
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
