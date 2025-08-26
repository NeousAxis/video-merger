import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, Globe, Calendar, Tag } from 'lucide-react';

interface BookDetails {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  authorBio: string;
  genre: string;
  language: string;
  publicationDate: string;
  isbn?: string;
  keywords: string[];
  targetAudience: string;
  publisher: string;
}

interface BookDetailsFormProps {
  onDetailsSubmit: (details: BookDetails) => void;
  initialData?: Partial<BookDetails>;
}

const BookDetailsForm: React.FC<BookDetailsFormProps> = ({
  onDetailsSubmit,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<BookDetails>({
    title: initialData.title || '',
    subtitle: initialData.subtitle || '',
    author: initialData.author || '',
    description: initialData.description || '',
    authorBio: initialData.authorBio || '',
    genre: initialData.genre || '',
    language: initialData.language || 'English',
    publicationDate: initialData.publicationDate || new Date().toISOString().split('T')[0],
    isbn: initialData.isbn || '',
    keywords: initialData.keywords || [],
    targetAudience: initialData.targetAudience || '',
    publisher: initialData.publisher || 'Self-Published'
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
    'Fantasy', 'Thriller', 'Biography', 'History', 'Self-Help',
    'Business', 'Health', 'Travel', 'Cooking', 'Art', 'Poetry',
    'Children\'s', 'Young Adult', 'Educational', 'Technical'
  ];

  const targetAudiences = [
    'General Adult', 'Young Adult', 'Children (8-12)', 'Children (4-8)',
    'Academic', 'Professional', 'Seniors', 'Parents', 'Students'
  ];

  const languages = [
    'English', 'French', 'Spanish', 'German', 'Italian',
    'Portuguese', 'Dutch', 'Russian', 'Chinese', 'Japanese'
  ];

  const handleInputChange = (field: keyof BookDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Book description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description should be at least 50 characters';
    }

    if (!formData.authorBio.trim()) {
      newErrors.authorBio = 'Author bio is required';
    }

    if (!formData.genre) {
      newErrors.genre = 'Genre is required';
    }

    if (!formData.targetAudience) {
      newErrors.targetAudience = 'Target audience is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onDetailsSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Book Details & Metadata</h2>
        <p className="text-muted-foreground">
          Provide detailed information about your book for publishing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Book Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter your book title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="Enter subtitle if applicable"
                />
              </div>

              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  placeholder="Author name"
                  className={errors.author ? 'border-red-500' : ''}
                />
                {errors.author && (
                  <p className="text-sm text-red-500 mt-1">{errors.author}</p>
                )}
              </div>

              <div>
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={formData.publisher}
                  onChange={(e) => handleInputChange('publisher', e.target.value)}
                  placeholder="Publisher name"
                />
              </div>

              <div>
                <Label htmlFor="isbn">ISBN (Optional)</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => handleInputChange('isbn', e.target.value)}
                  placeholder="ISBN-13 (will be generated if empty)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categories & Keywords
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="genre">Genre *</Label>
                <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                  <SelectTrigger className={errors.genre ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.genre && (
                  <p className="text-sm text-red-500 mt-1">{errors.genre}</p>
                )}
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Select value={formData.targetAudience} onValueChange={(value) => handleInputChange('targetAudience', value)}>
                  <SelectTrigger className={errors.targetAudience ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetAudiences.map(audience => (
                      <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.targetAudience && (
                  <p className="text-sm text-red-500 mt-1">{errors.targetAudience}</p>
                )}
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(language => (
                      <SelectItem key={language} value={language}>{language}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="publicationDate">Publication Date</Label>
                <Input
                  id="publicationDate"
                  type="date"
                  value={formData.publicationDate}
                  onChange={(e) => handleInputChange('publicationDate', e.target.value)}
                />
              </div>

              <div>
                <Label>Keywords</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" onClick={addKeyword} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Descriptions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Book Description *</CardTitle>
              <p className="text-sm text-muted-foreground">
                This will appear on the back cover and in online listings
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Write a compelling description of your book that will entice readers..."
                rows={8}
                className={errors.description ? 'border-red-500' : ''}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">
                  {formData.description.length} characters
                </span>
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Author Biography *
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tell readers about yourself and your background
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.authorBio}
                onChange={(e) => handleInputChange('authorBio', e.target.value)}
                placeholder="Write a brief biography about yourself as an author..."
                rows={6}
                className={errors.authorBio ? 'border-red-500' : ''}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">
                  {formData.authorBio.length} characters
                </span>
                {errors.authorBio && (
                  <p className="text-sm text-red-500">{errors.authorBio}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg">
            Save Book Details
          </Button>
        </div>
      </div>
    </form>
  );
};

export default BookDetailsForm;
