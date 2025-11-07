/**
 * Sync service for managing billing synchronization between Crayon Cloud-IQ and HostBill
 */

import { CrayonCloudIQClient } from './api/crayon.js';
import { HostBillAPIClient } from './api/hostbill.js';
import { CloudIQDB } from './db/sqlite.js';
import { syncLogger } from './logger.js';

export class CloudIQSyncService {
  constructor(config) {
    this.config = config;
    this.crayonClient = new CrayonCloudIQClient(config.crayonConfig);
    this.hostbillClient = new HostBillAPIClient(config.hostbillConfig);
    this.db = new CloudIQDB(config.dbPath);
  }

  /**
   * Start periodic sync process
   */
  startPeriodicSync() {
    const intervalMinutes = this.config.syncIntervalMinutes || 60; // Default 1 hour

    syncLogger.logSyncStart('periodic_setup');

    this.syncInterval = setInterval(
      async() => {
        try {
          await this.performFullSync();
        } catch (error) {
          syncLogger.logSyncError('periodic', error);
        }
      },
      intervalMinutes * 60 * 1000
    );

    // Perform initial sync
    this.performFullSync().catch(error => syncLogger.logSyncError('initial', error));
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      syncLogger.logSyncComplete('periodic_stop', { message: 'Periodic sync stopped' });
    }
  }

  /**
   * Perform full synchronization
   */
  async performFullSync() {
    const startTime = Date.now();
    syncLogger.logSyncStart('full_sync');

    const result = {
      success: true,
      message: '',
      syncedCount: 0,
      errorCount: 0,
      errors: []
    };

    try {
      // Test connections first
      const crayonConnected = await this.testCrayonConnection();
      const hostbillConnected = await this.hostbillClient.testConnection();

      if (!crayonConnected) {
        throw new Error('Cannot connect to Crayon API');
      }

      if (!hostbillConnected) {
        throw new Error('Cannot connect to HostBill API');
      }

      // Sync active subscriptions
      await this.syncActiveSubscriptions(result);

      // Sync usage data
      await this.syncUsageData(result);

      // Sync pending orders
      await this.syncPendingOrders(result);

      // Process renewals
      await this.processUpcomingRenewals(result);

      result.message = `Sync completed: ${result.syncedCount} items synced, ${result.errorCount} errors`;
      result.duration = Date.now() - startTime;

      syncLogger.logSyncComplete('full_sync', result);
    } catch (error) {
      result.success = false;
      result.message = `Sync failed: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(result.message);
      result.duration = Date.now() - startTime;

      syncLogger.logSyncError('full_sync', error);
    }

    return result;
  }

  /**
   * Test Crayon API connection
   */
  async testCrayonConnection() {
    try {
      await this.crayonClient.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync active subscriptions from Crayon to HostBill
   */
  async syncActiveSubscriptions(result) {
    try {
      const subscriptions = await this.crayonClient.getActiveSubscriptions();
      console.log(`Found ${subscriptions.length} active subscriptions in Crayon`);

      for (const subscription of subscriptions) {
        try {
          // Check if product exists in HostBill
          const products = await this.hostbillClient.getProducts();
          let hostbillProduct = products.find(
            p =>
              p.name.toLowerCase().includes(subscription.productName.toLowerCase()) ||
              p.name.includes(subscription.subscriptionId)
          );

          // Create product if it doesn't exist
          if (!hostbillProduct) {
            const productId = await this.hostbillClient.createProduct({
              name: `${subscription.productName} (${subscription.subscriptionId})`,
              price: subscription.unitPrice,
              billingCycle: subscription.billingPeriod,
              description: `Cloud-IQ managed ${subscription.productName}`,
              category: 'cloud-services'
            });

            hostbillProduct = {
              id: productId,
              name: `${subscription.productName} (${subscription.subscriptionId})`,
              price: subscription.unitPrice,
              billingCycle: subscription.billingPeriod,
              status: 'active',
              category: 'cloud-services'
            };
          }

          // Update sync record
          this.db.upsertSyncRecord({
            hostbill_service_id: hostbillProduct.id,
            crayon_subscription_id: subscription.subscriptionId,
            product_name: subscription.productName,
            quantity: subscription.quantity,
            unit_price: subscription.unitPrice,
            last_sync: new Date().toISOString(),
            sync_status: 'synced'
          });

          result.syncedCount++;
        } catch (error) {
          result.errorCount++;
          const errorMsg = `Failed to sync subscription ${subscription.subscriptionId}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);

          // Record sync error
          this.db.upsertSyncRecord({
            hostbill_service_id: '',
            crayon_subscription_id: subscription.subscriptionId,
            product_name: subscription.productName,
            quantity: subscription.quantity,
            unit_price: subscription.unitPrice,
            last_sync: new Date().toISOString(),
            sync_status: 'error',
            error_message: errorMsg
          });
        }
      }
    } catch (error) {
      result.errorCount++;
      result.errors.push(`Failed to sync subscriptions: ${error}`);
    }
  }

  /**
   * Sync usage data and create invoices in HostBill
   */
  async syncUsageData(result) {
    try {
      const syncRecords = this.db.getSyncRecords('synced');
      console.log(`Processing usage data for ${syncRecords.length} synced subscriptions`);

      for (const syncRecord of syncRecords) {
        try {
          // Get usage data from Crayon
          const usageData = await this.crayonClient.getSubscriptionUsage(
            syncRecord.crayon_subscription_id,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
            new Date().toISOString().split('T')[0] // Today
          );

          if (usageData && usageData.usage) {
            // Store usage records
            for (const usage of usageData.usage) {
              this.db.addUsageRecord({
                subscription_id: syncRecord.crayon_subscription_id,
                usage_date: usage.date,
                quantity_used: usage.quantity,
                cost: usage.cost,
                billing_period: usage.period || 'monthly',
                synced_to_hostbill: false
              });
            }

            // Get unsynced usage records for this subscription
            const unsyncedUsage = this.db.getUsageRecords(syncRecord.crayon_subscription_id, true);

            if (unsyncedUsage.length > 0) {
              // Calculate total cost
              const totalCost = unsyncedUsage.reduce((sum, usage) => sum + usage.cost, 0);

              if (totalCost > 0) {
                // Find client for this service
                const services = await this.hostbillClient.getClientServices(''); // This needs proper client lookup
                const service = services.find(s => s.id === syncRecord.hostbill_service_id);

                if (service) {
                  // Create invoice in HostBill
                  const invoiceId = await this.hostbillClient.createInvoice({
                    clientId: service.clientId,
                    items: [
                      {
                        description: `${syncRecord.product_name} usage charges`,
                        amount: totalCost,
                        quantity: 1
                      }
                    ]
                  });

                  // Mark usage records as synced
                  this.db.markUsageSynced(unsyncedUsage.map(u => u.id));

                  result.syncedCount++;
                  console.log(`Created invoice ${invoiceId} for usage charges: $${totalCost}`);
                }
              }
            }
          }
        } catch (error) {
          result.errorCount++;
          const errorMsg = `Failed to sync usage for ${syncRecord.crayon_subscription_id}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      result.errorCount++;
      result.errors.push(`Failed to sync usage data: ${error}`);
    }
  }

  /**
   * Sync pending orders between systems
   */
  async syncPendingOrders(result) {
    try {
      const pendingOrders = this.db.getOrderRecords('pending');
      console.log(`Processing ${pendingOrders.length} pending orders`);

      for (const order of pendingOrders) {
        try {
          const orderData = JSON.parse(order.order_data);

          // Create order in HostBill if not already created
          if (!order.hostbill_order_id) {
            const hostbillOrderId = await this.hostbillClient.createServiceOrder({
              clientId: order.customer_id,
              productId: orderData.productId,
              billingCycle: orderData.billingCycle || 'monthly',
              quantity: orderData.quantity || 1,
              customFields: orderData.customFields || {}
            });

            this.db.updateOrderStatus(order.crayon_order_id, 'approved', hostbillOrderId);

            // Update order status in Crayon
            await this.crayonClient.updateOrderStatus(order.crayon_order_id, 'approved');

            result.syncedCount++;
          }
        } catch (error) {
          result.errorCount++;
          const errorMsg = `Failed to sync order ${order.crayon_order_id}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);

          this.db.updateOrderStatus(order.crayon_order_id, 'rejected');
        }
      }
    } catch (error) {
      result.errorCount++;
      result.errors.push(`Failed to sync orders: ${error}`);
    }
  }

  /**
   * Process upcoming renewals
   */
  async processUpcomingRenewals(result) {
    try {
      const upcomingRenewals = await this.crayonClient.getUpcomingRenewals(30);
      console.log(`Processing ${upcomingRenewals.length} upcoming renewals`);

      for (const renewal of upcomingRenewals) {
        try {
          // Find corresponding HostBill service
          const syncRecord = this.db
            .getSyncRecords()
            .find(r => r.crayon_subscription_id === renewal.subscriptionId);

          if (syncRecord) {
            // Update service in HostBill with renewal information
            await this.hostbillClient.updateServiceStatus(syncRecord.hostbill_service_id, 'active');

            result.syncedCount++;
          }
        } catch (error) {
          result.errorCount++;
          result.errors.push(`Failed to process renewal ${renewal.subscriptionId}: ${error}`);
        }
      }
    } catch (error) {
      result.errorCount++;
      result.errors.push(`Failed to process renewals: ${error}`);
    }
  }

  /**
   * Create new order and sync to both systems
   */
  async createOrder(orderData) {
    try {
      // Create order in Crayon
      const crayonOrder = await this.crayonClient.createOrder(orderData.customerId, [
        { productId: orderData.productId, quantity: orderData.quantity }
      ]);

      // Store order record
      this.db.createOrderRecord({
        crayon_order_id: crayonOrder.orderId,
        customer_id: orderData.customerId,
        status: 'pending',
        total_amount: crayonOrder.subscriptions.reduce(
          (sum, sub) => sum + sub.quantity * sub.unitPrice,
          0
        ),
        order_data: JSON.stringify(orderData)
      });

      return {
        crayonOrderId: crayonOrder.orderId
      };
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    const dbStats = this.db.getStats();
    const syncRecords = this.db.getSyncRecords();

    const statusCounts = syncRecords.reduce((counts, record) => {
      counts[record.sync_status] = (counts[record.sync_status] || 0) + 1;
      return counts;
    }, {});

    return {
      ...dbStats,
      syncStatusCounts: statusCounts,
      lastSync: syncRecords[0]?.last_sync || 'Never'
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopPeriodicSync();
    this.db.close();
  }
}
