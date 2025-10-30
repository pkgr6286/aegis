import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pill, Edit, Plus, FileCode, Eye, Calendar } from 'lucide-react';
import type { DrugProgram, ScreenerVersion } from '@/types/drugProgram';

export default function DrugProgramDetail() {
  const [, params] = useRoute('/admin/programs/:id');
  const [, setLocation] = useLocation();
  const programId = params?.id;

  // Fetch program details
  const { data: programData, isLoading: programLoading } = useQuery({
    queryKey: ['/admin/drug-programs', programId],
    enabled: !!programId,
  });

  const program = (programData as { success: boolean; data: DrugProgram })?.data;

  // Fetch screener versions
  const { data: versionsData, isLoading: versionsLoading } = useQuery({
    queryKey: ['/admin/drug-programs', programId, 'screeners'],
    enabled: !!programId,
  });

  const versions = (versionsData as { success: boolean; data: ScreenerVersion[] })?.data || [];

  const handleBack = () => {
    setLocation('/admin/programs');
  };

  const handleEdit = () => {
    // In a real implementation, this would open an edit modal or navigate to edit page
    console.log('Edit program:', programId);
  };

  const handleCreateVersion = () => {
    // Navigate to screener builder
    setLocation(`/admin/programs/${programId}/screener/new`);
  };

  const handleViewScreener = (versionId: string) => {
    setLocation(`/admin/programs/${programId}/screener/${versionId}`);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'published':
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!programId) {
    return (
      <div className="p-8">
        <p className="text-destructive">Invalid program ID</p>
      </div>
    );
  }

  if (programLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Pill className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Program Not Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            The requested drug program could not be found
          </p>
          <Button onClick={handleBack} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-program-name">
              <Pill className="w-8 h-8" />
              {program.name}
              <Badge variant={getStatusVariant(program.status)} data-testid="badge-status">
                {program.status}
              </Badge>
            </h1>
            {program.brandName && (
              <p className="text-muted-foreground" data-testid="text-brand-name">
                Consumer Brand: {program.brandName}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit} data-testid="button-edit-program">
            <Edit className="w-4 h-4 mr-2" />
            Edit Program
          </Button>
          <Button onClick={handleCreateVersion} data-testid="button-create-version">
            <Plus className="w-4 h-4 mr-2" />
            Create Screener Version
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="versions" data-testid="tab-versions">
            Screener Versions ({versions.length})
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Program Information */}
            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
                <CardDescription>Basic details about this drug program</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Internal Name</p>
                  <p className="text-lg" data-testid="text-internal-name">{program.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consumer Brand</p>
                  <p className="text-lg" data-testid="text-consumer-brand">
                    {program.brandName || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Public Slug</p>
                  <p className="text-lg font-mono" data-testid="text-slug">
                    {program.slug || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(program.status)}>
                    {program.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Brand Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Configuration</CardTitle>
                <CardDescription>Visual branding for patient experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {program.brandConfig ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Brand Name</p>
                      <p className="text-lg" data-testid="text-brand-config-name">
                        {program.brandConfig.name}
                      </p>
                    </div>
                    {program.brandConfig.config.logoUrl && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Logo</p>
                        <img
                          src={program.brandConfig.config.logoUrl}
                          alt={program.brandConfig.name}
                          className="h-12 object-contain"
                          data-testid="img-brand-logo"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Colors</p>
                      <div className="flex gap-2">
                        {program.brandConfig.config.primaryColor && (
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className="w-12 h-12 rounded-md border"
                              style={{ backgroundColor: program.brandConfig.config.primaryColor }}
                              data-testid="color-primary"
                            />
                            <span className="text-xs text-muted-foreground">Primary</span>
                          </div>
                        )}
                        {program.brandConfig.config.secondaryColor && (
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className="w-12 h-12 rounded-md border"
                              style={{ backgroundColor: program.brandConfig.config.secondaryColor }}
                              data-testid="color-secondary"
                            />
                            <span className="text-xs text-muted-foreground">Secondary</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground" data-testid="text-no-brand">
                    No brand configuration assigned
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Active Version */}
            <Card>
              <CardHeader>
                <CardTitle>Active Screener Version</CardTitle>
                <CardDescription>Currently published patient screening flow</CardDescription>
              </CardHeader>
              <CardContent>
                {program.activeScreenerVersion ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Version</p>
                      <p className="text-2xl font-bold" data-testid="text-active-version">
                        v{program.activeScreenerVersion.version}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={getStatusVariant(program.activeScreenerVersion.status)}>
                        {program.activeScreenerVersion.status}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewScreener(program.activeScreenerVersion!.id)}
                      data-testid="button-view-active-screener"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Screener
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground" data-testid="text-no-active-version">
                      No active version
                    </p>
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={handleCreateVersion}
                      data-testid="button-create-first-version"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Version
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>System timestamps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="flex items-center gap-2" data-testid="text-created-at">
                    <Calendar className="w-4 h-4" />
                    {new Date(program.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="flex items-center gap-2" data-testid="text-updated-at">
                    <Calendar className="w-4 h-4" />
                    {new Date(program.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Program ID</p>
                  <p className="font-mono text-xs" data-testid="text-program-id">{program.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Screener Versions Tab */}
        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Screener Versions</CardTitle>
                  <CardDescription>
                    All versions of the patient screening workflow
                  </CardDescription>
                </div>
                <Button onClick={handleCreateVersion} data-testid="button-create-version-tab">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {versionsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileCode className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No screener versions</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first screener version to start patient screening
                  </p>
                  <Button onClick={handleCreateVersion} data-testid="button-create-first-screener">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Screener Version
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => (
                      <TableRow key={version.id} data-testid={`row-version-${version.id}`}>
                        <TableCell className="font-medium" data-testid={`text-version-${version.id}`}>
                          v{version.version}
                          {version.id === program.activeScreenerVersionId && (
                            <Badge variant="default" className="ml-2">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(version.status)}
                            data-testid={`badge-status-${version.id}`}
                          >
                            {version.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {version.publishedAt
                            ? new Date(version.publishedAt).toLocaleDateString()
                            : 'Not published'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(version.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewScreener(version.id)}
                            data-testid={`button-view-${version.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Settings</CardTitle>
              <CardDescription>
                Advanced configuration options (Coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Settings panel will be available in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
