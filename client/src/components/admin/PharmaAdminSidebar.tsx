import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
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
import { LayoutDashboard, Pill, Users, Building2, FileText, Palette, ClipboardList } from 'lucide-react';

interface NavigationItem {
  title: string;
  icon: any;
  url: string;
  roles?: Array<'admin' | 'editor' | 'viewer' | 'clinician' | 'auditor'>;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
  roles?: Array<'admin' | 'editor' | 'viewer' | 'clinician' | 'auditor'>;
}

// Admin/Editor/Viewer Navigation
const adminNavigationGroups: NavigationGroup[] = [
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
        roles: ['admin', 'editor'], // Hide from viewers and auditors
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
        roles: ['admin', 'editor'], // Hide from viewers and auditors
      },
    ],
  },
];

// Clinician Navigation
const clinicianNavigationGroups: NavigationGroup[] = [
  {
    label: 'WORKFLOW',
    items: [
      {
        title: 'Review Queue',
        icon: ClipboardList,
        url: '/clinician/review-queue',
      },
    ],
  },
];

export function PharmaAdminSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const userRole = user?.tenantRole;

  // Determine which navigation to show based on role
  const navigationGroups = userRole === 'clinician' 
    ? clinicianNavigationGroups 
    : adminNavigationGroups;

  // Filter navigation items based on user role
  const filteredNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // If item has role restrictions, check if user's role is included
        if (item.roles && userRole) {
          return item.roles.includes(userRole);
        }
        // If no role restrictions, show to all (except clinicians who have their own nav)
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0); // Remove empty groups

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">Aegis Platform</span>
            <span className="text-xs text-sidebar-foreground/70">
              {userRole === 'clinician' ? 'Clinician' : 
               userRole === 'auditor' ? 'Auditor' : 
               'Pharma Admin'}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredNavigationGroups.map((group) => (
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
                          {userRole === 'auditor' && (
                            <span className="ml-auto text-xs text-muted-foreground">(View Only)</span>
                          )}
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
