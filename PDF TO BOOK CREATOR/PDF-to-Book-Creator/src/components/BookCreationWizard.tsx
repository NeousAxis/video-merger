import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentFile, BookTemplate, CoverDesign, CostCalculation, PrintJob, WizardStep, CoverStyle } from '@/types';
import { BOOK_TEMPLATES } from '@/lib/lulu-api';
import WizardSteps from './WizardSteps';
import FileUpload from './FileUpload';
import TemplateSelector from './TemplateSelector';
import CoverDesigner from './CoverDesigner';
import CostCalculator from './CostCalculator';
import PrintJobSubmission from './PrintJobSubmission';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles } from 'lucide-react';

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'upload',
    title: 'Upload Document',
    description: 'Add your PDF, DOCX, or ODT file',
    completed: false,
    current: true,
  },
  {
    id: 'template',
    title: 'Select Layout',
    description: 'Choose book format and size',
    completed: false,
    current: false,
  },
  {
    id: 'cover',
    title: 'Design Cover',
    description: 'Create your book cover',
    completed: false,
    current: false,
  },
  {
    id: 'cost',
    title: 'Review Cost',
    description: 'Calculate printing costs',
    completed: false,
    current: false,
  },
  {
    id: 'submit',
    title: 'Submit Order',
    description: 'Send to printer',
    completed: false,
    current: false,
  },
];

export default function BookCreationWizard() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState(WIZARD_STEPS);
  const [document, setDocument] = useState<DocumentFile | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BookTemplate | null>(null);
  const [coverDesign, setCoverDesign] = useState<CoverDesign>({
    backText: '',
    authorBio: '',
    style: undefined,
    spineWidth: 0.2,
    backCoverGenerated: false,
  });
  const [costCalculation, setCostCalculation] = useState<CostCalculation | null>(null);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  const updateSteps = (stepIndex: number, completed = false) => {
    setSteps(prevSteps =>
      prevSteps.map((step, index) => ({
        ...step,
        completed: index < stepIndex || completed,
        current: index === stepIndex,
      }))
    );
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      updateSteps(nextIndex);
      
      // Scroll to top of the page when changing steps
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      updateSteps(prevIndex);
      
      // Scroll to top of the page when changing steps
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const canProceed = () => {
    switch (currentStepIndex) {
      case 0: // Upload
        return document?.file && document.validationStatus !== 'error';
      case 1: // Template
        return selectedTemplate !== null;
      case 2: // Cover
        return selectedTemplate && 
               (coverDesign.style?.id || coverDesign.frontImage || coverDesign.backCoverGenerated) &&
               document?.pages && document.pages > 0;
      case 3: // Cost
        return costCalculation !== null;
      case 4: // Submit
        return printJob !== null;
      default:
        return false;
    }
  };

  const handleFileSelect = (file: DocumentFile) => {
    setDocument(file);
    // Simulate file validation
    setTimeout(() => {
      if (file.file) {
        setDocument(prev => prev ? { ...prev, validationStatus: 'normalized' } : null);
      }
    }, 2000);
  };

  const handleTemplateSelect = (template: BookTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCoverDesignChange = (design: CoverDesign) => {
    setCoverDesign(design);
  };

  const handleCostCalculated = (cost: CostCalculation) => {
    setCostCalculation(cost);
  };

  const handleJobSubmitted = (job: PrintJob) => {
    setPrintJob(job);
    updateSteps(currentStepIndex, true);
  };

  const renderCurrentStep = () => {
    switch (currentStepIndex) {
      case 0:
        return (
          <FileUpload
            onFileUploaded={handleFileSelect}
          />
        );
      case 1:
        return (
          <TemplateSelector
            selectedTemplate={selectedTemplate || undefined}
            onTemplateSelect={handleTemplateSelect}
          />
        );
      case 2:
        if (!selectedTemplate || !document) {
          return <div>Please complete previous steps first.</div>;
        }
        return (
          <CoverDesigner
          onCoverDesigned={handleCoverDesignChange}
          bookTitle={selectedTemplate?.name || ''}
          authorName="Auteur"
        />
        );
      case 3:
        if (!selectedTemplate || !document) {
          return <div>Please complete previous steps first.</div>;
        }
        return (
          <CostCalculator
            template={selectedTemplate}
            pageCount={document.pages}
            onCostCalculated={handleCostCalculated}
          />
        );
      case 4:
        if (!document || !selectedTemplate || !costCalculation) {
          return <div>Please complete previous steps first.</div>;
        }
        return (
          <PrintJobSubmission
            document={document}
            template={selectedTemplate}
            coverDesign={coverDesign}
            costCalculation={costCalculation}
            onJobSubmitted={handleJobSubmitted}
          />
        );
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-12">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-300 animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            PDF TO BOOK CREATOR
          </h1>
          <div className="flex items-center justify-center mb-6">
            <div className="h-1 w-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
          </div>
          <p className="text-xl text-teal-100 max-w-3xl mx-auto leading-relaxed">
            Transformez votre document en livre professionnel prêt à imprimer avec notre solution en un clic
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8">
            <WizardSteps steps={steps} />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-10">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        {!printJob && (
          <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStepIndex === 0}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white disabled:opacity-50 px-6 py-3 rounded-xl font-medium"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Précédent
            </Button>

            <div className="text-white/80 font-medium bg-white/10 px-4 py-2 rounded-lg">
              Étape {currentStepIndex + 1} sur {steps.length}
            </div>

            <Button
              onClick={nextStep}
              disabled={currentStepIndex === steps.length - 1 || !canProceed()}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white border-0 disabled:opacity-50 px-6 py-3 rounded-xl font-medium shadow-lg"
            >
              Suivant
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}