/**
 * EHR Data Sharing Consent Page
 * Shows what data will be shared and gets patient consent
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, CheckCircle2, AlertCircle, ArrowRight, Building2 } from 'lucide-react';

export default function EhrConsent() {
  const [, navigate] = useLocation();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const redirectUri = params.get('redirect_uri');
  const ehrProvider = params.get('provider') || 'MyHealthPortal';
  const email = params.get('email');

  // Parse the requesting application from redirect URI
  const requestingApp = 'Aegis Patient Assistance Platform';

  const handleConsent = async () => {
    if (!agreedToTerms) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate to data selection page
    navigate(`/ehr/share-data?session_id=${sessionId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&provider=${ehrProvider}&email=${encodeURIComponent(email || '')}`);
  };

  const handleDecline = () => {
    // Close window or redirect back with error
    if (window.opener) {
      window.close();
    } else {
      window.location.href = redirectUri || '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
              <Building2 className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Authorize Data Sharing</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {/* Main Consent Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Data Sharing Request
            </CardTitle>
            <CardDescription>
              <span className="font-medium text-foreground">{requestingApp}</span> is requesting access to specific health information from your {ehrProvider} account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* What will be shared */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Information that will be shared:
              </h3>
              <div className="space-y-2 pl-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Medical Conditions</p>
                    <p className="text-xs text-muted-foreground">Diagnoses relevant to medication screening (e.g., Asthma, COPD, Diabetes)</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Read Only</Badge>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Lab Results</p>
                    <p className="text-xs text-muted-foreground">Recent test values (e.g., cholesterol levels, blood glucose)</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Read Only</Badge>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Basic Demographics</p>
                    <p className="text-xs text-muted-foreground">Age and gender for medication safety screening</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Read Only</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* What will NOT be shared */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Information that will NOT be shared:
              </h3>
              <div className="space-y-1 pl-6 text-xs text-muted-foreground">
                <p>• Full medical history or clinical notes</p>
                <p>• Medications or treatment plans</p>
                <p>• Insurance or billing information</p>
                <p>• Contact information or social security number</p>
              </div>
            </div>

            <Separator />

            {/* Privacy guarantees */}
            <Alert className="border-primary/20 bg-primary/5">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs space-y-2">
                <p className="font-medium text-foreground">Your privacy is protected:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Data is encrypted in transit and at rest</li>
                  <li>• Information is used only for medication screening</li>
                  <li>• You can revoke access at any time</li>
                  <li>• Data is automatically deleted after screening completion</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Consent checkbox */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <Checkbox
                  id="consent"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  data-testid="checkbox-ehr-consent"
                />
                <label
                  htmlFor="consent"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I authorize <span className="font-medium text-foreground">{ehrProvider}</span> to share the specified health information with <span className="font-medium text-foreground">{requestingApp}</span> for the purpose of medication screening. I understand this consent is valid for this screening session only.
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleDecline}
                className="flex-1"
                data-testid="button-ehr-decline"
              >
                Decline
              </Button>
              <Button
                onClick={handleConsent}
                disabled={!agreedToTerms || isLoading}
                className="flex-1"
                data-testid="button-ehr-authorize"
              >
                {isLoading ? 'Authorizing...' : 'Authorize Access'}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              This authorization complies with HIPAA regulations
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
