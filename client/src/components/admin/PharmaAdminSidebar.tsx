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
  SidebarRail,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Pill, Users, Building2, FileText, Palette } from 'lucide-react';

const navigationGroups = [
  {
    label: 'OVERVIEW',
    items: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        url: '/admin/dashboard',
      },
    ],
  },
  {
    label: 'PRODUCT & COMPLIANCE',
    items: [
      {
        title: 'Drug Programs',
        icon: Pill,
        url: '/admin/programs',
      },
      {
        title: 'Audit Logs',
        icon: FileText,
        url: '/admin/audit-logs',
      },
    ],
  },
  {
    label: 'ACCESS MANAGEMENT',
    items: [
      {
        title: 'User Management',
        icon: Users,
        url: '/admin/users',
      },
      {
        title: 'Partner Management',
        icon: Building2,
        url: '/admin/partners',
      },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      {
        title: 'Brand Management',
        icon: Palette,
        url: '/admin/brands',
      },
    ],
  },
];

export function PharmaAdminSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">Aegis Platform</span>
            <span className="text-xs text-sidebar-foreground/70">Pharma Admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 px-3 py-2">
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
        <div className="text-xs text-sidebar-foreground/70">
          v1.0.0 | © 2025 Aegis
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
