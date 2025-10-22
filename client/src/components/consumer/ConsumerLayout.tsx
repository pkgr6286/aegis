/**
 * ConsumerLayout - Wrapper for all consumer screening pages
 * Mobile-first design with branded header
 */

import { ReactNode } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ConsumerLayoutProps {
  children: ReactNode;
  showProgress?: boolean;
  progress?: number;
}

export function ConsumerLayout({ children, showProgress = false, progress = 0 }: ConsumerLayoutProps) {
  const { brandConfig } = useSession();

  return (
    <div 
      className="min-h-screen w-full flex flex-col bg-background"
      style={{
        ...(brandConfig?.primaryColor && {
          '--brand-primary': brandConfig.primaryColor,
          '--brand-secondary': brandConfig.secondaryColor || brandConfig.primaryColor,
        } as any)
      }}
    >
      {/* Branded Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container max-w-3xl mx-auto flex h-16 items-center justify-between px-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            {brandConfig?.logoUrl ? (
              <img
                src={brandConfig.logoUrl}
                alt={brandConfig.name}
                className="h-8 w-auto object-contain"
                data-testid="brand-logo"
              />
            ) : (
              <div className="h-8 px-4 flex items-center justify-center bg-primary/10 rounded-md">
                <span className="font-semibold text-primary" data-testid="brand-name">
                  {brandConfig?.name || 'Screening'}
                </span>
              </div>
            )}
          </div>

          {/* Help Button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Help"
            data-testid="button-help"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full bg-background">
            <Progress 
              value={progress} 
              className="h-1 rounded-none"
              data-testid="progress-bar"
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="container max-w-2xl mx-auto px-4 py-6 sm:py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-card py-4">
        <div className="container max-w-3xl mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground">
            Your information is private and secure.
          </p>
        </div>
      </footer>
    </div>
  );
}
