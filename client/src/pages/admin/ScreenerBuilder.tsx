import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wrench } from 'lucide-react';

/**
 * Screener Builder Page
 * Visual flow editor for creating patient screening workflows
 * 
 * TODO: Implement full screener builder with React Flow
 * - Node palette (Start, Questions, Outcomes)
 * - Canvas for building flow
 * - Properties inspector
 * - Flow validation
 * - JSON serialization
 */
export default function ScreenerBuilder() {
  const [match, params] = useRoute('/admin/programs/:programId/screener/:versionId');
  const [, setLocation] = useLocation();
  const { programId, versionId } = params || {};

  const isNewVersion = versionId === 'new';

  const handleBack = () => {
    setLocation(`/admin/programs/${programId}`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <Wrench className="w-8 h-8" />
              {isNewVersion ? 'Create Screener Version' : 'Edit Screener Version'}
            </h1>
            <p className="text-muted-foreground">
              Visual flow editor for patient screening workflows
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle>Screener Builder - Coming Soon</CardTitle>
          <CardDescription>
            Visual workflow editor with React Flow integration
          </CardDescription>
        </CardHeader>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Wrench className="w-16 h-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Screener Builder Under Construction</h3>
              <p className="text-muted-foreground max-w-md">
                The visual screener builder with drag-and-drop nodes, 
                question types, and flow validation is currently being implemented.
              </p>
            </div>
            <div className="text-left text-sm text-muted-foreground bg-muted p-4 rounded-md max-w-2xl">
              <p className="font-semibold mb-2">Planned Features:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>3-panel layout: Node Palette, Canvas, Properties Inspector</li>
                <li>Node types: Start, Questions (YesNo, MultipleChoice, Numeric, OpenText), Outcomes</li>
                <li>Visual flow editor powered by React Flow</li>
                <li>Node property editing with validation</li>
                <li>Edge connection rules and flow validation</li>
                <li>JSON serialization for backend storage</li>
                <li>Preview mode showing consumer-facing view</li>
                <li>Save draft and publish functionality</li>
              </ul>
            </div>
            <Button onClick={handleBack} data-testid="button-back-to-program">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Program
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
