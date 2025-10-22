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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Store, ShoppingCart, Key, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import type { Partner, CreatePartnerInput, GenerateApiKeyInput, GenerateApiKeyResponse, PartnerApiKey } from '@/types/partner';

export default function PartnerManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [generateKeyDialogOpen, setGenerateKeyDialogOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [revokingKey, setRevokingKey] = useState<PartnerApiKey | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const [formData, setFormData] = useState<CreatePartnerInput>({
    name: '',
    type: 'ecommerce',
    status: 'active',
  });

  const [keyFormData, setKeyFormData] = useState<GenerateApiKeyInput>({
    description: '',
    expiresInDays: undefined,
  });

  // Fetch partners
  const { data: partnersData, isLoading } = useQuery({
    queryKey: ['/api/v1/admin/partners'],
  });

  const partners = (partnersData as { success: boolean; data: Partner[] })?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreatePartnerInput) => {
      return await apiClient.post<{ success: boolean; data: Partner }>(
        '/api/v1/admin/partners',
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/partners'] });
      toast({
        title: 'Partner created',
        description: 'Partner created successfully',
      });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create partner',
        variant: 'destructive',
      });
    },
  });

  // Generate API key mutation
  const generateKeyMutation = useMutation({
    mutationFn: async ({ partnerId, data }: { partnerId: string; data: GenerateApiKeyInput }) => {
      return await apiClient.post<{ success: boolean; data: GenerateApiKeyResponse }>(
        `/api/v1/admin/partners/${partnerId}/keys`,
        data
      );
    },
    onSuccess: (response) => {
      const rawKey = response.data?.rawKey;
      if (rawKey) {
        setGeneratedKey(rawKey);
        setShowKey(true);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/partners'] });
      toast({
        title: 'API key generated',
        description: 'Save the key - it will not be shown again!',
      });
      setGenerateKeyDialogOpen(false);
      resetKeyForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate API key',
        variant: 'destructive',
      });
    },
  });

  // Revoke key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: async ({ partnerId, keyId }: { partnerId: string; keyId: string }) => {
      return await apiClient.delete<{ success: boolean }>(
        `/api/v1/admin/partners/${partnerId}/keys/${keyId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/partners'] });
      toast({
        title: 'API key revoked',
        description: 'API key revoked successfully',
      });
      setRevokingKey(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke API key',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'ecommerce',
      status: 'active',
    });
  };

  const resetKeyForm = () => {
    setKeyFormData({
      description: '',
      expiresInDays: undefined,
    });
  };

  const handleCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Partner name is required',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleGenerateKey = (partner: Partner) => {
    setSelectedPartner(partner);
    resetKeyForm();
    setGenerateKeyDialogOpen(true);
  };

  const handleSubmitKey = () => {
    if (selectedPartner) {
      generateKeyMutation.mutate({ partnerId: selectedPartner.id, data: keyFormData });
    }
  };

  const handleRevokeKey = (partner: Partner, key: PartnerApiKey) => {
    setSelectedPartner(partner);
    setRevokingKey(key);
  };

  const confirmRevoke = () => {
    if (selectedPartner && revokingKey) {
      revokeKeyMutation.mutate({ partnerId: selectedPartner.id, keyId: revokingKey.id });
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
    });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getPartnerIcon = (type: string) => {
    return type === 'ecommerce' ? <ShoppingCart className="w-5 h-5" /> : <Store className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Partner Management</h1>
            <p className="text-muted-foreground">Loading partners...</p>
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
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Partner Management</h1>
          <p className="text-muted-foreground">
            Manage B2B partners and their API access
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-partner">
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Partners Grid */}
      {partners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Store className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No partners yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add B2B partners to enable verification at their checkout
            </p>
            <Button onClick={handleCreate} data-testid="button-create-first-partner">
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <Card key={partner.id} className="hover-elevate" data-testid={`card-partner-${partner.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span data-testid={`text-partner-name-${partner.id}`}>{partner.name}</span>
                  {getPartnerIcon(partner.type)}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant={partner.status === 'active' ? 'default' : 'secondary'} data-testid={`badge-status-${partner.id}`}>
                    {partner.status}
                  </Badge>
                  <span className="capitalize">{partner.type.replace('_', ' ')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Keys Summary */}
                <div>
                  <Label className="text-xs text-muted-foreground">API Keys</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {partner.apiKeys?.filter(k => !k.revokedAt).length || 0} active
                    </span>
                  </div>
                </div>

                {/* API Keys List */}
                {partner.apiKeys && partner.apiKeys.length > 0 && (
                  <div className="space-y-2">
                    {partner.apiKeys.slice(0, 2).map((key) => (
                      <div key={key.id} className="flex items-center justify-between text-sm border rounded p-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs truncate">
                            {key.description || 'API Key'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {key.revokedAt ? 'Revoked' : 'Active'}
                          </div>
                        </div>
                        {!key.revokedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeKey(partner, key)}
                            data-testid={`button-revoke-${key.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateKey(partner)}
                  data-testid={`button-generate-key-${partner.id}`}
                  className="flex-1"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Generate Key
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Partner Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent data-testid="dialog-create-partner">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">Add Partner</DialogTitle>
            <DialogDescription>
              Create a new B2B partner for verification integration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Partner Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Partner Name *</Label>
              <Input
                id="name"
                data-testid="input-partner-name"
                placeholder="e.g., CVS E-Commerce"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Partner Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'ecommerce' | 'retail_pos') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type" data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecommerce" data-testid="option-ecommerce">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span>E-Commerce</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="retail_pos" data-testid="option-retail-pos">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span>Retail POS</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" data-testid="option-active">Active</SelectItem>
                  <SelectItem value="inactive" data-testid="option-inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate API Key Dialog */}
      <Dialog open={generateKeyDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setGenerateKeyDialogOpen(false);
          resetKeyForm();
        }
      }}>
        <DialogContent data-testid="dialog-generate-key">
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for {selectedPartner?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                data-testid="input-key-description"
                placeholder="e.g., Production API Key"
                value={keyFormData.description}
                onChange={(e) => setKeyFormData({ ...keyFormData, description: e.target.value })}
              />
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiresInDays">Expires In Days (Optional)</Label>
              <Input
                id="expiresInDays"
                data-testid="input-expires-days"
                type="number"
                placeholder="Leave empty for no expiration"
                value={keyFormData.expiresInDays || ''}
                onChange={(e) =>
                  setKeyFormData({
                    ...keyFormData,
                    expiresInDays: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGenerateKeyDialogOpen(false);
                resetKeyForm();
              }}
              data-testid="button-cancel-key"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitKey}
              disabled={generateKeyMutation.isPending}
              data-testid="button-submit-key"
            >
              {generateKeyMutation.isPending ? 'Generating...' : 'Generate Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Key Display */}
      <AlertDialog open={!!generatedKey} onOpenChange={(open) => !open && setGeneratedKey(null)}>
        <AlertDialogContent data-testid="dialog-generated-key">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Key Generated
            </AlertDialogTitle>
            <AlertDialogDescription>
              Save this API key now. For security reasons, it will not be shown again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-muted p-4 rounded-md space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-sm break-all" data-testid="text-generated-key">
                {showKey ? generatedKey : '•'.repeat(40)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKey(!showKey)}
                data-testid="button-toggle-visibility"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => generatedKey && copyToClipboard(generatedKey)}
                data-testid="button-copy-key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction data-testid="button-close-key">I've Saved the Key</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokingKey} onOpenChange={(open) => !open && setRevokingKey(null)}>
        <AlertDialogContent data-testid="dialog-revoke-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this API key? The partner will lose access immediately.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-revoke">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevoke}
              disabled={revokeKeyMutation.isPending}
              data-testid="button-confirm-revoke"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeKeyMutation.isPending ? 'Revoking...' : 'Revoke Key'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
