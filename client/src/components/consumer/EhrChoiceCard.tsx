/**
 * EhrChoiceCard Component - "The Fork" Screen
 * Offers users the choice between connecting EHR or entering data manually
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, Edit3, Zap, Shield } from 'lucide-react';

interface EhrChoiceCardProps {
  questionText: string;
  onConnectEhr: () => void;
  onManualEntry: () => void;
}

export function EhrChoiceCard({ questionText, onConnectEhr, onManualEntry }: EhrChoiceCardProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl text-center">
          {questionText}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground mb-6">
          Choose how you'd like to provide this information:
        </p>

        {/* Connect EHR Button - Primary Action */}
        <button
          onClick={onConnectEhr}
          className="w-full p-6 border-2 border-primary rounded-lg hover-elevate active-elevate-2 transition-all group"
          data-testid="button-connect-ehr"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                Connect My Patient Portal
                <Zap className="h-4 w-4 text-yellow-500" />
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Fastest & Most Accurate
              </p>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>Securely connect to auto-fill from your medical records</span>
              </div>
            </div>
          </div>
        </button>

        {/* Manual Entry Button - Secondary Action */}
        <button
          onClick={onManualEntry}
          className="w-full p-6 border-2 border-border rounded-lg hover-elevate active-elevate-2 transition-all"
          data-testid="button-manual-entry"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-muted rounded-lg flex-shrink-0">
              <Edit3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold mb-1">
                Enter Manually
              </h3>
              <p className="text-sm text-muted-foreground">
                If you know your result or prefer to type it in
              </p>
            </div>
          </div>
        </button>

        {/* Privacy Note */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Your health information is protected and will only be used for this screening.
        </p>
      </CardContent>
    </Card>
  );
}
