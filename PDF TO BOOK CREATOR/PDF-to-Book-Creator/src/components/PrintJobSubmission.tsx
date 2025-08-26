import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DocumentFile, CoverDesign, BookTemplate, PrintJob, CostCalculation } from '@/types';
import { luluAPI } from '@/lib/lulu-api';
import { uploadFileToStorage } from '@/lib/file-utils';
import { 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Truck, 
  MapPin,
  ExternalLink,
  Download,
  Share2,
  AlertTriangle,
  Eye,
  FileText
} from 'lucide-react';

interface PrintJobSubmissionProps {
  document: DocumentFile;
  template: BookTemplate;
  coverDesign: CoverDesign;
  costCalculation: CostCalculation;
  onJobSubmitted: (job: PrintJob) => void;
}

export default function PrintJobSubmission({ 
  document, 
  template, 
  coverDesign, 
  costCalculation, 
  onJobSubmitted 
}: PrintJobSubmissionProps) {
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'uploading' | 'validating' | 'submitting' | 'completed' | 'error'>('idle');
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const submitPrintJob = async () => {
    if (!contactEmail || !document.file) return;

    setIsSubmitting(true);
    setSubmissionProgress(0);
    setError(null);

    try {
      // Step 1: Upload files
      setSubmissionStatus('uploading');
      setSubmissionProgress(20);
      
      const interiorFileUrl = await uploadFileToStorage(document.file);
      
      setSubmissionProgress(40);
      
      // Generate cover file (in a real app, this would be the actual cover file)
      const coverBlob = new Blob(['mock cover data'], { type: 'application/pdf' });
      const coverFile = new File([coverBlob], 'cover.pdf', { type: 'application/pdf' });
      const coverFileUrl = await uploadFileToStorage(coverFile);
      
      setSubmissionProgress(60);

      // Step 2: Validate files
      setSubmissionStatus('validating');
      
      const interiorValidation = await luluAPI.validateInterior(interiorFileUrl);
      const coverValidation = await luluAPI.validateCover(coverFileUrl);
      
      if (interiorValidation.status === 'ERROR' || coverValidation.status === 'ERROR') {
        throw new Error('File validation failed');
      }
      
      setSubmissionProgress(80);

      // Step 3: Submit print job
      setSubmissionStatus('submitting');
      
      const job = await luluAPI.createPrintJob(
        interiorFileUrl,
        coverFileUrl,
        template.podPackageId,
        contactEmail,
        `book-${Date.now()}`,
        costCalculation.quantity
      );
      
      setSubmissionProgress(100);
      setSubmissionStatus('completed');
      setPrintJob(job);
      onJobSubmitted(job);
      
    } catch (err) {
      setSubmissionStatus('error');
      setError(err instanceof Error ? err.message : 'Submission failed');
      console.error('Print job submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusMessage = () => {
    switch (submissionStatus) {
      case 'uploading':
        return 'Uploading your files to Lulu...';
      case 'validating':
        return 'Validating files for print quality...';
      case 'submitting':
        return 'Creating your print job...';
      case 'completed':
        return 'Print job submitted successfully!';
      case 'error':
        return 'Submission failed. Please try again.';
      default:
        return 'Ready to submit your book for printing';
    }
  };

  const getJobStatusBadge = (status: PrintJob['status']) => {
    const statusConfig = {
      created: { color: 'bg-blue-100 text-blue-800', label: 'Created' },
      in_production: { color: 'bg-yellow-100 text-yellow-800', label: 'In Production' },
      shipped: { color: 'bg-green-100 text-green-800', label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      error: { color: 'bg-red-100 text-red-800', label: 'Error' },
    };
    
    const config = statusConfig[status] || statusConfig.created;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const downloadPDF = () => {
    try {
      // Create a simple PDF-like content for demo purposes
      const pdfContent = `
PDF PREVIEW - ${document.file.name}

Book Title: Sample Book
Template: ${template.name}
Pages: ${document.pages}
Size: ${template.specs.width}" x ${template.specs.height}"

Cover Design:
${coverDesign.frontImage ? 'Custom front cover uploaded' : 'Template cover selected'}
${coverDesign.backText ? `Back text: ${coverDesign.backText}` : ''}
${coverDesign.authorBio ? `Author bio: ${coverDesign.authorBio}` : ''}

Print Specifications:
Paper: ${template.specs.paper}
Binding: ${template.specs.binding}
Cost per unit: $${costCalculation.unitCost || 'N/A'}
Total for ${costCalculation.quantity} copies: $${costCalculation.total || costCalculation.totalCost || 'N/A'}

Generated on: ${new Date().toLocaleString()}
`;
      
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create download link safely
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.file.name.replace(/\.[^/.]+$/, '')}_preview.txt`;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF preview downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert('Erreur lors du téléchargement du PDF. Veuillez réessayer.');
    }
  };

  const sharePreview = () => {
    const shareData = {
      title: 'My Book Preview',
      text: 'Check out my book that\'s being printed!',
      url: window.location.href + '?preview=' + printJob.id,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const shareUrl = shareData.url;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Preview link copied to clipboard!');
      }).catch(() => {
        // Fallback for clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Preview link copied to clipboard!');
      });
    }
  };

  if (printJob) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Print Job Submitted!</h2>
          <p className="text-muted-foreground">
            Your book is now in the printing queue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Job ID</p>
                <p className="text-sm text-muted-foreground font-mono">{printJob.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                {getJobStatusBadge(printJob.status)}
              </div>
              <div>
                <p className="text-sm font-medium">Submitted</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(printJob.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Estimated Delivery</p>
                <p className="text-sm text-muted-foreground">
                  {printJob.estimatedDelivery || 'TBD'}
                </p>
              </div>
            </div>

            {printJob.trackingUrl && (
              <Alert>
                <Truck className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Tracking information available</span>
                    <Button variant="link" size="sm" asChild>
                      <a href={printJob.trackingUrl} target="_blank" rel="noopener noreferrer">
                        Track Package <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-medium">Production</h3>
                <p className="text-sm text-muted-foreground">Your book will enter production within 24 hours</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Truck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium">Shipping</h3>
                <p className="text-sm text-muted-foreground">We'll email you tracking info when shipped</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <MapPin className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-medium">Delivery</h3>
                <p className="text-sm text-muted-foreground">Your books will arrive at your doorstep</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={downloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={sharePreview}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Preview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to Print</h2>
        <p className="text-muted-foreground">
          Review your order and submit for printing
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Book Format</span>
              <span className="font-medium">{template.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Pages</span>
              <span className="font-medium">{document.pages}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity</span>
              <span className="font-medium">{costCalculation.quantity}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Cost</span>
              <span>${costCalculation.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Preview & Validation Section */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            IMPORTANT: Validation Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-orange-600 text-sm">
            Please download and review the PDF preview before submitting to Lulu.com
          </p>
          
          <div className="flex gap-3">
            <Button onClick={downloadPDF} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download PDF Preview
            </Button>
            <Button 
              onClick={() => setShowPreview(!showPreview)} 
              variant="outline" 
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>

          {showPreview && (
            <div className="mt-4 p-4 bg-white border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PDF Content Preview:
              </h4>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
{`PDF PREVIEW - ${document.file.name}

Book Title: Sample Book
Template: ${template.name}
Pages: ${document.pages}
Size: ${template.specs?.width || 'N/A'}" x ${template.specs?.height || 'N/A'}"

Cover Design:
${coverDesign.frontImage ? 'Custom front cover uploaded' : 'Template cover selected'}
${coverDesign.backText ? `Back text: ${coverDesign.backText}` : ''}
${coverDesign.authorBio ? `Author bio: ${coverDesign.authorBio}` : ''}

Print Specifications:
Paper: ${template.specs?.paper || 'Standard'}
Binding: ${template.specs?.binding || 'Perfect Bound'}
Cost per unit: $${costCalculation.unitCost || 'N/A'}
Total for ${costCalculation.quantity} copies: $${costCalculation.total || costCalculation.totalCost || 'N/A'}`}
              </pre>
            </div>
          )}

          <div className="flex items-center space-x-2 p-3 bg-white border rounded-lg">
            <input
              type="checkbox"
              id="validation-checkbox"
              checked={isValidated}
              onChange={(e) => setIsValidated(e.target.checked)}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="validation-checkbox" className="text-sm font-medium">
              J'ai téléchargé, vérifié et validé le contenu du PDF avant l'envoi à Lulu.com
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="contact-email">Email Address</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Enter your email for updates"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You'll receive status updates and tracking information at this email
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submission Status */}
      {isSubmitting && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2" />
                <p className="font-medium">{getStatusMessage()}</p>
              </div>
              <Progress value={submissionProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {submissionProgress}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="text-center">
        <Button 
          onClick={submitPrintJob}
          disabled={!contactEmail || isSubmitting || !isValidated}
          size="lg"
          className="px-8"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Submitting...' : (!isValidated ? 'Please Validate PDF First' : 'Submit Print Job')}
        </Button>
        {!isValidated && (
          <p className="text-sm text-orange-600 mt-2">
            Vous devez valider le PDF avant de pouvoir soumettre la commande
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          By submitting, you agree to our terms of service and printing policies
        </p>
      </div>
    </div>
  );
}