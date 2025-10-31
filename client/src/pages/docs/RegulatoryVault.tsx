import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FolderLock, Download, FileText, Shield, TestTube, 
  Lock, FileCheck, ClipboardList, BarChart3, Search, Filter, X,
  Package, FileDown, CheckSquare, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Category metadata
const CATEGORIES = {
  samd_core: {
    label: 'SaMD Core Documentation',
    icon: FileText,
    color: 'blue',
    description: 'Software as a Medical Device core compliance documentation'
  },
  verification_validation: {
    label: 'Verification & Validation',
    icon: TestTube,
    color: 'green',
    description: 'V&V testing reports and validation studies'
  },
  risk_cybersecurity: {
    label: 'Risk & Cybersecurity',
    icon: Shield,
    color: 'red',
    description: 'Risk management and cybersecurity assessments'
  },
  acnu_specific: {
    label: 'ACNU-Specific Files',
    icon: ClipboardList,
    color: 'orange',
    description: 'Actual Use Study documentation for OTC switches'
  },
  regulatory_submissions: {
    label: 'Regulatory Submissions',
    icon: FileCheck,
    color: 'purple',
    description: 'FDA submissions and pre-sub meeting materials'
  },
  compliance_qms: {
    label: 'Compliance & QMS',
    icon: Lock,
    color: 'indigo',
    description: 'Quality Management System and compliance documentation'
  },
  post_market_surveillance: {
    label: 'Post-Market Surveillance',
    icon: BarChart3,
    color: 'cyan',
    description: 'Post-market monitoring and safety reporting'
  }
} as const;

interface RegulatoryDocument {
  id: string;
  title: string;
  category: keyof typeof CATEGORIES;
  description: string;
  tags: string[];
  accessLevel: 'admin' | 'internal' | 'external';
  fileUrl: string;
  createdAt: string;
  creator?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function RegulatoryVault() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('all');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const { toast } = useToast();

  // Fetch regulatory documents
  const { data: documents, isLoading } = useQuery<RegulatoryDocument[]>({
    queryKey: ['/api/v1/admin/regulatory-vault/documents'],
  });

  // Filter documents
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = searchTerm === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesAccessLevel = selectedAccessLevel === 'all' || doc.accessLevel === selectedAccessLevel;

