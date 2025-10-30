import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useSession } from '@/contexts/SessionContext';
import EducationScreen from '@/pages/public/EducationScreen';
import { ConsumerLayout } from '@/components/consumer/ConsumerLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function EducationModule() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { screenerConfig, sessionId, sessionToken } = useSession();

  // Redirect if no session or no education module
  useEffect(() => {
    if (!sessionId || !sessionToken || !screenerConfig) {
      navigate(`/screen/${slug}`);
    }
  }, [sessionId, sessionToken, screenerConfig, slug, navigate]);

  if (!screenerConfig || !screenerConfig.educationModule) {
    return (
      <ConsumerLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Education module not configured. Please contact support.</AlertDescription>
        </Alert>
      </ConsumerLayout>
    );
  }

  const handleEducationComplete = () => {
    console.log('[EducationModule] Education complete, checking for comprehension check');
    
    // Check for required comprehension check
    if (screenerConfig.comprehensionCheck?.required) {
      console.log('[EducationModule] Comprehension check required, navigating to comprehension screen');
      navigate(`/screen/${slug}/comprehension`);
      return;
    }

    console.log('[EducationModule] No comprehension required, navigating to outcome page');
    // Navigate to outcome page
    navigate(`/screen/${slug}/outcome`);
  };

  return (
    <EducationScreen
      content={screenerConfig.educationModule.content}
      onComplete={handleEducationComplete}
    />
  );
}
