import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import type { Tenant, PaginatedResponse, CreateTenantRequest, UpdateLicenseRequest, InviteAdminRequest } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, UserPlus, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  // Form states
  const [newTenantName, setNewTenantName] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [editMaxPrograms, setEditMaxPrograms] = useState<string>('');
  const [editEhrEnabled, setEditEhrEnabled] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['/superadmin/tenants', { page, status: statusFilter, search: searchQuery }],
    queryFn: () => {
      let url = `/superadmin/tenants?page=${page}&limit=10`;
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      return apiClient.get<PaginatedResponse<Tenant>>(url);
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: CreateTenantRequest) =>
      apiClient.post<{ success: boolean; data: Tenant }>('/superadmin/tenants', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/superadmin/tenants'] });
      toast({ title: 'Success', description: 'Tenant created successfully' });
      setCreateModalOpen(false);
      setNewTenantName('');
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const updateLicenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLicenseRequest }) =>
      apiClient.put<{ success: boolean }>(`/superadmin/tenants/${id}/license`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/superadmin/tenants'] });
      toast({ title: 'Success', description: 'License updated successfully' });
      setEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const inviteAdminMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InviteAdminRequest }) =>
      apiClient.post<{ success: boolean }>(`/superadmin/tenants/${id}/invite`, data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Admin invitation sent successfully' });
      setInviteModalOpen(false);
      setInviteEmail('');
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditStatus(tenant.status);
    setEditMaxPrograms(tenant.maxDrugPrograms?.toString() || '');
    setEditEhrEnabled(tenant.ehrIntegrationEnabled);
    setEditModalOpen(true);
  };

  const handleInviteClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setInviteModalOpen(true);
  };

  const statusColors: Record<string, string> = {
    active: 'bg-success/10 text-success border-success/20',
    inactive: 'bg-muted/10 text-muted-foreground border-muted/20',
    suspended: 'bg-warning/10 text-warning border-warning/20',
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Tenant Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer tenants and their licenses
          </p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-tenant">
              <Plus className="w-4 h-4" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Add a new customer tenant to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Acme Pharmaceuticals"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  data-testid="input-company-name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createTenantMutation.mutate({ companyName: newTenantName })}
                disabled={!newTenantName || createTenantMutation.isPending}
                data-testid="button-submit-create-tenant"
              >
                {createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-tenants"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Tenant ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Users</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : tenants?.data && tenants.data.length > 0 ? (
                tenants.data.map((tenant) => (
                  <TableRow key={tenant.id} data-testid={`tenant-row-${tenant.id}`}>
                    <TableCell className="font-medium">{tenant.companyName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {tenant.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[tenant.status]} variant="outline">
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.activeUsersCount || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(tenant.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(tenant)}
                          data-testid={`button-edit-license-${tenant.id}`}
                        >
                          <Edit className="w-3 h-3" />
                          Edit License
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInviteClick(tenant)}
                          data-testid={`button-invite-admin-${tenant.id}`}
                        >
                          <UserPlus className="w-3 h-3" />
                          Invite Admin
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No tenants found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit License Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit License</DialogTitle>
            <DialogDescription>
              Update license settings for {selectedTenant?.companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                <SelectTrigger id="status" data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-programs">Max Drug Programs</Label>
              <Input
                id="max-programs"
                type="number"
                placeholder="Unlimited (leave empty)"
                value={editMaxPrograms}
                onChange={(e) => setEditMaxPrograms(e.target.value)}
                data-testid="input-max-programs"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ehr-enabled">EHR Integration Enabled</Label>
              <Switch
                id="ehr-enabled"
                checked={editEhrEnabled}
                onCheckedChange={setEditEhrEnabled}
                data-testid="switch-ehr-enabled"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedTenant &&
                updateLicenseMutation.mutate({
                  id: selectedTenant.id,
                  data: {
                    status: editStatus,
                    maxDrugPrograms: editMaxPrograms ? parseInt(editMaxPrograms) : null,
                    ehrIntegrationEnabled: editEhrEnabled,
                  },
                })
              }
              disabled={updateLicenseMutation.isPending}
              data-testid="button-submit-edit-license"
            >
              {updateLicenseMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Admin Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Admin</DialogTitle>
            <DialogDescription>
              Send an invitation to a new admin for {selectedTenant?.companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="admin@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                data-testid="input-invite-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedTenant &&
                inviteAdminMutation.mutate({
                  id: selectedTenant.id,
                  data: { email: inviteEmail },
                })
              }
              disabled={!inviteEmail || inviteAdminMutation.isPending}
              data-testid="button-submit-invite-admin"
            >
              {inviteAdminMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
