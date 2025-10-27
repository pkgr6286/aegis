import { useState, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle2, FileCheck, Lock } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasRedirected = useRef(false);

  if (isAuthenticated && !hasRedirected.current) {
    hasRedirected.current = true;
    setTimeout(() => navigate('/'), 0);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication failed',
        description: error instanceof Error ? error.message : 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Column - Brand & Features */}
      <div className="hidden lg:flex lg:w-[60%] bg-gradient-to-br from-sidebar via-sidebar-primary to-sidebar p-12 xl:p-16 flex-col justify-between text-white">
        <div className="space-y-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold">Aegis</h1>
              <p className="text-sm text-white/70">by Mahalo</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6 max-w-xl">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
              ACNU & Self-Care Enablement
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              Securely manage Rx-to-OTC switches and empower consumers with safe self-selection.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6 max-w-xl">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Compliant Screener Engine</h3>
                <p className="text-white/80 text-sm">
                  Visually build and deploy FDA-compliant ACNU workflows.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Secure Verification</h3>
                <p className="text-white/80 text-sm">
                  Integrate seamlessly with POS and e-commerce for verified access.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Auditable & Scalable</h3>
                <p className="text-white/80 text-sm">
                  Multi-tenant platform with full audit trails for compliance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-white/60">
          © 2025 Aegis Platform. All rights reserved.
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-[40%] bg-background flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold text-center">
                Admin Portal
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                Sign in to access your dashboard
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    data-testid="input-email"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    data-testid="input-password"
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <a href="mailto:support@aegis.com" className="text-primary hover:underline font-medium">
                    Contact Support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Logo */}
          <div className="lg:hidden mt-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Aegis Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