    return matchesSearch && matchesCategory && matchesAccessLevel;
  });

  // Group documents by category
  const documentsByCategory = filteredDocuments?.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, RegulatoryDocument[]>);

  const handleDownload = (doc: RegulatoryDocument) => {
    toast({
      title: 'Download Started',
      description: `Downloading ${doc.title}...`,
    });
    window.open(doc.fileUrl, '_blank');
  };

  const handleToggleDocument = (docId: string) => {
    const newSelected = new Set(selectedDocIds);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments?.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocuments?.map(d => d.id) || []));
    }
  };

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);
      if (selectedAccessLevel !== 'all') queryParams.set('accessLevel', selectedAccessLevel);
      if (searchTerm) queryParams.set('searchTerm', searchTerm);

      const url = `/api/v1/admin/regulatory-vault/export/csv?${queryParams.toString()}`;
      
      // Fetch CSV directly
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `regulatory-documents-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Export Complete',
        description: `Exported ${filteredDocuments?.length || 0} documents to CSV`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export documents to CSV',
        variant: 'destructive',
      });
    }
  };

  const submissionPacketMutation = useMutation({
    mutationFn: async (documentIds: string[]) => {
      return await apiRequest('/admin/regulatory-vault/submission-packet', {
        method: 'POST',
        body: JSON.stringify({ documentIds }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Submission Packet Ready',
        description: `${data.data.length} documents prepared for FDA submission`,
      });
      // In a real implementation, this would trigger a ZIP download
      // For now, we'll show success message
      setIsMultiSelectMode(false);
      setSelectedDocIds(new Set());
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create submission packet',
        variant: 'destructive',
      });
    },
  });

  const handleCreateSubmissionPacket = () => {
    if (selectedDocIds.size === 0) {
      toast({
        title: 'No Documents Selected',
        description: 'Please select at least one document for the submission packet',
        variant: 'destructive',
      });
      return;
    }
    submissionPacketMutation.mutate(Array.from(selectedDocIds));
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <div className="space-y-6 p-6" data-testid="regulatory-vault-page">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
            <FolderLock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Regulatory Vault</h1>
            <p className="text-muted-foreground">
              FDA compliance documentation and regulatory submissions
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
                data-testid="input-search-documents"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover-elevate p-1 rounded"
                  data-testid="button-clear-search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1 bg-background"
                  data-testid="select-category"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Access Level:</span>
                <select
                  value={selectedAccessLevel}
                  onChange={(e) => setSelectedAccessLevel(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1 bg-background"
                  data-testid="select-access-level"
                >
                  <option value="all">All Levels</option>
                  <option value="admin">Admin Only</option>
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredDocuments?.length || 0} of {documents?.length || 0} documents
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  data-testid="button-export-csv"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                
                <Button
                  variant={isMultiSelectMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setIsMultiSelectMode(!isMultiSelectMode);
                    if (isMultiSelectMode) {
                      setSelectedDocIds(new Set());
                    }
                  }}
                  data-testid="button-toggle-multiselect"
                >
                  <Package className="w-4 h-4 mr-2" />
                  {isMultiSelectMode ? 'Cancel Selection' : 'Build Packet'}
                </Button>
              </div>
            </div>

            {/* Multi-select Actions */}
            {isMultiSelectMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    data-testid="button-select-all"
                  >
                    {selectedDocIds.size === filteredDocuments?.length ? (
                      <CheckSquare className="w-4 h-4 mr-2" />
                    ) : (
                      <Square className="w-4 h-4 mr-2" />
                    )}
                    {selectedDocIds.size === filteredDocuments?.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <span className="text-sm font-medium">
                    {selectedDocIds.size} document{selectedDocIds.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                
                <Button
                  size="sm"
                  onClick={handleCreateSubmissionPacket}
                  disabled={selectedDocIds.size === 0 || submissionPacketMutation.isPending}
                  data-testid="button-create-packet"
                >
                  <Package className="w-4 h-4 mr-2" />
                  {submissionPacketMutation.isPending ? 'Creating...' : 'Create Submission Packet'}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents by Category */}
      {!isLoading && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {Object.entries(CATEGORIES).map(([categoryKey, categoryMeta]) => {
            const categoryDocs = documentsByCategory?.[categoryKey as keyof typeof CATEGORIES] || [];
            
            if (categoryDocs.length === 0 && selectedCategory !== 'all') return null;

            const Icon = categoryMeta.icon;
            const colorClasses = {
              blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              green: 'bg-green-500/10 text-green-600 dark:text-green-400',
              red: 'bg-red-500/10 text-red-600 dark:text-red-400',
              orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
              purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
              indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
              cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
            };

            return (
              <motion.div key={categoryKey} variants={fadeInUp} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorClasses[categoryMeta.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{categoryMeta.label}</h2>
                    <p className="text-sm text-muted-foreground">{categoryMeta.description}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {categoryDocs.length} {categoryDocs.length === 1 ? 'document' : 'documents'}
                  </Badge>
                </div>

                {categoryDocs.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No documents in this category match your filters
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                      {categoryDocs.map((doc) => (
                        <motion.div
                          key={doc.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card 
                            className={`h-full hover-elevate transition-all ${
                              isMultiSelectMode && selectedDocIds.has(doc.id) ? 'ring-2 ring-primary' : ''
                            }`}
                            data-testid={`card-document-${doc.id}`}
                          >
                            <CardHeader>
                              <div className="flex items-start gap-2">
                                {/* Checkbox for multi-select mode */}
                                {isMultiSelectMode && (
                                  <Checkbox
                                    checked={selectedDocIds.has(doc.id)}
                                    onCheckedChange={() => handleToggleDocument(doc.id)}
                                    className="mt-1"
                                    data-testid={`checkbox-${doc.id}`}
                                  />
                                )}
                                
                                <div className="flex-1 flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-1">
                                    <CardTitle className="text-base leading-tight">
                                      {doc.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs line-clamp-2">
                                      {doc.description}
                                    </CardDescription>
                                  </div>
                                  <Badge 
                                    variant={doc.accessLevel === 'admin' ? 'destructive' : doc.accessLevel === 'internal' ? 'default' : 'secondary'}
                                    className="shrink-0"
                                    data-testid={`badge-access-${doc.id}`}
                                  >
                                    {doc.accessLevel}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Tags */}
                              {doc.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {doc.tags.slice(0, 4).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {doc.tags.length > 4 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{doc.tags.length - 4} more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              {!isMultiSelectMode && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleDownload(doc)}
                                    data-testid={`button-download-${doc.id}`}
                                  >
                                    <Download className="w-3 h-3 mr-2" />
                                    Download
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownload(doc)}
                                    data-testid={`button-view-${doc.id}`}
                                  >
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* No Results */}
      {!isLoading && filteredDocuments?.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <FolderLock className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="font-semibold">No documents found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedAccessLevel('all');
                }}
                data-testid="button-clear-filters"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
