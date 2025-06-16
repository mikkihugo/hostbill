/**
 * HostBill API Client for Deno
 * Handles product/service management and billing integration
 * API Documentation: https://dev.hostbillapp.com/
 */

export interface HostBillConfig {
  apiUrl: string;
  apiId: string;
  apiKey: string;
}

export interface HostBillProduct {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  status: 'active' | 'inactive';
  category: string;
}

export interface HostBillService {
  id: string;
  clientId: string;
  productId: string;
  domain: string;
  status: 'active' | 'suspended' | 'cancelled';
  nextDueDate: string;
  recurringAmount: number;
}

export interface HostBillInvoice {
  id: string;
  clientId: string;
  total: number;
  status: 'paid' | 'unpaid' | 'cancelled';
  dateCreated: string;
  dateDue: string;
}

export class HostBillAPIClient {
  private config: HostBillConfig;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 300000; // 5 minutes

  constructor(config: HostBillConfig) {
    this.config = {
      ...config,
      apiUrl: config.apiUrl.replace(/\/$/, ''), // Remove trailing slash
    };
  }

  /**
   * Make API request to HostBill
   */
  private async makeRequest(call: string, args: Record<string, any> = {}): Promise<any> {
    const postData = new URLSearchParams({
      call,
      api_id: this.config.apiId,
      api_key: this.config.apiKey,
      ...args,
    });

    try {
      const response = await fetch(`${this.config.apiUrl}/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Cloud-IQ-Deno/1.0',
        },
        body: postData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`HostBill API Error: ${data.error}`);
      }

      return data;
    } catch (error) {
      throw new Error(`HostBill API request failed: ${error}`);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('getServerInfo');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all products for Cloud-IQ CSP services
   */
  async getProducts(): Promise<HostBillProduct[]> {
    const cacheKey = 'products';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await this.makeRequest('getProducts');
      const products = response.products?.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        billingCycle: product.cycle,
        status: product.status,
        category: product.category || 'cloud-services',
      })) || [];

      this.cache.set(cacheKey, { data: products, timestamp: Date.now() });
      return products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  /**
   * Create a new product for CSP service
   */
  async createProduct(productData: {
    name: string;
    price: number;
    billingCycle: string;
    description?: string;
    category?: string;
  }): Promise<string> {
    const response = await this.makeRequest('addProduct', {
      name: productData.name,
      price: productData.price.toString(),
      cycle: productData.billingCycle,
      description: productData.description || '',
      category: productData.category || 'cloud-services',
      type: 'service',
    });

    return response.id;
  }

  /**
   * Update product pricing
   */
  async updateProductPrice(productId: string, newPrice: number): Promise<void> {
    await this.makeRequest('updateProduct', {
      id: productId,
      price: newPrice.toString(),
    });
  }

  /**
   * Get client services
   */
  async getClientServices(clientId: string): Promise<HostBillService[]> {
    const response = await this.makeRequest('getClientServices', { client_id: clientId });
    
    return response.services?.map((service: any) => ({
      id: service.id,
      clientId: service.client_id,
      productId: service.product_id,
      domain: service.domain,
      status: service.status,
      nextDueDate: service.next_due,
      recurringAmount: parseFloat(service.recurring_amount) || 0,
    })) || [];
  }

  /**
   * Create new service order
   */
  async createServiceOrder(orderData: {
    clientId: string;
    productId: string;
    billingCycle: string;
    quantity?: number;
    customFields?: Record<string, any>;
  }): Promise<string> {
    const response = await this.makeRequest('addOrder', {
      client_id: orderData.clientId,
      product_id: orderData.productId,
      cycle: orderData.billingCycle,
      qty: orderData.quantity?.toString() || '1',
      ...orderData.customFields,
    });

    return response.order_id;
  }

  /**
   * Update service status
   */
  async updateServiceStatus(serviceId: string, status: 'active' | 'suspended' | 'cancelled'): Promise<void> {
    await this.makeRequest('changeServiceStatus', {
      service_id: serviceId,
      status,
    });
  }

  /**
   * Create invoice for billing sync
   */
  async createInvoice(invoiceData: {
    clientId: string;
    items: Array<{
      description: string;
      amount: number;
      quantity?: number;
    }>;
    dueDate?: string;
  }): Promise<string> {
    const response = await this.makeRequest('addInvoice', {
      client_id: invoiceData.clientId,
      due_date: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: JSON.stringify(invoiceData.items.map(item => ({
        description: item.description,
        amount: item.amount,
        qty: item.quantity || 1,
      }))),
    });

    return response.invoice_id;
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string): Promise<HostBillInvoice | null> {
    try {
      const response = await this.makeRequest('getInvoice', { invoice_id: invoiceId });
      
      if (response.invoice) {
        return {
          id: response.invoice.id,
          clientId: response.invoice.client_id,
          total: parseFloat(response.invoice.total) || 0,
          status: response.invoice.status,
          dateCreated: response.invoice.date_created,
          dateDue: response.invoice.date_due,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get client information
   */
  async getClient(clientId: string): Promise<any> {
    const response = await this.makeRequest('getClientDetails', { client_id: clientId });
    return response.client;
  }

  /**
   * Search for clients
   */
  async searchClients(query: string): Promise<any[]> {
    const response = await this.makeRequest('getClients', { search: query });
    return response.clients || [];
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<any> {
    return await this.makeRequest('getServerInfo');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}