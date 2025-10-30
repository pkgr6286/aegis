import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Video, FileText } from 'lucide-react';
import type { EducationModule, ComprehensionCheck, EducationContent, ComprehensionQuestion, ScreenerOutcome } from '@/types/screener';

interface ScreenerSettingsProps {
  educationModule?: EducationModule;
  comprehensionCheck?: ComprehensionCheck;
  onUpdate: (settings: { educationModule?: EducationModule; comprehensionCheck?: ComprehensionCheck }) => void;
}

export function ScreenerSettings({ 
  educationModule, 
  comprehensionCheck,
  onUpdate 
}: ScreenerSettingsProps) {
  // Education Module State
  const [eduEnabled, setEduEnabled] = useState(educationModule?.required ?? false);
  const [eduContent, setEduContent] = useState<EducationContent[]>(educationModule?.content ?? []);

  // Comprehension Check State
  const [compEnabled, setCompEnabled] = useState(comprehensionCheck?.required ?? false);
  const [compPassingScore, setCompPassingScore] = useState(comprehensionCheck?.passingScore?.toString() ?? '80');
  const [compQuestions, setCompQuestions] = useState<ComprehensionQuestion[]>(comprehensionCheck?.questions ?? []);
  const [compFailOutcome, setCompFailOutcome] = useState<ScreenerOutcome>(comprehensionCheck?.failOutcome ?? 'ask_a_doctor');
  const [compAllowRetry, setCompAllowRetry] = useState(comprehensionCheck?.allowRetry ?? false);

  useEffect(() => {
    setEduEnabled(educationModule?.required ?? false);
    setEduContent(educationModule?.content ?? []);
    setCompEnabled(comprehensionCheck?.required ?? false);
    setCompPassingScore(comprehensionCheck?.passingScore?.toString() ?? '80');
    setCompQuestions(comprehensionCheck?.questions ?? []);
    setCompFailOutcome(comprehensionCheck?.failOutcome ?? 'ask_a_doctor');
    setCompAllowRetry(comprehensionCheck?.allowRetry ?? false);
  }, [educationModule, comprehensionCheck]);

  const handleSave = () => {
    const settings: { educationModule?: EducationModule; comprehensionCheck?: ComprehensionCheck } = {};

    if (eduEnabled && eduContent.length > 0) {
      settings.educationModule = {
        required: true,
        content: eduContent,
      };
    }

    if (compEnabled && compQuestions.length > 0) {
      settings.comprehensionCheck = {
        required: true,
        passingScore: parseInt(compPassingScore),
        questions: compQuestions,
        failOutcome: compFailOutcome,
        allowRetry: compAllowRetry,
      };
    }

    onUpdate(settings);
  };

  // Education Content Handlers
  const addVideoContent = () => {
    setEduContent([...eduContent, { type: 'video', url: '', title: 'Educational Video' }]);
  };

  const addTextContent = () => {
    setEduContent([...eduContent, { type: 'text', markdown: '### Important Information\n\nEnter your educational content here...' }]);
  };

  const removeContent = (index: number) => {
    setEduContent(eduContent.filter((_, i) => i !== index));
  };

  const updateContent = (index: number, updates: Partial<EducationContent>) => {
    const newContent = [...eduContent];
    newContent[index] = { ...newContent[index], ...updates };
    setEduContent(newContent);
  };

  // Comprehension Question Handlers
  const addQuestion = () => {
    setCompQuestions([
      ...compQuestions,
      {
        id: `cq${compQuestions.length + 1}`,
        text: 'Enter your question here',
        options: ['Option 1', 'Option 2'],
        correctAnswer: 'Option 1',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setCompQuestions(compQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<ComprehensionQuestion>) => {
    const newQuestions = [...compQuestions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setCompQuestions(newQuestions);
  };

  const addQuestionOption = (questionIndex: number) => {
    const question = compQuestions[questionIndex];
    updateQuestion(questionIndex, {
      options: [...question.options, `Option ${question.options.length + 1}`],
    });
  };

  const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
    const question = compQuestions[questionIndex];
    updateQuestion(questionIndex, {
      options: question.options.filter((_, i) => i !== optionIndex),
    });
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = compQuestions[questionIndex];
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: newOptions });
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Screener Settings</h2>
          <p className="text-sm text-muted-foreground">Configure education and comprehension check</p>
        </div>
        <Button onClick={handleSave} size="sm" data-testid="button-save-settings">
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="education" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="education">Education Module</TabsTrigger>
          <TabsTrigger value="comprehension">Comprehension Check</TabsTrigger>
        </TabsList>

        {/* Education Module Tab */}
        <TabsContent value="education" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Education Module</CardTitle>
                  <CardDescription className="text-sm">
                    Add educational content (videos, text) that users must view
                  </CardDescription>
                </div>
                <Switch
                  checked={eduEnabled}
                  onCheckedChange={setEduEnabled}
                  data-testid="switch-education-enabled"
                />
              </div>
            </CardHeader>
            {eduEnabled && (
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addVideoContent}
                    data-testid="button-add-video"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTextContent}
                    data-testid="button-add-text"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Text
                  </Button>
                </div>

                {eduContent.map((content, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          {content.type === 'video' ? 'Video Content' : 'Text Content'}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContent(index)}
                          data-testid={`button-remove-content-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {content.type === 'video' ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`video-title-${index}`}>Video Title</Label>
                            <Input
                              id={`video-title-${index}`}
                              value={content.title || ''}
                              onChange={(e) => updateContent(index, { title: e.target.value })}
                              placeholder="e.g., How to Use Your Inhaler"
                              data-testid={`input-video-title-${index}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`video-url-${index}`}>Video URL</Label>
                            <Input
                              id={`video-url-${index}`}
                              value={content.url || ''}
                              onChange={(e) => updateContent(index, { url: e.target.value })}
                              placeholder="https://youtube.com/watch?v=..."
                              data-testid={`input-video-url-${index}`}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor={`text-content-${index}`}>Markdown Content</Label>
                          <Textarea
                            id={`text-content-${index}`}
                            value={content.markdown || ''}
                            onChange={(e) => updateContent(index, { markdown: e.target.value })}
                            rows={8}
                            placeholder="Enter educational text in Markdown format..."
                            data-testid={`textarea-markdown-${index}`}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {eduContent.length === 0 && (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No educational content added yet. Click above to add videos or text.
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Comprehension Check Tab */}
        <TabsContent value="comprehension" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Comprehension Check</CardTitle>
                  <CardDescription className="text-sm">
                    Quiz to verify user understanding before approval
                  </CardDescription>
                </div>
                <Switch
                  checked={compEnabled}
                  onCheckedChange={setCompEnabled}
                  data-testid="switch-comprehension-enabled"
                />
              </div>
            </CardHeader>
            {compEnabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passing-score">Passing Score (%)</Label>
                    <Input
                      id="passing-score"
                      type="number"
                      min="0"
                      max="100"
                      value={compPassingScore}
                      onChange={(e) => setCompPassingScore(e.target.value)}
                      data-testid="input-passing-score"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fail-outcome">Fail Outcome</Label>
                    <Select value={compFailOutcome} onValueChange={(v) => setCompFailOutcome(v as ScreenerOutcome)}>
                      <SelectTrigger id="fail-outcome" data-testid="select-fail-outcome">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ask_a_doctor">Ask a Doctor</SelectItem>
                        <SelectItem value="do_not_use">Do Not Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow-retry"
                    checked={compAllowRetry}
                    onCheckedChange={setCompAllowRetry}
                    data-testid="switch-allow-retry"
                  />
                  <Label htmlFor="allow-retry">Allow one retry if failed</Label>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Quiz Questions</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    data-testid="button-add-question"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {compQuestions.map((question, qIndex) => (
                  <Card key={question.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Question {qIndex + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(qIndex)}
                          data-testid={`button-remove-question-${qIndex}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`question-text-${qIndex}`}>Question Text</Label>
                        <Textarea
                          id={`question-text-${qIndex}`}
                          value={question.text}
                          onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                          rows={2}
                          data-testid={`textarea-question-text-${qIndex}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Answer Options</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addQuestionOption(qIndex)}
                            data-testid={`button-add-option-${qIndex}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                              data-testid={`input-option-${qIndex}-${oIndex}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestionOption(qIndex, oIndex)}
                              data-testid={`button-remove-option-${qIndex}-${oIndex}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`correct-answer-${qIndex}`}>Correct Answer</Label>
                        <Select
                          value={question.correctAnswer}
                          onValueChange={(v) => updateQuestion(qIndex, { correctAnswer: v })}
                        >
                          <SelectTrigger id={`correct-answer-${qIndex}`} data-testid={`select-correct-answer-${qIndex}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {question.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {compQuestions.length === 0 && (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No quiz questions added yet. Click above to add questions.
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
