import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/lib/apiClient';
import { auditLogFilterSchema, type AuditLogFilterFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { AuditLog } from '@/types/auditLog';

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Filter form setup
  const filterForm = useForm<AuditLogFilterFormData>({
    resolver: zodResolver(auditLogFilterSchema),
    defaultValues: {
      resourceType: undefined,
      action: undefined,
      userId: undefined,
      startDate: undefined,
      endDate: undefined,
    },
  });

  const filters = filterForm.watch();

  // Fetch audit logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['/admin/audit-logs', filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', '20');
      params.append('offset', String(currentPage * 20));

      return await apiClient.get<{ success: boolean; data: AuditLog[] }>(
        `/admin/audit-logs?${params.toString()}`
      );
    },
  });

  const logs = logsData?.data || [];

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleResetFilters = () => {
    filterForm.reset({
      resourceType: undefined,
      action: undefined,
      userId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setCurrentPage(0);
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "outline" => {
    if (action.includes('create') || action.includes('publish')) return 'default';
    if (action.includes('update') || action.includes('edit')) return 'secondary';
    if (action.includes('delete') || action.includes('revoke')) return 'outline';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">Loading logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Audit Logs</h1>
          <p className="text-muted-foreground">
            View activity history and changes for your tenant
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit logs by resource type, action, user, or date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...filterForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Resource Type */}
              <FormField
                control={filterForm.control}
                name="resourceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Type</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-resource-type"
                        placeholder="e.g., DrugProgram"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                          setCurrentPage(0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action */}
              <FormField
                control={filterForm.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-action"
                        placeholder="e.g., create, update"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                          setCurrentPage(0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Date */}
              <FormField
                control={filterForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-start-date"
                        type="date"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                          setCurrentPage(0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={filterForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-end-date"
                        type="date"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                          setCurrentPage(0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                data-testid="button-reset-filters"
              >
                Reset Filters
              </Button>
              <div className="text-sm text-muted-foreground flex items-center">
                {logs.length} log{logs.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                        <TableCell className="font-medium" data-testid={`text-timestamp-${log.id}`}>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getActionBadgeVariant(log.action)}
                            data-testid={`badge-action-${log.id}`}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-resource-${log.id}`}>
                          <div>
                            <div className="font-medium">{log.resourceType || 'N/A'}</div>
                            {log.resourceId && (
                              <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                                {log.resourceId}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-user-${log.id}`}>
                          {log.userEmail || log.userId || 'System'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            data-testid={`button-view-${log.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} • Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={!filters.offset || filters.offset === 0}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={logs.length < (filters.limit || 20)}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="sm:max-w-2xl" data-testid="sheet-log-detail">
          <SheetHeader>
            <SheetTitle>Audit Log Detail</SheetTitle>
            <SheetDescription>
              {selectedLog && new Date(selectedLog.timestamp).toLocaleString()}
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <ScrollArea className="h-[calc(100vh-120px)] mt-6">
              <div className="space-y-6">
                {/* Summary */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Action</Label>
                    <div className="mt-1">
                      <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                        {selectedLog.action}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Resource Type</Label>
                    <div className="mt-1 font-medium">{selectedLog.resourceType || 'N/A'}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Resource ID</Label>
                    <div className="mt-1 font-mono text-sm break-all">
                      {selectedLog.resourceId || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">User</Label>
                    <div className="mt-1">
                      <div className="font-medium">{selectedLog.userEmail || 'Unknown'}</div>
                      {selectedLog.userId && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {selectedLog.userId}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedLog.ipAddress && (
                    <div>
                      <Label className="text-sm text-muted-foreground">IP Address</Label>
                      <div className="mt-1 font-mono text-sm">{selectedLog.ipAddress}</div>
                    </div>
                  )}
                </div>

                {/* Changes */}
                {selectedLog.changes && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Changes</Label>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto" data-testid="text-changes-json">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Full Record */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Full Record</Label>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
