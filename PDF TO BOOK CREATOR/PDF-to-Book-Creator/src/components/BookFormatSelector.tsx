import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookTemplate } from '@/types';
import { BookOpen, Ruler, Palette } from 'lucide-react';

interface BookFormatSelectorProps {
  onTemplateSelected: (template: BookTemplate) => void;
  selectedTemplate?: BookTemplate;
}

const bookTemplates: BookTemplate[] = [
  {
    id: 'pocket-book',
    name: 'Pocket Book',
    description: 'Perfect for novels and fiction',
    dimensions: { width: 4.25, height: 6.87 },
    margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.5, gutter: 0.25 },
    bleed: 0.125,
    podPackageId: 'pocket-book-package'
  },
  {
    id: 'standard-book',
    name: 'Standard Book',
    description: 'Most popular choice for general books',
    dimensions: { width: 6, height: 9 },
    margins: { top: 1, bottom: 1, left: 1, right: 0.75, gutter: 0.25 },
    bleed: 0.125,
    podPackageId: 'standard-book-package'
  },
  {
    id: 'large-book',
    name: 'Large Format',
    description: 'Great for textbooks and manuals',
    dimensions: { width: 7, height: 10 },
    margins: { top: 1, bottom: 1, left: 1, right: 0.75, gutter: 0.25 },
    bleed: 0.125,
    podPackageId: 'large-book-package'
  },
  {
    id: 'square-book',
    name: 'Square Format',
    description: 'Perfect for photo books and art books',
    dimensions: { width: 8, height: 8 },
    margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75, gutter: 0.25 },
    bleed: 0.125,
    podPackageId: 'square-book-package'
  },
  {
    id: 'landscape-book',
    name: 'Landscape Format',
    description: 'Ideal for coffee table books',
    dimensions: { width: 11, height: 8.5 },
    margins: { top: 0.75, bottom: 0.75, left: 1, right: 1, gutter: 0.25 },
    bleed: 0.125,
    podPackageId: 'landscape-book-package'
  },
  {
    id: 'digest-book',
    name: 'Digest Size',
    description: 'Compact size for magazines and journals',
    dimensions: { width: 5.5, height: 8.5 },
    margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.5, gutter: 0.25 },
    bleed: 0.125,
    podPackageId: 'digest-book-package'
  }
];

const paperTypes = [
  { id: 'standard', name: 'Standard White', description: '60# white paper', popular: true },
  { id: 'cream', name: 'Cream Paper', description: '60# cream paper', popular: false },
  { id: 'premium', name: 'Premium White', description: '70# premium white', popular: false }
];

const bindingTypes = [
  { id: 'perfect', name: 'Perfect Binding', description: 'Standard paperback binding', popular: true },
  { id: 'saddle', name: 'Saddle Stitched', description: 'Stapled binding for thin books', popular: false },
  { id: 'hardcover', name: 'Hardcover', description: 'Premium hardcover binding', popular: false }
];

const BookFormatSelector: React.FC<BookFormatSelectorProps> = ({
  onTemplateSelected,
  selectedTemplate
}) => {
  const [selectedPaper, setSelectedPaper] = useState('standard');
  const [selectedBinding, setSelectedBinding] = useState('perfect');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (template: BookTemplate) => {
    const enhancedTemplate = {
      ...template,
      paperType: selectedPaper,
      bindingType: selectedBinding
    };
    onTemplateSelected(enhancedTemplate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Book Format</h2>
        <p className="text-muted-foreground">
          Select the perfect size and specifications for your book
        </p>
      </div>

      {/* Book Size Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Book Size & Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookTemplates.map((template) => (
              <div
                key={template.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : hoveredTemplate === template.id
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTemplateSelect(template)}
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
              >
                {template.id === 'standard-book' && (
                  <Badge className="absolute top-2 right-2 bg-green-500">Popular</Badge>
                )}
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="h-4 w-4" />
                    <span>{template.dimensions.width}" × {template.dimensions.height}"</span>
                  </div>
                  
                  {/* Visual representation */}
                  <div className="flex justify-center py-2">
                    <div
                      className="border-2 border-gray-400 bg-white shadow-sm"
                      style={{
                        width: `${Math.min(template.dimensions.width * 8, 60)}px`,
                        height: `${Math.min(template.dimensions.height * 8, 80)}px`,
                        aspectRatio: `${template.dimensions.width} / ${template.dimensions.height}`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paper Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Paper Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paperTypes.map((paper) => (
              <div
                key={paper.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPaper === paper.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPaper(paper.id)}
              >
                {paper.popular && (
                  <Badge className="absolute top-2 right-2 bg-green-500">Popular</Badge>
                )}
                <div>
                  <h4 className="font-medium">{paper.name}</h4>
                  <p className="text-sm text-muted-foreground">{paper.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Binding Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Binding Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bindingTypes.map((binding) => (
              <div
                key={binding.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedBinding === binding.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedBinding(binding.id)}
              >
                {binding.popular && (
                  <Badge className="absolute top-2 right-2 bg-green-500">Popular</Badge>
                )}
                <div>
                  <h4 className="font-medium">{binding.name}</h4>
                  <p className="text-sm text-muted-foreground">{binding.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {selectedTemplate && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Your Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Format:</span> {selectedTemplate.name}
              </div>
              <div>
                <span className="font-medium">Paper:</span> {paperTypes.find(p => p.id === selectedPaper)?.name}
              </div>
              <div>
                <span className="font-medium">Binding:</span> {bindingTypes.find(b => b.id === selectedBinding)?.name}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookFormatSelector;
