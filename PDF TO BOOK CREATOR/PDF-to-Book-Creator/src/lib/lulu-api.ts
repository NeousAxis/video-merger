import { BookTemplate, CostCalculation, PrintJob } from '@/types';

// Lulu API configuration
const LULU_API_BASE = import.meta.env.VITE_LULU_API_BASE || 'https://api.lulu.com/v1';
const CLIENT_ID = import.meta.env.VITE_LULU_CLIENT_ID || 'demo_client_id';
const CLIENT_SECRET = import.meta.env.VITE_LULU_CLIENT_SECRET || 'demo_client_secret';
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

class LuluAPI {
  private accessToken: string | null = null;

  async authenticate(): Promise<string> {
    // In development mode, return a mock token
    if (DEV_MODE) {
      console.log('Using mock authentication (DEV_MODE=true)');
      this.accessToken = 'mock_access_token_' + Date.now();
      localStorage.setItem('lulu_access_token', this.accessToken);
      return this.accessToken;
    }

    try {
      const response = await fetch(`${LULU_API_BASE}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'print-fulfillment-api',
        }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Store token securely
      localStorage.setItem('lulu_access_token', this.accessToken);
      
      return this.accessToken;
    } catch (error) {
      console.error('Lulu authentication error:', error);
      throw error;
    }
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('lulu_access_token');
      if (!this.accessToken) {
        await this.authenticate();
      }
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async calculateCost(podPackageId: string, pageCount: number, quantity: number = 1): Promise<CostCalculation> {
    // In development mode, return mock cost calculation
    if (DEV_MODE) {
      console.log('Using mock cost calculation (DEV_MODE=true)');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const basePrice = pageCount * 0.012 + 3.50; // Rough estimation
      const unitPrice = basePrice;
      const subtotal = unitPrice * quantity;
      const taxes = subtotal * 0.08;
      const fulfillmentFee = 1.50;
      const shippingCost = quantity === 1 ? 3.99 : 5.99;
      const total = subtotal + taxes + fulfillmentFee + shippingCost;

      return {
        unitPrice,
        discounts: 0,
        taxes,
        fulfillmentFee,
        shippingCost,
        subtotal,
        total,
        quantity,
      };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${LULU_API_BASE}/print-job-cost-calculations/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          line_items: [{
            pod_package_id: podPackageId,
            quantity,
          }],
          shipping_address: {
            country_code: 'US', // Default, can be customized
          },
          shipping_level: 'GROUND',
        }),
      });

      if (!response.ok) {
        throw new Error('Cost calculation failed');
      }

      const data = await response.json();
      return {
        unitPrice: data.line_items[0].unit_cost,
        discounts: data.line_items[0].discount_amount || 0,
        taxes: data.taxes || 0,
        fulfillmentFee: data.fulfillment_cost || 0,
        shippingCost: data.shipping_cost || 0,
        subtotal: data.subtotal,
        total: data.total_cost,
        quantity,
      };
    } catch (error) {
      console.error('Cost calculation error:', error);
      throw error;
    }
  }

  async validateInterior(fileUrl: string): Promise<{ status: string; errors?: string[] }> {
    // In development mode, return mock validation
    if (DEV_MODE) {
      console.log('Using mock interior validation (DEV_MODE=true)');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate validation delay
      
      // Randomly simulate success or minor warnings
      const success = Math.random() > 0.2; // 80% success rate
      
      return {
        status: success ? 'NORMALIZED' : 'WARNING',
        errors: success ? undefined : ['Minor margin adjustment recommended'],
      };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${LULU_API_BASE}/print-job-file-validations/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          file_url: fileUrl,
          file_type: 'interior',
        }),
      });

      if (!response.ok) {
        throw new Error('Interior validation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Interior validation error:', error);
      throw error;
    }
  }

  async validateCover(fileUrl: string): Promise<{ status: string; errors?: string[] }> {
    // In development mode, return mock validation
    if (DEV_MODE) {
      console.log('Using mock cover validation (DEV_MODE=true)');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate validation delay
      
      return {
        status: 'NORMALIZED',
        errors: undefined,
      };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${LULU_API_BASE}/print-job-file-validations/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          file_url: fileUrl,
          file_type: 'cover',
        }),
      });

      if (!response.ok) {
        throw new Error('Cover validation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Cover validation error:', error);
      throw error;
    }
  }

  async createPrintJob(
    interiorFileUrl: string,
    coverFileUrl: string,
    podPackageId: string,
    contactEmail: string,
    externalId: string,
    quantity: number = 1
  ): Promise<PrintJob> {
    // In development mode, return mock print job
    if (DEV_MODE) {
      console.log('Using mock print job creation (DEV_MODE=true)');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate submission delay
      
      const mockJobId = 'PJ_' + Date.now().toString(36).toUpperCase();
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
      
      return {
        id: mockJobId,
        status: 'created',
        trackingUrl: `https://track.lulu.com/${mockJobId}`,
        estimatedDelivery: estimatedDelivery.toISOString(),
        createdAt: new Date().toISOString(),
      };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${LULU_API_BASE}/print-jobs/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contact_email: contactEmail,
          external_id: externalId,
          line_items: [{
            pod_package_id: podPackageId,
            quantity,
            interior_file_url: interiorFileUrl,
            cover_file_url: coverFileUrl,
          }],
          shipping_address: {
            name: 'Default User',
            street1: '123 Main St',
            city: 'Anytown',
            state_code: 'CA',
            postcode: '12345',
            country_code: 'US',
          },
          shipping_level: 'GROUND',
        }),
      });

      if (!response.ok) {
        throw new Error('Print job creation failed');
      }

      const data = await response.json();
      return {
        id: data.id,
        status: data.status,
        trackingUrl: data.tracking_url,
        estimatedDelivery: data.estimated_delivery,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Print job creation error:', error);
      throw error;
    }
  }

  async getPrintJobStatus(jobId: string): Promise<PrintJob> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${LULU_API_BASE}/print-jobs/${jobId}/`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to get print job status');
      }

      const data = await response.json();
      return {
        id: data.id,
        status: data.status,
        trackingUrl: data.tracking_url,
        estimatedDelivery: data.estimated_delivery,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Print job status error:', error);
      throw error;
    }
  }
}

export const luluAPI = new LuluAPI();

export const BOOK_TEMPLATES: BookTemplate[] = [
  {
    id: 'pocket',
    name: 'Pocket Book',
    description: '4.25" x 6.87" - Perfect for novels and poetry',
    dimensions: { width: 4.25, height: 6.87 },
    margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5, gutter: 0.25 },
    bleed: 0.125,
    podPackageId: 'pocket-paperback-60-white',
  },
  {
    id: 'a5',
    name: 'A5 Standard',
    description: '5.83" x 8.27" - European standard size',
    dimensions: { width: 5.83, height: 8.27 },
    margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75, gutter: 0.375 },
    bleed: 0.125,
    podPackageId: 'a5-paperback-60-white',
  },
  {
    id: 'us-trade',
    name: 'US Trade',
    description: '6" x 9" - Most popular book size',
    dimensions: { width: 6, height: 9 },
    margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75, gutter: 0.375 },
    bleed: 0.125,
    podPackageId: 'us-trade-paperback-60-white',
  },
  {
    id: 'business',
    name: 'Business',
    description: '7" x 10" - Great for business books',
    dimensions: { width: 7, height: 10 },
    margins: { top: 1, bottom: 1, left: 1, right: 1, gutter: 0.5 },
    bleed: 0.125,
    podPackageId: 'business-paperback-60-white',
  },
  {
    id: 'novel',
    name: 'Novel',
    description: '5.5" x 8.5" - Classic novel format',
    dimensions: { width: 5.5, height: 8.5 },
    margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75, gutter: 0.375 },
    bleed: 0.125,
    podPackageId: 'novel-paperback-60-white',
  },
];