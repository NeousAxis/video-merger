export interface User {
  id: string;
  name: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  dimensions: {
    width: number;
    height: number;
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    gutter: number;
  };
  bleed: number;
  podPackageId: string;
}

export interface CoverStyle {
  id: string;
  name: string;
  thumbnail: string;
  category: 'minimalist' | 'photo' | 'illustration';
}

export interface DocumentFile {
  file: File;
  type: 'pdf' | 'docx' | 'odt';
  pages: number;
  validationStatus: 'pending' | 'validating' | 'normalized' | 'error';
  errors?: string[];
}

export interface CoverDesign {
  frontImage?: File | string;
  backText?: string;
  authorBio?: string;
  style?: CoverStyle;
  spineWidth: number;
  backCoverGenerated?: boolean;
  backCoverData?: {
    description: string;
    authorBio: string;
    isbn: string;
    publisher: string;
    category: string;
  };
}

export interface CostCalculation {
  unitPrice: number;
  discounts: number;
  taxes: number;
  fulfillmentFee: number;
  shippingCost: number;
  subtotal: number;
  total: number;
  quantity: number;
}

export interface PrintJob {
  id: string;
  status: 'created' | 'in_production' | 'shipped' | 'delivered' | 'error';
  trackingUrl?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}