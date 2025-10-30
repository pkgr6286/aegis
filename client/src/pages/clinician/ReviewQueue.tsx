import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Session {
  id: string;
  drugProgramId: string;
  drugProgramName: string;
  outcome: 'ok_to_use' | 'ask_a_doctor' | 'do_not_use';
  reviewStatus: 'pending' | 'reviewed' | 'follow_up_required';
  reviewedByEmail: string | null;
  reviewedAt: string | null;
  createdAt: string;
  completedAt: string;
}

interface PaginatedResponse {
  success: boolean;
  data: Session[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ReviewQueue() {
  const [, setLocation] = useLocation();
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'reviewed'>('pending');
  const [drugProgramFilter, setDrugProgramFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch drug programs for filter
  const { data: programsData } = useQuery<{success: boolean; data: Array<{id: string; name: string}>}>({
    queryKey: ['/admin/drug-programs'],
  });

  // Build query parameters
  const queryParams = new URLSearchParams({
    reviewStatus,
    page: page.toString(),
    limit: '20',
  });

  if (drugProgramFilter !== 'all') {
    queryParams.append('drugProgramId', drugProgramFilter);
  }

  if (outcomeFilter !== 'all') {
    queryParams.append('outcome', outcomeFilter);
  }

  // Fetch sessions
  const { data: sessionsData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: [`/api/v1/clinician/sessions?${queryParams.toString()}`],
  });

  const getOutcomeBadgeVariant = (outcome: string) => {
    switch (outcome) {
      case 'ok_to_use':
        return 'default';
      case 'ask_a_doctor':
        return 'secondary';
      case 'do_not_use':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getReviewStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'reviewed':
        return 'default';
      case 'follow_up_required':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatOutcome = (outcome: string) => {
    return outcome.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatReviewStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Review Queue</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Review consumer screening sessions that require clinical attention
          </p>
        </div>
        <ClipboardList className="h-10 w-10 text-muted-foreground" />
      </div>

      <Tabs value={reviewStatus} onValueChange={(value) => setReviewStatus(value as 'pending' | 'reviewed')} data-testid="tabs-review-status">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Review
          </TabsTrigger>
          <TabsTrigger value="reviewed" data-testid="tab-completed">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={reviewStatus} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle data-testid="text-card-title">
                    {reviewStatus === 'pending' ? 'Pending Reviews' : 'Completed Reviews'}
                  </CardTitle>
                  <CardDescription data-testid="text-card-description">
                    {reviewStatus === 'pending' 
                      ? 'Sessions awaiting clinical review'
                      : 'Sessions that have been reviewed'
                    }
                  </CardDescription>
                </div>

                <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                  <Select value={drugProgramFilter} onValueChange={setDrugProgramFilter}>
                    <SelectTrigger className="w-[200px]" data-testid="select-drug-program">
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programsData?.data.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                    <SelectTrigger className="w-[200px]" data-testid="select-outcome">
                      <SelectValue placeholder="All Outcomes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Outcomes</SelectItem>
                      <SelectItem value="ok_to_use">OK to Use</SelectItem>
                      <SelectItem value="ask_a_doctor">Ask a Doctor</SelectItem>
                      <SelectItem value="do_not_use">Do Not Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
                  Loading sessions...
                </div>
              ) : sessionsData && sessionsData.data.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session ID</TableHead>
                        <TableHead>Drug Program</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>Review Status</TableHead>
                        <TableHead>Completed</TableHead>
                        {reviewStatus === 'reviewed' && <TableHead>Reviewed By</TableHead>}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionsData.data.map((session) => (
                        <TableRow key={session.id} data-testid={`row-session-${session.id}`}>
                          <TableCell className="font-mono text-xs" data-testid={`text-session-id-${session.id}`}>
                            {session.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell data-testid={`text-program-${session.id}`}>
                            {session.drugProgramName}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getOutcomeBadgeVariant(session.outcome)} data-testid={`badge-outcome-${session.id}`}>
                              {formatOutcome(session.outcome)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getReviewStatusBadgeVariant(session.reviewStatus)} data-testid={`badge-status-${session.id}`}>
                              {formatReviewStatus(session.reviewStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-time-${session.id}`}>
                            {formatDistanceToNow(new Date(session.completedAt), { addSuffix: true })}
                          </TableCell>
                          {reviewStatus === 'reviewed' && (
                            <TableCell data-testid={`text-reviewer-${session.id}`}>
                              {session.reviewedByEmail || 'N/A'}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/clinician/sessions/${session.id}`)}
                              data-testid={`button-review-${session.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {reviewStatus === 'pending' ? 'Review' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {sessionsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                        Showing {sessionsData.data.length} of {sessionsData.pagination.total} sessions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(sessionsData.pagination.totalPages, p + 1))}
                          disabled={page === sessionsData.pagination.totalPages}
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-sessions">
                  No sessions found matching your filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
