import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Palette, Trash2, Edit } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import type { BrandConfig, CreateBrandConfigInput, UpdateBrandConfigInput } from '@/types/brand';

export default function BrandManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandConfig | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<BrandConfig | null>(null);
  const [formData, setFormData] = useState<CreateBrandConfigInput>({
    name: '',
    config: {
      logoUrl: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
    },
  });

  // Fetch brands
  const { data: brandsData, isLoading } = useQuery({
    queryKey: ['/api/v1/admin/brand-configs'],
  });

  const brands = (brandsData as { success: boolean; data: BrandConfig[] })?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateBrandConfigInput) => {
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
      resetForm();
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateBrandConfigInput }) => {
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
      resetForm();
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

  const resetForm = () => {
    setFormData({
      name: '',
      config: {
        logoUrl: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
      },
    });
  };

  const handleCreate = () => {
    setFormData({
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
    setFormData({
      name: brand.name,
      config: {
        logoUrl: brand.config.logoUrl || '',
        primaryColor: brand.config.primaryColor || '#3b82f6',
        secondaryColor: brand.config.secondaryColor || '#8b5cf6',
      },
    });
    setEditingBrand(brand);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Brand name is required',
        variant: 'destructive',
      });
      return;
    }

    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
            Configure brand assets and colors for your drug programs
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
              Create your first brand configuration to customize the appearance of your drug programs
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
            <Card key={brand.id} className="hover-elevate" data-testid={`card-brand-${brand.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span data-testid={`text-brand-name-${brand.id}`}>{brand.name}</span>
                  <Palette className="w-5 h-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Brand Configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Preview */}
                {brand.config.logoUrl && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Logo</Label>
                    <div className="mt-1 flex items-center justify-center h-20 bg-muted rounded-md overflow-hidden">
                      <img
                        src={brand.config.logoUrl}
                        alt={`${brand.name} logo`}
                        className="max-h-full max-w-full object-contain"
                        data-testid={`img-brand-logo-${brand.id}`}
                      />
                    </div>
                  </div>
                )}

                {/* Color Swatches */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-24">Primary</Label>
                    <div
                      className="w-12 h-8 rounded border"
                      style={{ backgroundColor: brand.config.primaryColor || '#3b82f6' }}
                      data-testid={`swatch-primary-${brand.id}`}
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {brand.config.primaryColor || '#3b82f6'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-24">Secondary</Label>
                    <div
                      className="w-12 h-8 rounded border"
                      style={{ backgroundColor: brand.config.secondaryColor || '#8b5cf6' }}
                      data-testid={`swatch-secondary-${brand.id}`}
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {brand.config.secondaryColor || '#8b5cf6'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(brand)}
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
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
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
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-brand-form">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingBrand ? 'Edit Brand' : 'Create Brand'}
            </DialogTitle>
            <DialogDescription>
              Configure brand assets and colors for your drug programs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                data-testid="input-brand-name"
                placeholder="e.g., Kenvue Primary Brand"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                data-testid="input-logo-url"
                type="url"
                placeholder="https://example.com/logo.png"
                value={formData.config.logoUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, logoUrl: e.target.value },
                  })
                }
              />
              {formData.config.logoUrl && (
                <div className="mt-2 flex items-center justify-center h-24 bg-muted rounded-md overflow-hidden">
                  <img
                    src={formData.config.logoUrl}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <HexColorPicker
                    color={formData.config.primaryColor}
                    onChange={(color) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, primaryColor: color },
                      })
                    }
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="space-y-2 w-32">
                  <Input
                    id="primaryColor"
                    data-testid="input-primary-color"
                    value={formData.config.primaryColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, primaryColor: e.target.value },
                      })
                    }
                    placeholder="#3b82f6"
                  />
                  <div
                    className="w-full h-12 rounded border"
                    style={{ backgroundColor: formData.config.primaryColor }}
                  />
                </div>
              </div>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <HexColorPicker
                    color={formData.config.secondaryColor}
                    onChange={(color) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, secondaryColor: color },
                      })
                    }
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="space-y-2 w-32">
                  <Input
                    id="secondaryColor"
                    data-testid="input-secondary-color"
                    value={formData.config.secondaryColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, secondaryColor: e.target.value },
                      })
                    }
                    placeholder="#8b5cf6"
                  />
                  <div
                    className="w-full h-12 rounded border"
                    style={{ backgroundColor: formData.config.secondaryColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditingBrand(null);
                resetForm();
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {(createMutation.isPending || updateMutation.isPending) && 'Saving...'}
              {!createMutation.isPending && !updateMutation.isPending && (editingBrand ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBrand} onOpenChange={(open) => !open && setDeletingBrand(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBrand?.name}"? This action cannot be undone.
              Any drug programs using this brand will need to be reconfigured.
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
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
