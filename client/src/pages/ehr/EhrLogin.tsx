/**
 * Mock EHR Provider Login Page
 * Simulates a patient portal login experience (e.g., MyChart, Epic)
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Hospital, Lock } from 'lucide-react';

export default function EhrLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Extract session and redirect info from URL params
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const redirectUri = params.get('redirect_uri');
  const ehrProvider = params.get('provider') || 'MyHealthPortal';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Navigate to consent page
    navigate(`/ehr/consent?session_id=${sessionId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&provider=${ehrProvider}&email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Provider Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Hospital className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{ehrProvider}</h1>
          <p className="text-sm text-muted-foreground">Secure Patient Portal</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>
              Access your health records securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" data-testid="label-email">Email or Username</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-ehr-email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" data-testid="label-password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    data-testid="link-forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-ehr-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-ehr-login"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                Don't have an account?{' '}
                <button className="text-primary hover:underline" data-testid="link-create-account">
                  Create one
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert className="border-primary/20 bg-primary/5">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs">
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              <span>Your health information is protected by HIPAA and encrypted end-to-end</span>
            </div>
          </AlertDescription>
        </Alert>

        {/* Demo Notice */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Demo Mode: Use any credentials to continue
          </p>
        </div>
      </div>
    </div>
  );
}
