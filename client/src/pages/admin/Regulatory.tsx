/**
 * Regulatory Submission Center
 * Generate FDA submission-ready documentation packages
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileCheck, Download, AlertCircle, Sparkles, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import type { DrugProgram } from '@/types/drugProgram';

interface ScreenerVersion {
  id: string;
  version: number;
  notes: string | null;
  createdAt: string;
}

interface PackageMetadata {
  programId: string;
  versionId: string;
  generatedAt: string;
  reports: Array<{
    id: string;
    name: string;
    filename: string;
    description: string;
    endpoint: string;
  }>;
}

export default function Regulatory() {
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [packageData, setPackageData] = useState<PackageMetadata | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch all programs
  const { data: programsData, isLoading: isProgramsLoading } = useQuery({
    queryKey: ['/admin/drug-programs'],
    enabled: true,
  });

  const programs = (programsData as { success: boolean; data: DrugProgram[] })?.data || [];

  // Fetch versions for selected program
  const { data: versionsData, isLoading: isVersionsLoading } = useQuery({
    queryKey: ['/admin/drug-programs', selectedProgramId, 'screeners'],
    enabled: !!selectedProgramId,
  });

  const versions = (versionsData as { success: boolean; data: ScreenerVersion[] })?.data || [];

  const handleGeneratePackage = async () => {
    if (!selectedProgramId || !selectedVersionId) return;

    try {
      setIsGenerating(true);
      const response = await apiClient.get<{ data: PackageMetadata }>(
        `/api/v1/admin/regulatory/package?programId=${selectedProgramId}&versionId=${selectedVersionId}`
      );

      setPackageData(response.data);
    } catch (error) {
      console.error('Error generating package:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (endpoint: string, filename: string) => {
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = endpoint;
    link.download = filename;
    link.click();
  };

  const selectedProgram = programs.find(p => p.id === selectedProgramId);
  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const skeletonVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="space-y-6 p-6" data-testid="regulatory-page">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <FileCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Aegis Submission Center</h1>
            <p className="text-muted-foreground">
              Generate and download submission-ready documentation for your ACNU and SaMD programs
            </p>
          </div>
        </div>
      </div>

      {/* Selection Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Step 1: Select Program */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </span>
              Select Drug Program
            </CardTitle>
            <CardDescription>
              Choose the program for which you want to generate documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isProgramsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedProgramId}
                onValueChange={(value) => {
                  setSelectedProgramId(value);
                  setSelectedVersionId('');
                  setPackageData(null);
                }}
                data-testid="select-program"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Select Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </span>
              Select Screener Version
            </CardTitle>
            <CardDescription>
              Choose the specific version to include in your submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVersionsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedVersionId}
                onValueChange={(value) => {
                  setSelectedVersionId(value);
                  setPackageData(null);
                }}
                disabled={!selectedProgramId}
                data-testid="select-version"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a version..." />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      Version {version.version} {version.notes && `- ${version.notes}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <motion.div 
        className="flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: isGenerating ? 0.6 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          size="lg"
          onClick={handleGeneratePackage}
          disabled={!selectedProgramId || !selectedVersionId || isGenerating}
          className="min-w-[200px] transition-all duration-300"
          data-testid="button-generate-package"
        >
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center"
              >
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </motion.div>
            ) : (
              <motion.div
                key="generate"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center"
              >
                <FileCheck className="mr-2 h-5 w-5" />
                Generate Package
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Skeleton Loading State */}
      <AnimatePresence>
        {isGenerating && !packageData && (
          <motion.div
            variants={skeletonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-3"
          >
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Package Contents - Animated */}
      <AnimatePresence>
        {packageData && !isGenerating && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Card className="border-primary/20">
              <CardHeader>
                <motion.div variants={itemVariants}>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Package Contents
                  </CardTitle>
                  <CardDescription>
                    Generated for {selectedProgram?.name} - Version {selectedVersion?.version}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      Generated at: {new Date(packageData.generatedAt).toLocaleString()}
                    </span>
                  </CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent className="space-y-3">
                {packageData.reports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    variants={itemVariants}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate active-elevate-2 transition-all duration-200 group"
                    data-testid={`report-${report.id}`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <motion.div
                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0 mt-0.5"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        {report.filename.endsWith('.json') ? (
                          <FileJson className="w-5 h-5 text-primary" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5 text-primary" />
                        )}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{report.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1 font-mono">{report.filename}</p>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(report.endpoint, report.filename)}
                        className="ml-4 transition-all duration-200"
                        data-testid={`button-download-${report.id}`}
                      >
                        <Download className="h-4 w-4 mr-2 transition-transform group-hover:translate-y-0.5" />
                        Download
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}

                <motion.div variants={itemVariants}>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <p className="font-semibold mb-2">Important Notes:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>All reports are generated from live production data</li>
                        <li>Patient data is anonymized in accordance with HIPAA requirements</li>
                        <li>Review all documents before submission to regulatory authorities</li>
                        <li>Maintain a copy of this package for your compliance records</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      {!packageData && selectedProgramId && selectedVersionId && !isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What's Included in the Package?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <FileJson className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Software Design Specification</p>
                <p className="text-muted-foreground">Complete screener logic and configuration in JSON format (21 CFR Part 11 compliant)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Change Control & Version History</p>
                <p className="text-muted-foreground">Complete audit trail of all screener versions and modifications</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Actual Use Study Data</p>
                <p className="text-muted-foreground">Anonymized real-world screening session data for safety validation</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">ACNU Failure Log</p>
                <p className="text-muted-foreground">Safety failure events for adverse event reporting requirements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
