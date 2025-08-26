import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { Upload, Wand2, Image as ImageIcon, Loader2, CheckCircle, Palette, Sparkles, BookOpen, Eye } from 'lucide-react';
import { CoverDesign } from '@/types';

interface CoverDesignerProps {
  onCoverDesigned: (design: CoverDesign) => void;
  bookTitle?: string;
  authorName?: string;
}

const CoverDesigner: React.FC<CoverDesignerProps> = ({
  onCoverDesigned,
  bookTitle = '',
  authorName = ''
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [backCoverText, setBackCoverText] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const generateCoverWithAI = async () => {
    if (!generationPrompt.trim()) {
      setError('Please enter a description for your cover');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: generationPrompt,
          bookTitle,
          authorName,
          style: 'professional'
        })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!response.ok) {
        throw new Error('Failed to generate cover');
      }

      const data = await response.json();
      
      // For now, we'll simulate a successful generation
      setSuccess('Cover generated successfully! (Note: AI generation will be implemented with OpenAI API)');
      setImagePreview('/api/placeholder/400/600'); // Placeholder for now
      
    } catch (err) {
      setError('Failed to generate cover. Please try again.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  const handleSaveDesign = () => {
    const design: CoverDesign = {
      frontImage: coverImage || imagePreview,
      backText: backCoverText,
      authorBio: authorBio,
      spineWidth: 0.5, // Will be calculated based on page count
      backCoverGenerated: !!backCoverText,
      backCoverData: backCoverText ? {
        description: backCoverText,
        authorBio: authorBio,
        isbn: '', // Will be generated
        publisher: 'Self-Published',
        category: 'General'
      } : undefined
    };

    onCoverDesigned(design);
    setSuccess('Cover design saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Palette className="h-8 w-8 text-purple-500" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Design Your Book Cover
          </h2>
          <Sparkles className="h-8 w-8 text-pink-500" />
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Create a stunning cover that captures your story's essence - upload your own design or let AI bring your vision to life
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Cover Creation */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-purple-50 to-pink-50 p-1">
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger 
                value="generate" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-200"
              >
                <Wand2 className="h-4 w-4" />
                AI Generate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <Card className="border-purple-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <div className="p-2 bg-purple-500 text-white rounded-full">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    Upload Cover Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 scale-105 shadow-lg'
                        : 'border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:shadow-md'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className={`p-4 rounded-full mx-auto mb-4 w-fit ${
                      isDragActive ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-500'
                    }`}>
                      <Upload className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold mb-2">
                      {isDragActive ? 'Drop your image here!' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports JPG, PNG, WebP • Maximum 10MB
                    </p>
                    <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-purple-600">
                      <div className="flex items-center space-x-1">
                        <Sparkles className="h-3 w-3" />
                        <span>High Quality</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>Instant Preview</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="generate" className="space-y-4">
              <Card className="border-pink-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-100">
                  <CardTitle className="flex items-center gap-2 text-pink-700">
                    <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full">
                      <Wand2 className="h-4 w-4" />
                    </div>
                    AI Cover Generation
                    <Sparkles className="h-4 w-4 text-pink-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <Label htmlFor="prompt">Describe your ideal cover</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., A mysterious forest at twilight with ancient trees and glowing lights, fantasy book cover style..."
                      value={generationPrompt}
                      onChange={(e) => setGenerationPrompt(e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Generating your cover...</span>
                      </div>
                      <Progress value={generationProgress} className="w-full" />
                    </div>
                  )}
                  
                  <Button 
                    onClick={generateCoverWithAI}
                    disabled={isGenerating || !generationPrompt.trim()}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Magic...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5 mr-2" />
                        Generate Cover with AI
                        <Sparkles className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Back Cover Content */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <div className="p-2 bg-blue-500 text-white rounded-full">
                  <BookOpen className="h-4 w-4" />
                </div>
                Back Cover Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="backText">Book Description</Label>
                <Textarea
                  id="backText"
                  placeholder="Enter a compelling description for the back cover..."
                  value={backCoverText}
                  onChange={(e) => setBackCoverText(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="authorBio">Author Bio</Label>
                <Textarea
                  id="authorBio"
                  placeholder="Brief author biography..."
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card className="border-indigo-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-100">
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <div className="p-2 bg-indigo-500 text-white rounded-full">
                  <Eye className="h-4 w-4" />
                </div>
                Live Preview
                <Sparkles className="h-4 w-4 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="aspect-[2/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-inner">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover rounded-xl shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="p-4 bg-gray-200 rounded-full mx-auto mb-4 w-fit">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                    <p className="text-lg font-medium">Cover preview will appear here</p>
                    <p className="text-sm mt-2">Upload an image or generate with AI</p>
                  </div>
                )}
              </div>
              
              {(coverImage || imagePreview) && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <strong>Title:</strong> {bookTitle || 'Your Book Title'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Author:</strong> {authorName || 'Author Name'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSaveDesign}
            disabled={!coverImage && !imagePreview}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
            size="lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Save Cover Design
            <Sparkles className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CoverDesigner;
