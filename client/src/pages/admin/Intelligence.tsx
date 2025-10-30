import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {  
  Activity,
  TrendingUp,
  CheckCircle2,
  Users,
  BarChart3,
  Target,
  Award,
} from 'lucide-react';
import type { DrugProgram } from '@/types/drugProgram';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface OverviewStats {
  totalScreenings: number;
  completedScreenings: number;
  eligibleScreenings: number;
  totalCodes: number;
  usedCodes: number;
  completionRate: number;
  eligibilityRate: number;
  verificationRate: number;
}

interface FunnelData {
  started: number;
  completed: number;
  passedScreener: number;
  generatedCode: number;
  usedCode: number;
}

interface PathPerformance {
  manual: {
    started: number;
    completed: number;
    eligible: number;
    completionRate: number;
    eligibilityRate: number;
  };
  ehr: {
    started: number;
    completed: number;
    eligible: number;
    completionRate: number;
    eligibilityRate: number;
  };
}

interface OutcomeByQuestion {
  questionId: string;
  answer: string;
  outcome: string;
  count: number;
}

interface PartnerPerformance {
  partnerId: string;
  partnerName: string;
  success: number;
  failed: number;
  total: number;
  successRate: number;
}

export default function Intelligence() {
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');

  const { data: programsData, isLoading: programsLoading } = useQuery({
    queryKey: ['/admin/drug-programs'],
  });

  const programs = (programsData as { success: boolean; data: DrugProgram[] })?.data || [];

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: [`/admin/analytics/overview-stats?drugProgramId=${selectedProgramId}`],
    enabled: !!selectedProgramId,
  });

  const overviewStats = (overviewData as { success: boolean; data: OverviewStats })?.data;

  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: [`/admin/analytics/screener-funnel?drugProgramId=${selectedProgramId}`],
    enabled: !!selectedProgramId,
  });

  const funnel = (funnelData as { success: boolean; data: FunnelData })?.data;

  const { data: pathData, isLoading: pathLoading } = useQuery({
    queryKey: [`/admin/analytics/path-performance?drugProgramId=${selectedProgramId}`],
    enabled: !!selectedProgramId,
  });

  const pathPerformance = (pathData as { success: boolean; data: PathPerformance })?.data;

  const { data: outcomesData, isLoading: outcomesLoading } = useQuery({
    queryKey: [`/admin/analytics/outcomes-by-question?drugProgramId=${selectedProgramId}`],
    enabled: !!selectedProgramId,
  });

  const outcomes = (outcomesData as { success: boolean; data: OutcomeByQuestion[] })?.data || [];

  const { data: populationData } = useQuery({
    queryKey: [`/admin/analytics/population-outcomes?drugProgramId=${selectedProgramId}`],
    enabled: !!selectedProgramId,
  });

  const availableQuestions = (populationData as { success: boolean; data: Array<{ questionId: string }> })?.data || [];

  const { data: populationOutcomesData, isLoading: populationLoading } = useQuery({
    queryKey: [`/admin/analytics/population-outcomes?drugProgramId=${selectedProgramId}&questionId=${selectedQuestionId}`],
    enabled: !!selectedProgramId && !!selectedQuestionId,
  });

  const populationOutcomes = (populationOutcomesData as { success: boolean; data: Array<{ answer: string; ok_to_use: number; ask_a_doctor: number; do_not_use: number; total: number }> })?.data || [];

  const { data: partnerData, isLoading: partnerLoading } = useQuery({
    queryKey: [`/admin/analytics/partner-performance?drugProgramId=${selectedProgramId}`],
    enabled: !!selectedProgramId,
  });

  const partners = (partnerData as { success: boolean; data: PartnerPerformance[] })?.data || [];

  const funnelChartData = funnel ? [
    { stage: 'Started', count: funnel.started, fill: 'hsl(var(--primary))' },
    { stage: 'Completed', count: funnel.completed, fill: 'hsl(var(--chart-1))' },
    { stage: 'Passed Screener', count: funnel.passedScreener, fill: 'hsl(var(--chart-2))' },
    { stage: 'Generated Code', count: funnel.generatedCode, fill: 'hsl(var(--chart-3))' },
    { stage: 'Used Code', count: funnel.usedCode, fill: 'hsl(var(--success))' },
  ] : [];

  const pathComparisonData = pathPerformance ? [
    {
      metric: 'Started',
      Manual: pathPerformance.manual.started,
      EHR: pathPerformance.ehr.started,
    },
    {
      metric: 'Completed',
      Manual: pathPerformance.manual.completed,
      EHR: pathPerformance.ehr.completed,
    },
    {
      metric: 'Eligible',
      Manual: pathPerformance.manual.eligible,
      EHR: pathPerformance.ehr.eligible,
    },
  ] : [];

  const populationChartData = populationOutcomes.map((item) => ({
    answer: item.answer.length > 20 ? item.answer.substring(0, 20) + '...' : item.answer,
    fullAnswer: item.answer,
    'Eligible': item.ok_to_use,
    'Ask Doctor': item.ask_a_doctor,
    'Not Eligible': item.do_not_use,
  }));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-intelligence-title">
          Intelligence
        </h1>
        <p className="text-muted-foreground">
          Advanced analytics and insights for data-driven decision making
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
            <SelectTrigger data-testid="select-drug-program">
              <SelectValue placeholder="Select a drug program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name} - {program.brandName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedProgramId ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Select a drug program to view analytics
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="population" data-testid="tab-population">
              Population Insights
            </TabsTrigger>
            <TabsTrigger value="partners" data-testid="tab-partners">
              Partner Performance
            </TabsTrigger>
            <TabsTrigger value="efficacy" data-testid="tab-efficacy">
              Screener Efficacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Screenings</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="stat-total-screenings">
                        {overviewStats?.totalScreenings.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">All screening attempts</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="stat-completion-rate">
                        {overviewStats?.completionRate.toFixed(1) || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Finished screening</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eligibility Rate</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="stat-eligibility-rate">
                        {overviewStats?.eligibilityRate.toFixed(1) || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Passed screening</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="stat-verification-rate">
                        {overviewStats?.verificationRate.toFixed(1) || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Codes redeemed</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Screening Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                {funnelLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={funnelChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {funnelChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="population" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
                  <SelectTrigger data-testid="select-demographic-question">
                    <SelectValue placeholder="Select a demographic question" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableQuestions.map((q) => (
                      <SelectItem key={q.questionId} value={q.questionId}>
                        {q.questionId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!selectedQuestionId ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Select a demographic question to view outcome breakdown
                  </p>
                </CardContent>
              </Card>
            ) : populationLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : populationChartData.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No data available for this question
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Outcome Breakdown by {selectedQuestionId}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={populationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="answer" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Eligible" stackId="a" fill="hsl(var(--success))" />
                      <Bar dataKey="Ask Doctor" stackId="a" fill="hsl(var(--warning))" />
                      <Bar dataKey="Not Eligible" stackId="a" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            {partnerLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : partners.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No partner verification data available
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Partner Verification Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner Name</TableHead>
                        <TableHead className="text-right">Total Attempts</TableHead>
                        <TableHead className="text-right">Successful</TableHead>
                        <TableHead className="text-right">Failed</TableHead>
                        <TableHead className="text-right">Success Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow key={partner.partnerId}>
                          <TableCell className="font-medium">{partner.partnerName}</TableCell>
                          <TableCell className="text-right">{partner.total.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{partner.success.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{partner.failed.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={partner.successRate >= 95 ? 'default' : partner.successRate >= 90 ? 'secondary' : 'destructive'}>
                              {partner.successRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="efficacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual vs EHR Path Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {pathLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pathComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="metric" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Manual" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="EHR" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Manual Entry</h4>
                        <p className="text-sm text-muted-foreground">
                          Completion Rate: <span className="font-medium text-foreground">{pathPerformance?.manual.completionRate.toFixed(1)}%</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Eligibility Rate: <span className="font-medium text-foreground">{pathPerformance?.manual.eligibilityRate.toFixed(1)}%</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">EHR Fast Path</h4>
                        <p className="text-sm text-muted-foreground">
                          Completion Rate: <span className="font-medium text-foreground">{pathPerformance?.ehr.completionRate.toFixed(1)}%</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Eligibility Rate: <span className="font-medium text-foreground">{pathPerformance?.ehr.eligibilityRate.toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Failure Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                {outcomesLoading ? (
                  <Skeleton className="h-96 w-full" />
                ) : outcomes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No failure data available
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question ID</TableHead>
                        <TableHead>Answer</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outcomes.slice(0, 10).map((item, index) => (
                        <TableRow key={`${item.questionId}-${item.answer}-${index}`}>
                          <TableCell className="font-mono text-sm">{item.questionId}</TableCell>
                          <TableCell>{item.answer}</TableCell>
                          <TableCell>
                            <Badge variant={item.outcome === 'do_not_use' ? 'destructive' : 'secondary'}>
                              {item.outcome.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
