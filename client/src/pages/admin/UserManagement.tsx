import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { inviteUserSchema, type InviteUserFormData } from '@/lib/schemas';
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
import { UserPlus, Trash2, Users, Shield, Eye, Edit3 } from 'lucide-react';
import type { TenantUser } from '@/types/tenantUser';

export default function UserManagement() {
  const { toast } = useToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [removingUser, setRemovingUser] = useState<TenantUser | null>(null);

  // Form setup
  const form = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      fullName: '',
      role: 'viewer',
    },
  });

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/v1/admin/users'],
  });

  const users = (usersData as { success: boolean; data: TenantUser[] })?.data || [];

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteUserFormData) => {
      return await apiClient.post<{ success: boolean; data: TenantUser }>(
        '/admin/users/invite',
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/users'] });
      toast({
        title: 'User invited',
        description: 'Invitation sent successfully',
      });
      setInviteDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite user',
        variant: 'destructive',
      });
    },
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiClient.delete<{ success: boolean }>(
        `/admin/users/${userId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/users'] });
      toast({
        title: 'User removed',
        description: 'User removed from tenant successfully',
      });
      setRemovingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove user',
        variant: 'destructive',
      });
    },
  });

  const handleInvite = () => {
    form.reset({
      email: '',
      fullName: '',
      role: 'viewer',
    });
    setInviteDialogOpen(true);
  };

  const handleSubmit = (data: InviteUserFormData) => {
    inviteMutation.mutate(data);
  };

  const handleRemove = (user: TenantUser) => {
    setRemovingUser(user);
  };

  const confirmRemove = () => {
    if (removingUser) {
      removeMutation.mutate(removingUser.userId);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'editor':
        return <Edit3 className="w-4 h-4" />;
      case 'viewer':
        return <Eye className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Loading users...</p>
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
          <h1 className="text-3xl font-bold" data-testid="text-page-title">User Management</h1>
          <p className="text-muted-foreground">
            Manage user access and roles for your tenant
          </p>
        </div>
        <Button onClick={handleInvite} data-testid="button-invite-user">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tenant Users ({users.length})
          </CardTitle>
          <CardDescription>
            Users with access to this tenant and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Invite users to collaborate on this tenant
              </p>
              <Button onClick={handleInvite} data-testid="button-invite-first-user">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.userId}`}>
                    <TableCell className="font-medium" data-testid={`text-email-${user.userId}`}>
                      {user.email || 'N/A'}
                    </TableCell>
                    <TableCell data-testid={`text-name-${user.userId}`}>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleVariant(user.role)}
                        className="flex items-center gap-1 w-fit"
                        data-testid={`badge-role-${user.userId}`}
                      >
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.joinedAt
                        ? new Date(user.joinedAt).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(user)}
                        data-testid={`button-remove-${user.userId}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setInviteDialogOpen(false);
          form.reset();
        }
      }}>
        <DialogContent data-testid="dialog-invite-user">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to a new user to join this tenant
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-email"
                        type="email"
                        placeholder="user@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-full-name"
                        placeholder="John Doe"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="viewer" data-testid="option-viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Viewer</div>
                              <div className="text-xs text-muted-foreground">Read-only access</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="editor" data-testid="option-editor">
                          <div className="flex items-center gap-2">
                            <Edit3 className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Editor</div>
                              <div className="text-xs text-muted-foreground">Can create and edit content</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin" data-testid="option-admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Admin</div>
                              <div className="text-xs text-muted-foreground">Full access and user management</div>
                            </div>
                          </div>
                        </SelectItem>
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
                    setInviteDialogOpen(false);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  data-testid="button-submit"
                >
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={!!removingUser} onOpenChange={(open) => !open && setRemovingUser(null)}>
        <AlertDialogContent data-testid="dialog-remove-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removingUser?.email} from this tenant?
              They will lose all access to tenant resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              disabled={removeMutation.isPending}
              data-testid="button-confirm-remove"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
