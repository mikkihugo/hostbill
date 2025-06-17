/**
 * Crayon Cloud-IQ API Client
 * Handles CSP billing for Office 365, Teams, and other Microsoft services
 * API Documentation: https://apidocs.crayon.com/
 */

export interface CrayonConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  apiUrl?: string;
}

export interface SubscriptionUsage {
  subscriptionId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  billingPeriod: string;
  lastUpdated: string;
}

export interface CSPOrder {
  orderId: string;
  customerId: string;
  subscriptions: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'active';
  createdAt: string;
}

export interface BillingSync {
  hostbillInvoiceId: string;
  crayonSubscriptionId: string;
  amount: number;
  status: 'synced' | 'pending' | 'error';
  lastSync: string;
}

export class CrayonCloudIQClient {
  private config: CrayonConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: CrayonConfig) {
    this.config = {
      ...config,
      apiUrl: config.apiUrl || 'https://api.crayon.com/api/v1',
    };
  }

  /**
   * Authenticate with Crayon API using OAuth2
   */
  async authenticate(): Promise<void> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry) {
      return; // Token still valid
    }

    const tokenUrl = `${this.config.apiUrl}/auth/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: 'https://api.crayon.com/.default',
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = now + (data.expires_in * 1000) - 300000; // 5 min buffer
    } catch (error) {
      throw new Error(`Failed to authenticate with Crayon API: ${error}`);
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.authenticate();

    const url = `${this.config.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} - ${await response.text()}`);
    }

    return await response.json();
  }

  /**
   * Get all active subscriptions for usage billing
   */
  async getActiveSubscriptions(): Promise<SubscriptionUsage[]> {
    const data = await this.makeRequest('/subscriptions?status=active');
    
    return data.items?.map((sub: any) => ({
      subscriptionId: sub.id,
      productName: sub.productName,
      quantity: sub.quantity,
      unitPrice: sub.unitPrice,
      totalCost: sub.quantity * sub.unitPrice,
      billingPeriod: sub.billingCycle,
      lastUpdated: sub.lastModified,
    })) || [];
  }

  /**
   * Get subscription usage data for billing
   */
  async getSubscriptionUsage(subscriptionId: string, fromDate?: string, toDate?: string): Promise<any> {
    let endpoint = `/subscriptions/${subscriptionId}/usage`;
    
    const params = new URLSearchParams();
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return await this.makeRequest(endpoint);
  }

  /**
   * Create a new CSP order
   */
  async createOrder(customerId: string, items: Array<{productId: string, quantity: number}>): Promise<CSPOrder> {
    const orderData = {
      customerId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    const response = await this.makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    return {
      orderId: response.id,
      customerId: response.customerId,
      subscriptions: response.items || [],
      status: response.status,
      createdAt: response.createdAt,
    };
  }

  /**
   * Update order status (approve/reject)
   */
  async updateOrderStatus(orderId: string, status: 'approved' | 'rejected'): Promise<void> {
    await this.makeRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Get billing data for HostBill sync
   */
  async getBillingData(fromDate: string, toDate: string): Promise<BillingSync[]> {
    const endpoint = `/billing/charges?from=${fromDate}&to=${toDate}`;
    const data = await this.makeRequest(endpoint);
    
    return data.items?.map((charge: any) => ({
      hostbillInvoiceId: '', // To be mapped in sync process
      crayonSubscriptionId: charge.subscriptionId,
      amount: charge.amount,
      status: 'pending',
      lastSync: new Date().toISOString(),
    })) || [];
  }

  /**
   * Get products catalog for Office 365, Teams, etc.
   */
  async getProductsCatalog(filter?: string): Promise<any[]> {
    let endpoint = '/products';
    if (filter) {
      endpoint += `?filter=${encodeURIComponent(filter)}`;
    }

    const data = await this.makeRequest(endpoint);
    return data.items || [];
  }

  /**
   * Get customer information
   */
  async getCustomer(customerId: string): Promise<any> {
    return await this.makeRequest(`/customers/${customerId}`);
  }

  /**
   * Monitor renewals for sync tracking
   */
  async getUpcomingRenewals(daysAhead: number = 30): Promise<any[]> {
    const endpoint = `/subscriptions/renewals?days=${daysAhead}`;
    const data = await this.makeRequest(endpoint);
    return data.items || [];
  }
}