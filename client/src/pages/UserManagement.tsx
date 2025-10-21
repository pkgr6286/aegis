import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import type { SystemUser, PaginatedResponse, InviteSystemUserRequest } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, UserX } from 'lucide-react';
import { format } from 'date-fns';

export default function UserManagement() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [revokeAlertOpen, setRevokeAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'super_admin' | 'support_staff'>('support_staff');

  const { data: users, isLoading } = useQuery({
    queryKey: ['/superadmin/users', { page }],
    queryFn: () =>
      apiClient.get<PaginatedResponse<SystemUser>>(`/superadmin/users?page=${page}&limit=10`),
  });

  const inviteUserMutation = useMutation({
    mutationFn: (data: InviteSystemUserRequest) =>
      apiClient.post<{ success: boolean }>('/superadmin/users/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/superadmin/users'] });
      toast({ title: 'Success', description: 'User invitation sent successfully' });
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('support_staff');
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete<{ success: boolean }>(`/superadmin/users/${userId}/role`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/superadmin/users'] });
      toast({ title: 'Success', description: 'User access revoked successfully' });
      setRevokeAlertOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const handleRevokeClick = (user: SystemUser) => {
    setSelectedUser(user);
    setRevokeAlertOpen(true);
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-primary/10 text-primary border-primary/20',
    support_staff: 'bg-muted/10 text-muted-foreground border-muted/20',
  };

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    support_staff: 'Support Staff',
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage system-level users and administrators
          </p>
        </div>
        <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-invite-system-user">
              <Plus className="w-4 h-4" />
              Invite System User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite System User</DialogTitle>
              <DialogDescription>
                Send an invitation to a new system-level user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">Email Address</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  data-testid="input-user-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">System Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v: any) => setInviteRole(v)}
                >
                  <SelectTrigger id="user-role" data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="support_staff">Support Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole })
                }
                disabled={!inviteEmail || inviteUserMutation.isPending}
                data-testid="button-submit-invite-user"
              >
                {inviteUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : users?.data && users.data.length > 0 ? (
                users.data.map((user) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.firstName || '—'}</TableCell>
                    <TableCell>{user.lastName || '—'}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.systemRole]} variant="outline">
                        {roleLabels[user.systemRole]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLoginAt
                        ? format(new Date(user.lastLoginAt), 'MMM d, yyyy h:mm a')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeClick(user)}
                        data-testid={`button-revoke-access-${user.id}`}
                      >
                        <UserX className="w-3 h-3" />
                        Revoke Access
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No system users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revoke Access Confirmation */}
      <AlertDialog open={revokeAlertOpen} onOpenChange={setRevokeAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke system access for {selectedUser?.email}. They will no longer be
              able to access the platform. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && revokeAccessMutation.mutate(selectedUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-revoke-access"
            >
              {revokeAccessMutation.isPending ? 'Revoking...' : 'Revoke Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
