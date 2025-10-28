import { useState, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle2, FileCheck, Lock, UserCog, Users, Stethoscope, ClipboardCheck } from 'lucide-react';

interface DemoAccount {
  role: string;
  description: string;
  email: string;
  password: string;
  icon: any;
  color: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Platform Admin',
    description: 'Full system access',
    email: 'admin@aegis.com',
    password: 'admin123',
    icon: Shield,
    color: 'text-purple-500',
  },
  {
    role: 'Pharma Admin',
    description: 'Tenant management',
    email: 'pharma-admin@test.com',
    password: 'pharma123',
    icon: UserCog,
    color: 'text-blue-500',
  },
  {
    role: 'Clinician',
    description: 'Clinical review',
    email: 'clinician@test.com',
    password: 'clinician123',
    icon: Stethoscope,
    color: 'text-green-500',
  },
  {
    role: 'Auditor',
    description: 'Read-only compliance',
    email: 'auditor@test.com',
    password: 'auditor123',
    icon: ClipboardCheck,
    color: 'text-orange-500',
  },
];

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

  const handleDemoLogin = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    toast({
      title: 'Demo credentials loaded',
      description: `Click "Sign In" to login as ${account.role}`,
    });
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
      <div className="w-full lg:w-[40%] bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        {/* Decorative blur circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sidebar/5 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md relative z-10 py-8">
          {/* Logo above card */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-sidebar shadow-lg mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Aegis Platform</h1>
            <p className="text-sm text-muted-foreground mt-1">Secure Admin Access</p>
          </div>

          <Card className="border shadow-2xl shadow-primary/5 backdrop-blur-sm bg-card/95">
            <CardHeader className="space-y-1 pb-6 pt-8">
              <CardTitle className="text-xl font-semibold text-center">
                Welcome Back
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                Enter your credentials to continue
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
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
                    className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    data-testid="input-password"
                    className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Demo Accounts Section */}
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Demo Accounts
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {DEMO_ACCOUNTS.map((account) => {
                    const Icon = account.icon;
                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => handleDemoLogin(account)}
                        disabled={isLoading}
                        data-testid={`button-demo-${account.role.toLowerCase().replace(/\s+/g, '-')}`}
                        className="group relative overflow-hidden rounded-lg border bg-card p-3 text-left transition-all hover-elevate active-elevate-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center ${account.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold mb-0.5 truncate">
                              {account.role}
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-tight">
                              {account.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
                  Click any role above to auto-fill credentials for demo purposes
                </p>
              </div>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Need help?{' '}
                  <a href="mailto:support@aegis.com" className="text-primary hover:underline font-medium transition-colors">
                    Contact Support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Logo */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              © 2025 Aegis Platform. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
