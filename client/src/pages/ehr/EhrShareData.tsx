/**
 * EHR Data Sharing & AI Processing Page
 * Shows AI extracting and processing health data with smart animations
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Sparkles, Database, Shield, Zap, Brain, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataItem {
  id: string;
  category: string;
  label: string;
  value: string;
  status: 'pending' | 'processing' | 'extracted' | 'verified';
  icon: any;
}

export default function EhrShareData() {
  const [, navigate] = useLocation();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [dataItems, setDataItems] = useState<DataItem[]>([
    {
      id: 'condition_asthma',
      category: 'Medical Conditions',
      label: 'Asthma/COPD Diagnosis',
      value: 'Asthma - Confirmed 2023',
      status: 'pending',
      icon: FileSearch,
    },
    {
      id: 'demographics_age',
      category: 'Demographics',
      label: 'Age Verification',
      value: '42 years old',
      status: 'pending',
      icon: Shield,
    },
    {
      id: 'labs_recent',
      category: 'Recent Labs',
      label: 'Last Check-up',
      value: 'Within 6 months',
      status: 'pending',
      icon: Database,
    },
  ]);

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const redirectUri = params.get('redirect_uri');

  const steps = [
    { label: 'Connecting securely', icon: Shield },
    { label: 'Scanning health records', icon: FileSearch },
    { label: 'AI extracting relevant data', icon: Brain },
    { label: 'Verifying information', icon: CheckCircle2 },
    { label: 'Preparing summary', icon: Sparkles },
  ];

  useEffect(() => {
    const timeline = [
      // Step 0: Connecting (0-20%)
      { delay: 500, action: () => { setCurrentStep(0); setProgress(10); } },
      { delay: 1000, action: () => setProgress(20) },
      
      // Step 1: Scanning (20-40%)
      { delay: 1500, action: () => { setCurrentStep(1); setProgress(30); } },
      { delay: 2000, action: () => setProgress(40) },
      
      // Step 2: AI Extracting (40-70%)
      { delay: 2500, action: () => { 
        setCurrentStep(2); 
        setProgress(45);
        updateDataStatus(0, 'processing');
      }},
      { delay: 3000, action: () => {
        updateDataStatus(0, 'extracted');
        setProgress(55);
      }},
      { delay: 3500, action: () => {
        updateDataStatus(1, 'processing');
        setProgress(60);
      }},
      { delay: 4000, action: () => {
        updateDataStatus(1, 'extracted');
        setProgress(65);
      }},
      { delay: 4500, action: () => {
        updateDataStatus(2, 'processing');
        setProgress(70);
      }},
      
      // Step 3: Verifying (70-85%)
      { delay: 5000, action: () => { 
        setCurrentStep(3);
        updateDataStatus(2, 'extracted');
        setProgress(75);
      }},
      { delay: 5500, action: () => {
        updateDataStatus(0, 'verified');
        setProgress(80);
      }},
      { delay: 6000, action: () => {
        updateDataStatus(1, 'verified');
        updateDataStatus(2, 'verified');
        setProgress(85);
      }},
      
      // Step 4: Preparing (85-100%)
      { delay: 6500, action: () => { setCurrentStep(4); setProgress(90); } },
      { delay: 7000, action: () => setProgress(100) },
      
      // Complete and redirect
      { delay: 7500, action: () => {
        // Send message to parent window with extracted data
        const extractedData = {
          asthma_copd_diagnosis: true,
          age_verified: true,
          recent_checkup: true,
        };
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'EHR_AUTH_SUCCESS',
            data: extractedData,
            provider: 'MyHealthPortal',
          }, window.location.origin);
          setTimeout(() => window.close(), 500);
        } else {
          // Fallback: redirect with data
          const dataParam = encodeURIComponent(JSON.stringify(extractedData));
          window.location.href = `${redirectUri}?ehr_data=${dataParam}`;
        }
      }},
    ];

    const timeouts = timeline.map(({ delay, action }) => 
      setTimeout(action, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [redirectUri]);

  const updateDataStatus = (index: number, status: DataItem['status']) => {
    setDataItems(prev => prev.map((item, i) => 
      i === index ? { ...item, status } : item
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* AI Processing Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">AI Processing Your Health Data</h1>
          <p className="text-sm text-muted-foreground">
            Securely extracting relevant information...
          </p>
        </div>

        {/* Progress Card */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" data-testid="progress-ehr-extraction" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Processing Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                      isActive && "bg-primary/10 border border-primary/20",
                      isComplete && "opacity-60"
                    )}
                    data-testid={`step-${index}`}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                      isComplete && "bg-primary text-primary-foreground",
                      isActive && "bg-primary/20 text-primary animate-pulse",
                      !isComplete && !isActive && "bg-muted text-muted-foreground"
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      isActive && "text-foreground",
                      isComplete && "text-muted-foreground",
                      !isComplete && !isActive && "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                    {isActive && (
                      <div className="ml-auto">
                        <Zap className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Extracted Data Preview */}
            {currentStep >= 2 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Data Being Extracted
                </h3>
                <div className="space-y-2">
                  {dataItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
                          item.status === 'processing' && "bg-primary/5 border-primary/20 animate-pulse",
                          item.status === 'extracted' && "bg-accent/50",
                          item.status === 'verified' && "bg-primary/10 border-primary/20"
                        )}
                        data-testid={`data-item-${item.id}`}
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          {(item.status === 'extracted' || item.status === 'verified') && (
                            <p className="text-xs text-muted-foreground truncate">{item.value}</p>
                          )}
                        </div>
                        {item.status === 'verified' && (
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        {item.status === 'processing' && (
                          <Badge variant="secondary" className="text-xs">Processing</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-xs">
              <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                All data is encrypted and transmitted securely. Only information relevant to your medication screening is extracted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
