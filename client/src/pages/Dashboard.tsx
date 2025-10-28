import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { DashboardStats, AuditLog, PaginatedResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, Activity, TrendingUp, Clipboard, Package } from 'lucide-react';
import { format } from 'date-fns';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Pie, PieChart, Legend } from 'recharts';

const OUTCOME_COLORS: Record<string, string> = {
  ok_to_use: 'hsl(var(--success))',
  ask_a_doctor: 'hsl(var(--warning))',
  do_not_use: 'hsl(var(--destructive))',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'hsl(var(--success))',
  trial: 'hsl(var(--primary))',
  suspended: 'hsl(var(--destructive))',
};

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
      color: 'text-primary',
    },
    {
      title: 'Active Users',
      value: stats?.data?.activeUsers || 0,
      icon: Users,
      trend: '+5%',
      color: 'text-success',
    },
    {
      title: 'API Calls (24h)',
      value: stats?.data?.apiCalls24h?.toLocaleString() || 0,
      icon: Activity,
      trend: '+18%',
      color: 'text-warning',
    },
    {
      title: 'Total Screenings',
      value: stats?.data?.totalScreenings?.toLocaleString() || 0,
      icon: Clipboard,
      trend: '+23%',
      color: 'text-success',
    },
    {
      title: 'Drug Programs',
      value: stats?.data?.totalPrograms || 0,
      icon: Package,
      trend: '+8%',
      color: 'text-primary',
    },
    {
      title: 'New Tenants (Month)',
      value: stats?.data?.newTenantsThisMonth?.reduce((sum, item) => sum + item.count, 0) || 0,
      icon: TrendingUp,
      trend: '+8%',
      color: 'text-primary',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Platform Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System-wide metrics and analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
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

      {/* Charts Row 1: Screening Activity & API Calls */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Screening Activity</CardTitle>
            <CardDescription>Patient screenings over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : stats?.data?.screeningActivity && stats.data.screeningActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.data.screeningActivity}>
                  <defs>
                    <linearGradient id="colorScreenings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
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
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fill="url(#colorScreenings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No screening activity yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Traffic</CardTitle>
            <CardDescription>Daily API calls over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : stats?.data?.apiCallsData && stats.data.apiCallsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.data.apiCallsData}>
                  <defs>
                    <linearGradient id="colorAPICalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
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
                    stroke="hsl(var(--warning))"
                    strokeWidth={2}
                    fill="url(#colorAPICalls)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No API traffic data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: New Tenants & Outcome Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
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
                <BarChart data={stats.data.newTenantsThisMonth}>
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
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available for this month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Screening Outcomes</CardTitle>
            <CardDescription>Distribution of screening results</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : stats?.data?.outcomeDistribution && stats.data.outcomeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.data.outcomeDistribution}
                    dataKey="count"
                    nameKey="outcome"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ outcome, count }) => `${outcome.replace(/_/g, ' ')}: ${count}`}
                  >
                    {stats.data.outcomeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={OUTCOME_COLORS[entry.outcome] || 'hsl(var(--muted))'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No outcome data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
