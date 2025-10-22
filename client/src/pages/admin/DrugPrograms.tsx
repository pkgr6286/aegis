import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { drugProgramSchema, type DrugProgramFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Pill, Edit, Trash2, Eye, FileText } from 'lucide-react';
import type { DrugProgram } from '@/types/drugProgram';
import type { BrandConfig } from '@/types/brand';

export default function DrugPrograms() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<DrugProgram | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<DrugProgram | null>(null);

  // Form setup
  const form = useForm<DrugProgramFormData>({
    resolver: zodResolver(drugProgramSchema),
    defaultValues: {
      name: '',
      brandName: '',
      status: 'draft',
    },
  });

  // Fetch drug programs
  const { data: programsData, isLoading } = useQuery({
    queryKey: ['/api/v1/admin/drug-programs'],
  });

  const programs = (programsData as { success: boolean; data: DrugProgram[] })?.data || [];

  // Fetch brand configs for the dropdown
  const { data: brandsData } = useQuery({
    queryKey: ['/api/v1/admin/brand-configs'],
  });

  const brands = (brandsData as { success: boolean; data: BrandConfig[] })?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: DrugProgramFormData) => {
      return await apiClient.post<{ success: boolean; data: DrugProgram }>(
        '/admin/drug-programs',
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/drug-programs'] });
      toast({
        title: 'Program created',
        description: 'Drug program created successfully',
      });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create drug program',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DrugProgramFormData }) => {
      return await apiClient.put<{ success: boolean; data: DrugProgram }>(
        `/admin/drug-programs/${id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/drug-programs'] });
      toast({
        title: 'Program updated',
        description: 'Drug program updated successfully',
      });
      setEditingProgram(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update drug program',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(
        `/admin/drug-programs/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/drug-programs'] });
      toast({
        title: 'Program deleted',
        description: 'Drug program deleted successfully',
      });
      setDeletingProgram(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete drug program',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    form.reset({
      name: '',
      brandName: '',
      status: 'draft',
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (program: DrugProgram) => {
    form.reset({
      name: program.name,
      brandName: program.brandName || '',
      brandConfigId: program.brandConfigId,
      status: program.status,
    });
    setEditingProgram(program);
  };

  const handleSubmit = (data: DrugProgramFormData) => {
    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleView = (programId: string) => {
    setLocation(`/admin/programs/${programId}`);
  };

  const handleDelete = (program: DrugProgram) => {
    setDeletingProgram(program);
  };

  const confirmDelete = () => {
    if (deletingProgram) {
      deleteMutation.mutate(deletingProgram.id);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Drug Programs</h1>
            <p className="text-muted-foreground">Loading programs...</p>
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
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Drug Programs</h1>
          <p className="text-muted-foreground">
            Manage drug programs and patient screening workflows
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-program">
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            All Programs ({programs.length})
          </CardTitle>
          <CardDescription>
            Drug programs with screening workflows and versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Pill className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No drug programs yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first drug program to start screening patients
              </p>
              <Button onClick={handleCreate} data-testid="button-create-first-program">
                <Plus className="w-4 h-4 mr-2" />
                Create Program
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active Version</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id} data-testid={`row-program-${program.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${program.id}`}>
                      <div>
                        <div>{program.name}</div>
                        {program.brandName && (
                          <div className="text-xs text-muted-foreground">{program.brandName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-brand-${program.id}`}>
                      {program.brandConfig?.name || 'No Brand'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(program.status)}
                        data-testid={`badge-status-${program.id}`}
                      >
                        {program.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`text-version-${program.id}`}>
                      {program.activeScreenerVersion
                        ? `v${program.activeScreenerVersion.version}`
                        : 'No Version'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(program.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(program.id)}
                          data-testid={`button-view-${program.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(program)}
                          data-testid={`button-edit-${program.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(program)}
                          data-testid={`button-delete-${program.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || !!editingProgram} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditingProgram(null);
          form.reset();
        }
      }}>
        <DialogContent data-testid="dialog-program-form">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingProgram ? 'Edit Program' : 'Create Program'}
            </DialogTitle>
            <DialogDescription>
              Configure a drug program with patient screening workflow
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
              {/* Program Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name (Internal) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-program-name"
                        placeholder="e.g., Crestor OTC 5mg Program"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Brand Name */}
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name (Consumer-Facing)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-brand-name"
                        placeholder="e.g., Crestor-OTC"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Brand Config */}
              <FormField
                control={form.control}
                name="brandConfigId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Configuration (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-brand-config">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none" data-testid="option-no-brand">No Brand</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id} data-testid={`option-brand-${brand.id}`}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft" data-testid="option-draft">Draft</SelectItem>
                        <SelectItem value="active" data-testid="option-active">Active</SelectItem>
                        <SelectItem value="archived" data-testid="option-archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setEditingProgram(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {(createMutation.isPending || updateMutation.isPending) && 'Saving...'}
                  {!createMutation.isPending && !updateMutation.isPending && (editingProgram ? 'Update' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProgram} onOpenChange={(open) => !open && setDeletingProgram(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Drug Program?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProgram?.name}"? This action cannot be undone.
              All associated screener versions and data will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Program'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
