import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/schemas';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Extract token from URL query parameters
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid Reset Link',
        description: 'The reset link is invalid or missing the token.',
        variant: 'destructive',
      });
      setTimeout(() => setLocation('/login'), 2000);
    }
  }, [token, setLocation, toast]);

  const mutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: data.token,
          newPassword: data.newPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reset password');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now log in with your new password.',
      });
      setTimeout(() => setLocation('/login'), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Reset Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    mutation.mutate(data);
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" data-testid="icon-lock" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="Enter new password"
                        data-testid="input-new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="Confirm new password"
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={mutation.isPending}
                data-testid="button-reset-password"
              >
                {mutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
