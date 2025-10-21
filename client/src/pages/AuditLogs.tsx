import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { AuditLog, Tenant, PaginatedResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: tenants } = useQuery({
    queryKey: ['/superadmin/tenants/dropdown'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Tenant>>('/superadmin/tenants?page=1&limit=100'),
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['/superadmin/audit-logs', { page, tenantFilter, startDate, endDate }],
    queryFn: () => {
      let url = `/superadmin/audit-logs?page=${page}&limit=20`;
      if (tenantFilter && tenantFilter !== 'all') url += `&tenantId=${tenantFilter}`;
      if (startDate) url += `&startDate=${startDate.toISOString()}`;
      if (endDate) url += `&endDate=${endDate.toISOString()}`;
      return apiClient.get<PaginatedResponse<AuditLog>>(url);
    },
  });

  const handleLogClick = (log: AuditLog) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  const clearFilters = () => {
    setTenantFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Platform Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive audit trail of all platform activities
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tenant</label>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger data-testid="select-tenant-filter">
                  <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {tenants?.data?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                    data-testid="button-start-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                    data-testid="button-end-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : logs?.data && logs.data.length > 0 ? (
                logs.data.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleLogClick(log)}
                    data-testid={`audit-log-row-${log.id}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.timestamp), 'MMM d, yyyy h:mm:ss a')}
                    </TableCell>
                    <TableCell>
                      {log.tenantName ? (
                        <span className="text-sm">{log.tenantName}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{log.userEmail || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.entityType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Audit Log Details</SheetTitle>
            <SheetDescription>
              Full details and change history for this event
            </SheetDescription>
          </SheetHeader>
          {selectedLog && (
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Timestamp
                  </label>
                  <p className="text-sm mt-1 font-mono">
                    {format(new Date(selectedLog.timestamp), 'PPPpp')}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Action
                  </label>
                  <p className="text-sm mt-1">
                    <Badge variant="outline" className="font-mono">
                      {selectedLog.action}
                    </Badge>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Entity Type
                  </label>
                  <p className="text-sm mt-1">
                    <Badge variant="outline">{selectedLog.entityType}</Badge>
                  </p>
                </div>

                {selectedLog.userEmail && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      User
                    </label>
                    <p className="text-sm mt-1">{selectedLog.userEmail}</p>
                  </div>
                )}

                {selectedLog.tenantName && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Tenant
                    </label>
                    <p className="text-sm mt-1">{selectedLog.tenantName}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Change Details
                </label>
                <div className="mt-2 rounded-lg bg-muted/30 p-4">
                  <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
