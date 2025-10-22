import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { brandConfigSchema, type BrandConfigFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Palette, Trash2, Edit } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import type { BrandConfig } from '@/types/brand';

export default function BrandManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandConfig | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<BrandConfig | null>(null);

  // Form setup
  const form = useForm<BrandConfigFormData>({
    resolver: zodResolver(brandConfigSchema),
    defaultValues: {
      name: '',
      config: {
        logoUrl: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
      },
    },
  });

  // Fetch brands
  const { data: brandsData, isLoading } = useQuery({
    queryKey: ['/api/v1/admin/brand-configs'],
  });

  const brands = (brandsData as { success: boolean; data: BrandConfig[] })?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: BrandConfigFormData) => {
      return await apiClient.post<{ success: boolean; data: BrandConfig }>(
        '/api/v1/admin/brand-configs',
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/brand-configs'] });
      toast({
        title: 'Brand created',
        description: 'Brand configuration created successfully',
      });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create brand',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BrandConfigFormData }) => {
      return await apiClient.put<{ success: boolean; data: BrandConfig }>(
        `/api/v1/admin/brand-configs/${id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/brand-configs'] });
      toast({
        title: 'Brand updated',
        description: 'Brand configuration updated successfully',
      });
      setEditingBrand(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update brand',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(
        `/api/v1/admin/brand-configs/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/brand-configs'] });
      toast({
        title: 'Brand deleted',
        description: 'Brand configuration deleted successfully',
      });
      setDeletingBrand(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete brand',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    form.reset({
      name: '',
      config: {
        logoUrl: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
      },
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (brand: BrandConfig) => {
    form.reset({
      name: brand.name,
      config: {
        logoUrl: brand.config.logoUrl || '',
        primaryColor: brand.config.primaryColor || '#3b82f6',
        secondaryColor: brand.config.secondaryColor || '#8b5cf6',
      },
    });
    setEditingBrand(brand);
  };

  const handleSubmit = (data: BrandConfigFormData) => {
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (brand: BrandConfig) => {
    setDeletingBrand(brand);
  };

  const confirmDelete = () => {
    if (deletingBrand) {
      deleteMutation.mutate(deletingBrand.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Brand Management</h1>
            <p className="text-muted-foreground">Loading brands...</p>
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
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Brand Management</h1>
          <p className="text-muted-foreground">
            Configure brand identities for your drug programs
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-brand">
          <Plus className="w-4 h-4 mr-2" />
          Create Brand
        </Button>
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Palette className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No brands configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first brand configuration to customize the patient experience
            </p>
            <Button onClick={handleCreate} data-testid="button-create-first-brand">
              <Plus className="w-4 h-4 mr-2" />
              Create Brand
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Card key={brand.id} data-testid={`card-brand-${brand.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid={`text-name-${brand.id}`}>
                  <Palette className="w-5 h-5" />
                  {brand.name}
                </CardTitle>
                <CardDescription>Brand Configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {brand.config.logoUrl && (
                  <div>
                    <p className="text-sm font-medium mb-2">Logo</p>
                    <img
                      src={brand.config.logoUrl}
                      alt={brand.name}
                      className="h-12 object-contain"
                      data-testid={`img-logo-${brand.id}`}
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-2">Colors</p>
                  <div className="flex gap-2">
                    {brand.config.primaryColor && (
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-12 h-12 rounded-md border"
                          style={{ backgroundColor: brand.config.primaryColor }}
                          data-testid={`color-primary-${brand.id}`}
                        />
                        <span className="text-xs text-muted-foreground">Primary</span>
                      </div>
                    )}
                    {brand.config.secondaryColor && (
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-12 h-12 rounded-md border"
                          style={{ backgroundColor: brand.config.secondaryColor }}
                          data-testid={`color-secondary-${brand.id}`}
                        />
                        <span className="text-xs text-muted-foreground">Secondary</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(brand)}
                  className="flex-1"
                  data-testid={`button-edit-${brand.id}`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(brand)}
                  data-testid={`button-delete-${brand.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || !!editingBrand} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditingBrand(null);
          form.reset();
        }
      }}>
        <DialogContent data-testid="dialog-brand-form">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingBrand ? 'Edit Brand' : 'Create Brand'}
            </DialogTitle>
            <DialogDescription>
              Configure brand identity with logo and colors
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
              {/* Brand Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-brand-name"
                        placeholder="e.g., Crestor"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Logo URL */}
              <FormField
                control={form.control}
                name="config.logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-logo-url"
                        placeholder="https://example.com/logo.png"
                      />
                    </FormControl>
                    <FormDescription>Optional: URL to brand logo image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Primary Color */}
              <FormField
                control={form.control}
                name="config.primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <HexColorPicker
                          color={field.value || '#3b82f6'}
                          onChange={field.onChange}
                          data-testid="picker-primary-color"
                        />
                        <Input
                          {...field}
                          data-testid="input-primary-color"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Secondary Color */}
              <FormField
                control={form.control}
                name="config.secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <HexColorPicker
                          color={field.value || '#8b5cf6'}
                          onChange={field.onChange}
                          data-testid="picker-secondary-color"
                        />
                        <Input
                          {...field}
                          data-testid="input-secondary-color"
                          placeholder="#8b5cf6"
                        />
                      </div>
                    </FormControl>
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
                    setEditingBrand(null);
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
                  {!createMutation.isPending && !updateMutation.isPending && (editingBrand ? 'Update' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBrand} onOpenChange={(open) => !open && setDeletingBrand(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBrand?.name}"? This action cannot be undone.
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
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Brand'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
