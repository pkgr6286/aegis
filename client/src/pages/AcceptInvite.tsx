import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { acceptInviteSchema, type AcceptInviteFormData } from '@/lib/schemas';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus } from 'lucide-react';

export default function AcceptInvite() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  // Extract token from URL query parameters
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const form = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      token,
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid Invitation Link',
        description: 'The invitation link is invalid or missing the token.',
        variant: 'destructive',
      });
      setTimeout(() => setLocation('/login'), 2000);
    }
  }, [token, setLocation, toast]);

  const mutation = useMutation({
    mutationFn: async (data: AcceptInviteFormData) => {
      const res = await fetch('/api/v1/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: data.token,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to accept invitation');
      }

      return res.json();
    },
    onSuccess: (response) => {
      toast({
        title: 'Welcome to Aegis!',
        description: 'Your account has been created successfully.',
      });
      
      // Auto-login with returned token
      if (response.data?.token) {
        login(response.data.token, response.data.user);
        // Redirect will happen automatically via AuthContext
      } else {
        setTimeout(() => setLocation('/login'), 2000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Invitation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AcceptInviteFormData) => {
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
              <UserPlus className="h-6 w-6 text-primary" data-testid="icon-user-plus" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">You've Been Invited</CardTitle>
          <CardDescription className="text-center">
            Complete your profile to join the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="John"
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Doe"
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="Create a password"
                        data-testid="input-password"
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="Confirm your password"
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
                data-testid="button-accept-invite"
              >
                {mutation.isPending ? 'Creating Account...' : 'Accept & Create Account'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
