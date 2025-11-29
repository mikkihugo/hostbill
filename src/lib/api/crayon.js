/**
 * Crayon Cloud-IQ API Client
 * Handles CSP billing for Office 365, Teams, and other Microsoft services
 * API Documentation: https://apidocs.crayon.com/
 */

/* eslint-disable no-console, no-magic-numbers */

export class CrayonCloudIQClient {
  constructor(config) {
    this.config = {
      ...config,
      apiUrl: config.apiUrl || 'https://api.crayon.com/api/v1'
    };
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  /**
   * Authenticate with Crayon API using OAuth2 or dynamic user authentication
   */
  async authenticate() {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry) {
      return; // Token still valid
    }

    const tokenUrl = `${this.config.apiUrl}/auth/token`;

    // Use dynamic authentication if enabled
    if (this.config.dynamicAuth && this.config.username) {
      const body = new URLSearchParams({
        grant_type: 'password',
        username: this.config.username,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'https://api.crayon.com/.default'
      });

      console.log(`🔐 Using dynamic authentication for user: ${this.config.username}`);

      try {
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });

        if (!response.ok) {
          throw new Error(`Dynamic authentication failed: ${response.status}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = now + data.expires_in * 1000;

        console.log('✅ Dynamic authentication successful');
        return;
      } catch {
        console.error('❌ Dynamic authentication failed, falling back to client credentials');
      }
    }

    // Fallback to client credentials authentication
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: 'https://api.crayon.com/.default'
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = now + data.expires_in * 1000 - 300000; // 5 min buffer
    } catch (error) {
      throw new Error(`Failed to authenticate with Crayon API: ${error}`);
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, options = {}) {
    await this.authenticate();

    const url = `${this.config.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} - ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Get all active subscriptions for usage billing
   */
  async getActiveSubscriptions() {
    const data = await this.makeRequest('/subscriptions?status=active');

    return (
      data.items?.map(sub => ({
        subscriptionId: sub.id,
        productName: sub.productName,
        quantity: sub.quantity,
        unitPrice: sub.unitPrice,
        totalCost: sub.quantity * sub.unitPrice,
        billingPeriod: sub.billingCycle,
        lastUpdated: sub.lastModified
      })) || []
    );
  }

  /**
   * Get subscription usage data for billing
   */
  getSubscriptionUsage(subscriptionId, fromDate, toDate) {
    let endpoint = `/subscriptions/${subscriptionId}/usage`;

    const params = new URLSearchParams();
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.makeRequest(endpoint);
  }

  /**
   * Create a new CSP order
   */
  async createOrder(customerId, items) {
    const orderData = {
      customerId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    const response = await this.makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    return {
      orderId: response.id,
      customerId: response.customerId,
      subscriptions: response.items || [],
      status: response.status,
      createdAt: response.createdAt
    };
  }

  /**
   * Update order status (approve/reject)
   */
  async updateOrderStatus(orderId, status) {
    await this.makeRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  /**
   * Get billing data for HostBill sync
   */
  async getBillingData(fromDate, toDate) {
    const endpoint = `/billing/charges?from=${fromDate}&to=${toDate}`;
    const data = await this.makeRequest(endpoint);

    return (
      data.items?.map(charge => ({
        hostbillInvoiceId: '', // To be mapped in sync process
        crayonSubscriptionId: charge.subscriptionId,
        amount: charge.amount,
        status: 'pending',
        lastSync: new Date().toISOString()
      })) || []
    );
  }

  /**
   * Get products catalog for Office 365, Teams, etc.
   */
  async getProductsCatalog(filter) {
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
  getCustomer(customerId) {
    return this.makeRequest(`/customers/${customerId}`);
  }

  /**
   * Monitor renewals for sync tracking
   */
  async getUpcomingRenewals(daysAhead = 30) {
    const endpoint = `/subscriptions/renewals?days=${daysAhead}`;
    const data = await this.makeRequest(endpoint);
    return data.items || [];
  }
}
