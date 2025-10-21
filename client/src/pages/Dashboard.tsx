import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { DashboardStats, AuditLog, PaginatedResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, Activity, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/superadmin/stats'],
    queryFn: () => apiClient.get<{ success: boolean; data: DashboardStats }>('/superadmin/stats'),
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['/superadmin/audit-logs', { limit: 5 }],
    queryFn: () =>
      apiClient.get<PaginatedResponse<AuditLog>>('/superadmin/audit-logs?limit=5&page=1'),
  });

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats?.data?.totalTenants || 0,
      icon: Building2,
      trend: '+12%',
    },
    {
      title: 'Active Users',
      value: stats?.data?.activeUsers || 0,
      icon: Users,
      trend: '+5%',
    },
    {
      title: 'API Calls (24h)',
      value: stats?.data?.apiCalls24h?.toLocaleString() || 0,
      icon: Activity,
      trend: '+18%',
    },
    {
      title: 'New Tenants (Month)',
      value: stats?.data?.newTenantsThisMonth?.reduce((sum, item) => sum + item.count, 0) || 0,
      icon: TrendingUp,
      trend: '+8%',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Platform overview and key metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold" data-testid={`stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </div>
                    <p className="text-xs text-success mt-1">{stat.trend} from last month</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Tenants Chart */}
      <Card>
        <CardHeader>
          <CardTitle>New Tenants This Month</CardTitle>
          <CardDescription>Daily tenant registration trend</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : stats?.data?.newTenantsThisMonth && stats.data.newTenantsThisMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.data.newTenantsThisMonth}>
                <defs>
                  <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorTenants)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available for this month
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity?.data && recentActivity.data.length > 0 ? (
            <div className="space-y-6">
              {recentActivity.data.map((log) => (
                <div key={log.id} className="flex items-start gap-4 pb-6 border-b last:border-0 last:pb-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {log.action}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {log.userEmail || 'System'} • {log.entityType}
                      {log.tenantName && ` • ${log.tenantName}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
