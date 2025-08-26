import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookTemplate } from '@/types';
import { BOOK_TEMPLATES } from '@/lib/lulu-api';
import { Check, BookOpen, Sparkles, Layout, Ruler, Scissors } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate?: BookTemplate;
  onTemplateSelect: (template: BookTemplate) => void;
}

export default function TemplateSelector({ selectedTemplate, onTemplateSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Layout className="h-8 w-8 text-blue-500" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Book Layout
          </h2>
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select a professional template that perfectly matches your content style and target audience
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BOOK_TEMPLATES.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                  : 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50'
              }`}
              onClick={() => onTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-full ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-500'
                  }`}>
                    <BookOpen className="h-5 w-5" />
                  </div>
                  {isSelected && (
                    <div className="bg-green-500 text-white p-1 rounded-full animate-pulse">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <CardTitle className={`text-xl font-bold ${
                  isSelected ? 'text-blue-700' : 'text-gray-800'
                }`}>
                  {template.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Layout className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Dimensions:</span>
                    </div>
                    <span className="font-mono text-blue-600">{template.dimensions.width}" × {template.dimensions.height}"</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Ruler className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Margins:</span>
                    </div>
                    <span className="font-mono text-green-600">{template.margins.top}" all sides</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Gutter:</span>
                    </div>
                    <span className="font-mono text-purple-600">{template.margins.gutter}"</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Scissors className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Bleed:</span>
                    </div>
                    <span className="font-mono text-orange-600">{template.bleed}"</span>
                  </div>
                </div>
                
                <div className="pt-3">
                  <Badge 
                    variant={isSelected ? 'default' : 'secondary'} 
                    className={`w-full justify-center py-2 transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md' 
                        : 'hover:bg-blue-100 hover:text-blue-700'
                    }`}
                  >
                    {isSelected ? (
                      <div className="flex items-center space-x-1">
                        <Check className="h-4 w-4" />
                        <span>Selected</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Sparkles className="h-4 w-4" />
                        <span>Select Template</span>
                      </div>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {selectedTemplate && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 text-white p-2 rounded-full">
                <Check className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <p className="text-xl font-bold text-green-800">
                    {selectedTemplate.name} Template Selected
                  </p>
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-green-700 leading-relaxed">
                  Perfect choice! Your document will be professionally formatted to <span className="font-mono bg-white px-2 py-1 rounded">{selectedTemplate.dimensions.width}" × {selectedTemplate.dimensions.height}"</span> with optimized margins and bleed for high-quality printing.
                </p>
                <div className="mt-3 flex items-center space-x-4 text-sm text-green-600">
                  <div className="flex items-center space-x-1">
                    <Layout className="h-4 w-4" />
                    <span>Professional Layout</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Ruler className="h-4 w-4" />
                    <span>Optimized Margins</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Scissors className="h-4 w-4" />
                    <span>Print-Ready Bleed</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}