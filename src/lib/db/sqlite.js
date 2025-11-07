/**
 * File-based SQL database using simple JSON storage for Cloud-IQ data
 * This is a simplified implementation that doesn't require SQLite
 * For production, replace with proper SQLite or PostgreSQL
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class CloudIQDB {
  dbPath;
  data; // Using definite assignment assertion

  constructor(dbPath = './data/cloudiq.json') {
    this.dbPath = dbPath;
    this.loadDatabase();
  }

  /**
   * Load database from JSON file
   */
  loadDatabase() {
    try {
      // Ensure directory exists
      const dir = dirname(this.dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      if (existsSync(this.dbPath)) {
        const jsonData = readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(jsonData);
      } else {
        throw new Error('File does not exist');
      }
    } catch {
      // Initialize empty database if file doesn't exist
      this.data = {
        syncRecords: [],
        usageRecords: [],
        orderRecords: [],
        lastId: 0
      };
      this.saveDatabase();
    }
  }

  /**
   * Save database to JSON file
   */
  saveDatabase() {
    try {
      // Ensure directory exists
      const dir = dirname(this.dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  /**
   * Get next ID
   */
  getNextId() {
    this.data.lastId++;
    return this.data.lastId;
  }

  /**
   * Create or update sync record
   */
  upsertSyncRecord(record) {
    const now = new Date().toISOString();

    // Find existing record
    const existingIndex = this.data.syncRecords.findIndex(
      existingRecord =>
        existingRecord.hostbill_service_id === record.hostbill_service_id &&
        existingRecord.crayon_subscription_id === record.crayon_subscription_id
    );

    if (existingIndex >= 0) {
      // Update existing
      const existing = this.data.syncRecords[existingIndex];
      this.data.syncRecords[existingIndex] = {
        ...existing,
        ...record,
        updated_at: now
      };
      this.saveDatabase();
      return existing.id;
    } else {
      // Create new
      const newRecord = {
        id: this.getNextId(),
        ...record,
        created_at: now,
        updated_at: now
      };
      this.data.syncRecords.push(newRecord);
      this.saveDatabase();
      return newRecord.id;
    }
  }

  /**
   * Get sync records by status
   */
  getSyncRecords(status) {
    let records = this.data.syncRecords;

    if (status) {
      records = records.filter(syncRecord => syncRecord.sync_status === status);
    }

    return records.sort(
      (recordA, recordB) =>
        new Date(recordB.updated_at).getTime() - new Date(recordA.updated_at).getTime()
    );
  }

  /**
   * Add usage record
   */
  addUsageRecord(record) {
    const now = new Date().toISOString();

    // Check for existing record (same subscription, date, period)
    const existingIndex = this.data.usageRecords.findIndex(
      usageRecord =>
        usageRecord.subscription_id === record.subscription_id &&
        usageRecord.usage_date === record.usage_date &&
        usageRecord.billing_period === record.billing_period
    );

    if (existingIndex >= 0) {
      // Update existing
      this.data.usageRecords[existingIndex] = {
        ...this.data.usageRecords[existingIndex],
        ...record
      };
      this.saveDatabase();
      return this.data.usageRecords[existingIndex].id;
    } else {
      // Create new
      const newRecord = {
        id: this.getNextId(),
        ...record,
        created_at: now
      };
      this.data.usageRecords.push(newRecord);
      this.saveDatabase();
      return newRecord.id;
    }
  }

  /**
   * Get usage records for billing
   */
  getUsageRecords(subscriptionId, syncedOnly = false) {
    let records = this.data.usageRecords;

    if (subscriptionId) {
      records = records.filter(usageRecord => usageRecord.subscription_id === subscriptionId);
    }

    if (syncedOnly) {
      records = records.filter(usageRecord => !usageRecord.synced_to_hostbill);
    }

    return records.sort(
      (recordA, recordB) =>
        new Date(recordB.usage_date).getTime() - new Date(recordA.usage_date).getTime()
    );
  }

  /**
   * Mark usage records as synced
   */
  markUsageSynced(usageIds) {
    for (const id of usageIds) {
      const index = this.data.usageRecords.findIndex(usageRecord => usageRecord.id === id);
      if (index >= 0) {
        this.data.usageRecords[index].synced_to_hostbill = true;
      }
    }
    this.saveDatabase();
  }

  /**
   * Create order record
   */
  createOrderRecord(record) {
    const now = new Date().toISOString();

    const newRecord = {
      id: this.getNextId(),
      ...record,
      created_at: now,
      updated_at: now
    };

    this.data.orderRecords.push(newRecord);
    this.saveDatabase();
    return newRecord.id;
  }

  /**
   * Update order status
   */
  updateOrderStatus(crayonOrderId, status, hostbillOrderId) {
    const index = this.data.orderRecords.findIndex(
      orderRecord => orderRecord.crayon_order_id === crayonOrderId
    );
    if (index >= 0) {
      this.data.orderRecords[index].status = status;
      if (hostbillOrderId) {
        this.data.orderRecords[index].hostbill_order_id = hostbillOrderId;
      }
      this.data.orderRecords[index].updated_at = new Date().toISOString();
      this.saveDatabase();
    }
  }

  /**
   * Get order records
   */
  getOrderRecords(status) {
    let records = this.data.orderRecords;

    if (status) {
      records = records.filter(orderRecord => orderRecord.status === status);
    }

    return records.sort(
      (recordA, recordB) =>
        new Date(recordB.created_at).getTime() - new Date(recordA.created_at).getTime()
    );
  }

  /**
   * Close database connection (no-op for JSON)
   */
  close() {
    // No-op for JSON file storage
  }

  /**
   * Get database statistics
   */
  getStats() {
    const syncStatusCounts = this.data.syncRecords.reduce((counts, record) => {
      counts[record.sync_status] = (counts[record.sync_status] || 0) + 1;
      return counts;
    }, {});

    return {
      syncRecords: this.data.syncRecords.length,
      usageRecords: this.data.usageRecords.length,
      orderRecords: this.data.orderRecords.length,
      pendingSyncs: syncStatusCounts.pending || 0,
      syncStatusCounts
    };
  }
}
