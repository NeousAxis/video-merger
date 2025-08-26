import axios, { AxiosResponse } from 'axios';

// Lulu API Types
interface LuluProject {
  id: string;
  name: string;
  status: string;
  created_date: string;
  line_items: LuluLineItem[];
}

interface LuluLineItem {
  external_id: string;
  printable_normalization: {
    cover: {
      source_url: string;
    };
    interior: {
      source_url: string;
    };
  };
  print_job_options: {
    color_option: string;
    paper_type: string;
    binding_type: string;
    size: string;
  };
  quantity: number;
  title: string;
  author: string;
}

interface LuluOrder {
  id: string;
  status: string;
  total_cost: number;
  shipping_address: LuluAddress;
  line_items: LuluOrderLineItem[];
}

interface LuluAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state_code: string;
  country_code: string;
  postcode: string;
  phone_number?: string;
}

interface LuluOrderLineItem {
  project_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface LuluCostCalculation {
  line_items: Array<{
    external_id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
  }>;
  shipping_cost: number;
  total_cost: number;
}

class LuluAPIService {
  private baseURL: string;
  private apiKey: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = process.env.LULU_API_BASE_URL || 'https://api.lulu.com';
    this.apiKey = process.env.LULU_API_KEY || '';
    this.clientId = process.env.LULU_CLIENT_ID || '';
    this.clientSecret = process.env.LULU_CLIENT_SECRET || '';
  }

  // Authentication
  async authenticate(): Promise<string> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/realms/glasstree/protocol/openid-connect/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Lulu authentication failed:', error);
      throw new Error('Failed to authenticate with Lulu API');
    }
  }

  // Get authenticated headers
  private async getHeaders(): Promise<Record<string, string>> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Create a new project
  async createProject(projectData: {
    name: string;
    title: string;
    author: string;
    coverUrl: string;
    interiorUrl: string;
    format: {
      width: number;
      height: number;
      paperType: string;
      bindingType: string;
    };
    pageCount: number;
  }): Promise<LuluProject> {
    try {
      const headers = await this.getHeaders();
      
      // Map our format to Lulu's format
      const luluSize = this.mapToLuluSize(projectData.format.width, projectData.format.height);
      const luluPaperType = this.mapToLuluPaperType(projectData.format.paperType);
      const luluBindingType = this.mapToLuluBindingType(projectData.format.bindingType);

      const payload = {
        name: projectData.name,
        line_items: [{
          external_id: `book_${Date.now()}`,
          printable_normalization: {
            cover: {
              source_url: projectData.coverUrl
            },
            interior: {
              source_url: projectData.interiorUrl
            }
          },
          print_job_options: {
            color_option: 'standard_color',
            paper_type: luluPaperType,
            binding_type: luluBindingType,
            size: luluSize
          },
          quantity: 1,
          title: projectData.title,
          author: projectData.author
        }]
      };

      const response: AxiosResponse<LuluProject> = await axios.post(
        `${this.baseURL}/print-jobs/`,
        payload,
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to create Lulu project:', error);
      throw new Error('Failed to create project with Lulu');
    }
  }

  // Calculate printing costs
  async calculateCosts(projectId: string, quantity: number, shippingAddress: LuluAddress): Promise<LuluCostCalculation> {
    try {
      const headers = await this.getHeaders();
      
      const payload = {
        line_items: [{
          project_id: projectId,
          quantity: quantity
        }],
        shipping_address: shippingAddress
      };

      const response: AxiosResponse<LuluCostCalculation> = await axios.post(
        `${this.baseURL}/print-job-cost-calculations/`,
        payload,
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to calculate costs:', error);
      throw new Error('Failed to calculate printing costs');
    }
  }

  // Create an order
  async createOrder(orderData: {
    projectId: string;
    quantity: number;
    shippingAddress: LuluAddress;
    contactEmail: string;
  }): Promise<LuluOrder> {
    try {
      const headers = await this.getHeaders();
      
      const payload = {
        contact_email: orderData.contactEmail,
        line_items: [{
          project_id: orderData.projectId,
          quantity: orderData.quantity
        }],
        shipping_address: orderData.shippingAddress,
        shipping_level: 'MAIL' // or 'PRIORITY', 'GROUND', 'EXPEDITED'
      };

      const response: AxiosResponse<LuluOrder> = await axios.post(
        `${this.baseURL}/print-orders/`,
        payload,
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw new Error('Failed to create order with Lulu');
    }
  }

  // Get order status
  async getOrderStatus(orderId: string): Promise<LuluOrder> {
    try {
      const headers = await this.getHeaders();
      
      const response: AxiosResponse<LuluOrder> = await axios.get(
        `${this.baseURL}/print-orders/${orderId}/`,
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get order status:', error);
      throw new Error('Failed to retrieve order status');
    }
  }

  // Helper methods to map our formats to Lulu's formats
  private mapToLuluSize(width: number, height: number): string {
    // Common book sizes mapping
    const sizeMap: Record<string, string> = {
      '5.5x8.5': 'US_TRADE',
      '6x9': 'US_TRADE',
      '5.25x8': 'DIGEST',
      '8.5x11': 'US_LETTER',
      '7x10': 'ROYAL',
      '5x8': 'A5'
    };

    const key = `${width}x${height}`;
    return sizeMap[key] || 'US_TRADE'; // Default to US Trade
  }

  private mapToLuluPaperType(paperType: string): string {
    const paperMap: Record<string, string> = {
      'Standard White': 'white',
      'Cream': 'cream',
      'Premium White': 'white_premium',
      'Recycled': 'white'
    };

    return paperMap[paperType] || 'white';
  }

  private mapToLuluBindingType(bindingType: string): string {
    const bindingMap: Record<string, string> = {
      'Perfect Bound': 'perfect_bound',
      'Saddle Stitched': 'saddle_stitched',
      'Spiral Bound': 'spiral_bound',
      'Hardcover': 'case_bound',
      'Coil Bound': 'coil_bound'
    };

    return bindingMap[bindingType] || 'perfect_bound';
  }

  // Validate shipping address
  validateShippingAddress(address: LuluAddress): boolean {
    const required = ['name', 'street1', 'city', 'state_code', 'country_code', 'postcode'];
    return required.every(field => address[field as keyof LuluAddress]);
  }

  // Format cost for display
  formatCost(cost: number): string {
    return `$${cost.toFixed(2)}`;
  }
}

// Export singleton instance
export const luluAPI = new LuluAPIService();
export default luluAPI;

// Export types for use in components
export type {
  LuluProject,
  LuluOrder,
  LuluAddress,
  LuluCostCalculation,
  LuluOrderLineItem
};
