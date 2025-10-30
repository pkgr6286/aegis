import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, CheckCircle2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalScreenings: number;
  successRate: number;
  activePrograms: number;
  teamMembers: number;
  dailyActivity: { date: string; count: number }[];
}

export default function PharmaAdminDashboard() {
  const { data: stats, isLoading, error } = useQuery<{ data: DashboardStats }>({
    queryKey: ['/admin/dashboard/stats'],
  });

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p className="font-semibold">Failed to load dashboard statistics</p>
          <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to your Aegis Platform tenant dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Screenings
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="stat-total-screenings">
                  {stats?.data.totalScreenings.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="stat-success-rate">
                  {stats?.data.successRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Of completed screenings
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Programs
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="stat-active-programs">
                  {stats?.data.activePrograms || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="stat-team-members">
                  {stats?.data.teamMembers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  In your tenant
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Screening Activity</CardTitle>
            <CardDescription>
              Daily screening volume over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : stats?.data.dailyActivity && stats.data.dailyActivity.length > 0 ? (
              <div className="h-80 flex flex-col justify-end gap-1" data-testid="chart-daily-activity">
                <div className="flex items-end gap-1 h-full">
                  {stats.data.dailyActivity.map((day, i) => {
                    const maxCount = Math.max(...stats.data.dailyActivity.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1"
                        title={`${day.date}: ${day.count} screenings`}
                      >
                        <div className="flex-1 flex items-end w-full">
                          <div
                            className="w-full bg-primary rounded-t-sm hover-elevate transition-all"
                            style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                          />
                        </div>
                        {i % 5 === 0 && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(day.date).getDate()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground text-center mt-2">
                  Last 30 days
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No screening activity yet</p>
                  <p className="text-sm mt-1">Create a drug program to get started</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions in your tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                <p>Recent activity feed</p>
                <p className="text-xs mt-1">Coming soon - integrated with audit logs</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
