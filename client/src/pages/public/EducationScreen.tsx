import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Video, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { EducationContent } from '@/types/screener';

interface EducationScreenProps {
  content: EducationContent[];
  onComplete: () => void;
}

export default function EducationScreen({ content, onComplete }: EducationScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  
  const currentContent = content[currentIndex];
  const progress = ((currentIndex + 1) / content.length) * 100;
  const isLastItem = currentIndex === content.length - 1;

  const handleNext = () => {
    if (isLastItem) {
      if (acknowledged) {
        onComplete();
      }
    } else {
      setCurrentIndex(currentIndex + 1);
      setAcknowledged(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Important Safety Information</h1>
          <p className="text-muted-foreground">
            Please review this information carefully before proceeding
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Section {currentIndex + 1} of {content.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-education" />
        </div>

        {/* Content Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {currentContent.type === 'video' ? (
                <Video className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
              <CardTitle className="text-xl">
                {currentContent.type === 'video' ? currentContent.title : 'Safety Information'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {currentContent.type === 'video' ? (
              <div className="space-y-4">
                {/* Video Embed */}
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {currentContent.url ? (
                    // YouTube embed support
                    currentContent.url.includes('youtube.com') || currentContent.url.includes('youtu.be') ? (
                      <iframe
                        src={currentContent.url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allowFullScreen
                        title={currentContent.title}
                        data-testid="video-player"
                      />
                    ) : (
                      <video
                        src={currentContent.url}
                        controls
                        className="w-full h-full"
                        data-testid="video-player"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )
                  ) : (
                    <div className="text-muted-foreground text-center p-8">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Video URL not configured</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{currentContent.markdown || ''}</ReactMarkdown>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            {isLastItem && (
              <div className="flex items-start space-x-2 w-full">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                  data-testid="checkbox-acknowledge"
                />
                <label
                  htmlFor="acknowledge"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have read and understood this important safety information
                </label>
              </div>
            )}
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                data-testid="button-previous"
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={isLastItem && !acknowledged}
                data-testid="button-next"
              >
                {isLastItem ? 'Continue' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Helper Text */}
        <div className="text-center text-sm text-muted-foreground">
          {isLastItem ? (
            <p>Please acknowledge that you've read the information above to continue</p>
          ) : (
            <p>Please review all sections before continuing with your screening</p>
          )}
        </div>
      </div>
    </div>
  );
}
