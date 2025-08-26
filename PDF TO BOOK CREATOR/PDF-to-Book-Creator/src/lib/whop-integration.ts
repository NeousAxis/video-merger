// Whop Integration Service for PDF to Book Creator
// This handles license validation and payment processing through Whop

export interface WhopUser {
  id: string;
  email: string;
  username?: string;
  avatar?: string;
  plan: 'free' | 'premium' | 'enterprise';
  expiresAt?: string;
  features: string[];
}

export interface WhopLicense {
  id: string;
  userId: string;
  productId: string;
  status: 'active' | 'expired' | 'cancelled';
  expiresAt?: string;
  features: string[];
}

class WhopService {
  private apiKey: string;
  private productId: string;
  private baseUrl = 'https://api.whop.com/v1';

  constructor() {
    this.apiKey = process.env.WHOP_API_KEY || '';
    this.productId = process.env.WHOP_PRODUCT_ID || '';
  }

  // Validate Whop license
  async validateLicense(licenseKey: string): Promise<WhopLicense | null> {
    try {
      const response = await fetch(`${this.baseUrl}/licenses/${licenseKey}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      return {
        id: data.id,
        userId: data.user_id,
        productId: data.product_id,
        status: data.status,
        expiresAt: data.expires_at,
        features: data.metadata?.features || []
      };
    } catch (error) {
      console.error('Error validating Whop license:', error);
      return null;
    }
  }

  // Get user information from Whop
  async getUser(userId: string): Promise<WhopUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      return {
        id: data.id,
        email: data.email,
        username: data.username,
        avatar: data.avatar,
        plan: this.determinePlan(data.licenses),
        features: this.extractFeatures(data.licenses)
      };
    } catch (error) {
      console.error('Error fetching Whop user:', error);
      return null;
    }
  }

  // Check if user has access to specific feature
  async hasFeatureAccess(licenseKey: string, feature: string): Promise<boolean> {
    const license = await this.validateLicense(licenseKey);
    
    if (!license || license.status !== 'active') {
      return false;
    }

    // Check if license has expired
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return false;
    }

    return license.features.includes(feature) || license.features.includes('all');
  }

  // Generate checkout URL for Whop
  generateCheckoutUrl(planType: 'premium' | 'enterprise', successUrl?: string, cancelUrl?: string): string {
    const params = new URLSearchParams({
      product_id: this.productId,
      plan: planType,
      success_url: successUrl || `${process.env.APP_URL}/success`,
      cancel_url: cancelUrl || `${process.env.APP_URL}/cancel`
    });

    return `https://whop.com/checkout?${params.toString()}`;
  }

  // Webhook handler for Whop events
  async handleWebhook(payload: any, signature: string): Promise<boolean> {
    try {
      // Verify webhook signature (implement based on Whop's webhook security)
      if (!this.verifyWebhookSignature(payload, signature)) {
        return false;
      }

      const { event, data } = payload;

      switch (event) {
        case 'license.created':
          await this.handleLicenseCreated(data);
          break;
        case 'license.updated':
          await this.handleLicenseUpdated(data);
          break;
        case 'license.cancelled':
          await this.handleLicenseCancelled(data);
          break;
        default:
          console.log('Unhandled Whop webhook event:', event);
      }

      return true;
    } catch (error) {
      console.error('Error handling Whop webhook:', error);
      return false;
    }
  }

  // Private helper methods
  private determinePlan(licenses: any[]): 'free' | 'premium' | 'enterprise' {
    if (!licenses || licenses.length === 0) return 'free';
    
    const activeLicenses = licenses.filter(l => l.status === 'active');
    if (activeLicenses.some(l => l.product_type === 'enterprise')) return 'enterprise';
    if (activeLicenses.some(l => l.product_type === 'premium')) return 'premium';
    
    return 'free';
  }

  private extractFeatures(licenses: any[]): string[] {
    const features = new Set<string>();
    
    licenses
      .filter(l => l.status === 'active')
      .forEach(license => {
        if (license.metadata?.features) {
          license.metadata.features.forEach((f: string) => features.add(f));
        }
      });
    
    return Array.from(features);
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // Implement Whop's webhook signature verification
    // This is a placeholder - implement based on Whop's documentation
    return true;
  }

  private async handleLicenseCreated(data: any): Promise<void> {
    console.log('New license created:', data);
    // Implement license creation logic
  }

  private async handleLicenseUpdated(data: any): Promise<void> {
    console.log('License updated:', data);
    // Implement license update logic
  }

  private async handleLicenseCancelled(data: any): Promise<void> {
    console.log('License cancelled:', data);
    // Implement license cancellation logic
  }
}

// Export singleton instance
export const whopService = new WhopService();

// Feature constants
export const WHOP_FEATURES = {
  BASIC_PDF_CONVERSION: 'basic_pdf_conversion',
  ADVANCED_FORMATTING: 'advanced_formatting',
  CUSTOM_COVERS: 'custom_covers',
  AI_COVER_GENERATION: 'ai_cover_generation',
  BULK_PROCESSING: 'bulk_processing',
  PRIORITY_SUPPORT: 'priority_support',
  WHITE_LABEL: 'white_label'
} as const;