/**
 * VerificationCode Screen - Displays verification code for purchase
 * Shows QR code, alphanumeric code, copy button, and countdown timer
 */

import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useSession } from '@/contexts/SessionContext';
import { sessionClient } from '@/lib/sessionClient';
import { ConsumerLayout } from '@/components/consumer/ConsumerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, CheckCircle, Clock, AlertCircle, ShoppingCart, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GenerateCodeResponse } from '@/types/consumer';

export default function VerificationCode() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { sessionId, sessionToken, evaluation, verificationCode, setVerificationCode } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Redirect if not eligible (outcome must be ok_to_use)
  useEffect(() => {
    if (!sessionId || !sessionToken || !evaluation) {
      navigate(`/screen/${slug}`);
      return;
    }

    if (evaluation.outcome !== 'ok_to_use') {
      navigate(`/screen/${slug}/outcome`);
      return;
    }
  }, [sessionId, sessionToken, evaluation, slug, navigate]);

  // Generate or fetch verification code
  useEffect(() => {
    const fetchCode = async () => {
      if (!sessionId || !sessionToken || verificationCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await sessionClient.post<GenerateCodeResponse>(
          `/public/sessions/${sessionId}/generate-code`,
          { type: 'pos_barcode' }
        );

        if (!response.success || !response.data) {
          throw new Error('Failed to generate verification code');
        }

        setVerificationCode(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate code');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCode();
  }, [sessionId, sessionToken, verificationCode, setVerificationCode]);

  // Countdown timer
  useEffect(() => {
    if (!verificationCode) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(verificationCode.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`);
      } else {
        setTimeRemaining(`${seconds}s remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [verificationCode]);

  const handleCopyCode = async () => {
    if (!verificationCode) return;

    try {
      await navigator.clipboard.writeText(verificationCode.code);
      setIsCopied(true);
      toast({
        title: 'Code copied!',
        description: 'Verification code copied to clipboard',
      });

      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the code manually',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <ConsumerLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ConsumerLayout>
    );
  }

  if (error || !verificationCode) {
    return (
      <ConsumerLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Verification code not available'}</AlertDescription>
        </Alert>
      </ConsumerLayout>
    );
  }

  const isExpired = new Date(verificationCode.expiresAt) <= new Date();

  return (
    <ConsumerLayout>
      <div className="space-y-6 max-w-2xl mx-auto" data-testid="verification-code-screen">
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Your Verification Code</h1>
          <p className="text-muted-foreground">
            Show this code at checkout or enter it online to complete your purchase
          </p>
        </div>

        {/* Code Card */}
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Verification Code</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              {timeRemaining}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* QR Code Placeholder - In production, use a QR code library */}
            <div className="flex items-center justify-center">
              <div 
                className="w-48 h-48 bg-white border-4 border-border rounded-lg flex items-center justify-center"
                data-testid="qr-code"
              >
                <div className="text-center text-xs text-muted-foreground p-4">
                  QR Code
                  <br />
                  {verificationCode.code}
                </div>
              </div>
            </div>

            {/* Alphanumeric Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Or enter this code manually:
              </label>
              <div className="flex items-center gap-2">
                <div 
                  className="flex-1 text-center text-3xl font-bold tracking-wider bg-muted rounded-lg p-4 font-mono"
                  data-testid="verification-code-text"
                >
                  {verificationCode.code}
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCopyCode}
                  disabled={isExpired}
                  className="h-14 px-6"
                  data-testid="button-copy-code"
                >
                  {isCopied ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Expiration Warning */}
            {isExpired && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This code has expired. Please start a new screening to get a fresh code.
                </AlertDescription>
              </Alert>
            )}

            {/* Usage Instructions */}
            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <ShoppingCart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-1">
                  <h3 className="font-semibold">In-Store Purchase</h3>
                  <p className="text-sm text-muted-foreground">
                    Show this code to the pharmacist at checkout
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-1">
                  <h3 className="font-semibold">Online Purchase</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter this code at checkout on participating websites
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <Alert>
              <AlertDescription className="space-y-1 text-sm">
                <p className="font-semibold">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>This code is single-use only</li>
                  <li>Valid for {timeRemaining}</li>
                  <li>Keep this code secure and do not share it</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </ConsumerLayout>
  );
}
