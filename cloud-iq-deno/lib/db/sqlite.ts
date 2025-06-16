/**
 * File-based SQL database using simple JSON storage for Cloud-IQ data
 * This is a simplified implementation that doesn't require SQLite
 * For production, replace with proper SQLite or PostgreSQL
 */

export interface CloudIQDatabase {
  data: any;
}

export interface SyncRecord {
  id?: number;
  hostbill_service_id: string;
  crayon_subscription_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  last_sync: string;
  sync_status: 'pending' | 'synced' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageRecord {
  id?: number;
  subscription_id: string;
  usage_date: string;
  quantity_used: number;
  cost: number;
  billing_period: string;
  synced_to_hostbill: boolean;
  created_at: string;
}

export interface OrderRecord {
  id?: number;
  crayon_order_id: string;
  hostbill_order_id?: string;
  customer_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'active';
  total_amount: number;
  order_data: string; // JSON string
  created_at: string;
  updated_at: string;
}

interface DatabaseData {
  syncRecords: SyncRecord[];
  usageRecords: UsageRecord[];
  orderRecords: OrderRecord[];
  lastId: number;
}

export class CloudIQDB {
  private dbPath: string;
  private data!: DatabaseData; // Using definite assignment assertion

  constructor(dbPath: string = "./data/cloudiq.json") {
    this.dbPath = dbPath;
    this.loadDatabase();
  }

  /**
   * Load database from JSON file
   */
  private loadDatabase(): void {
    try {
      const jsonData = Deno.readTextFileSync(this.dbPath);
      this.data = JSON.parse(jsonData);
    } catch {
      // Initialize empty database if file doesn't exist
      this.data = {
        syncRecords: [],
        usageRecords: [],
        orderRecords: [],
        lastId: 0,
      };
      this.saveDatabase();
    }
  }

  /**
   * Save database to JSON file
   */
  private saveDatabase(): void {
    try {
      // Ensure directory exists
      const dir = this.dbPath.substring(0, this.dbPath.lastIndexOf('/'));
      if (dir) {
        Deno.mkdirSync(dir, { recursive: true });
      }
      
      Deno.writeTextFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  /**
   * Get next ID
   */
  private getNextId(): number {
    this.data.lastId++;
    return this.data.lastId;
  }

  /**
   * Create or update sync record
   */
  upsertSyncRecord(record: Omit<SyncRecord, 'id' | 'created_at' | 'updated_at'>): number {
    const now = new Date().toISOString();
    
    // Find existing record
    const existingIndex = this.data.syncRecords.findIndex(
      r => r.hostbill_service_id === record.hostbill_service_id && 
           r.crayon_subscription_id === record.crayon_subscription_id
    );

    if (existingIndex >= 0) {
      // Update existing
      const existing = this.data.syncRecords[existingIndex];
      this.data.syncRecords[existingIndex] = {
        ...existing,
        ...record,
        updated_at: now,
      };
      this.saveDatabase();
      return existing.id!;
    } else {
      // Create new
      const newRecord: SyncRecord = {
        id: this.getNextId(),
        ...record,
        created_at: now,
        updated_at: now,
      };
      this.data.syncRecords.push(newRecord);
      this.saveDatabase();
      return newRecord.id!;
    }
  }

  /**
   * Get sync records by status
   */
  getSyncRecords(status?: string): SyncRecord[] {
    let records = this.data.syncRecords;
    
    if (status) {
      records = records.filter(r => r.sync_status === status);
    }
    
    return records.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  /**
   * Add usage record
   */
  addUsageRecord(record: Omit<UsageRecord, 'id' | 'created_at'>): number {
    const now = new Date().toISOString();
    
    // Check for existing record (same subscription, date, period)
    const existingIndex = this.data.usageRecords.findIndex(
      r => r.subscription_id === record.subscription_id &&
           r.usage_date === record.usage_date &&
           r.billing_period === record.billing_period
    );

    if (existingIndex >= 0) {
      // Update existing
      this.data.usageRecords[existingIndex] = {
        ...this.data.usageRecords[existingIndex],
        ...record,
      };
      this.saveDatabase();
      return this.data.usageRecords[existingIndex].id!;
    } else {
      // Create new
      const newRecord: UsageRecord = {
        id: this.getNextId(),
        ...record,
        created_at: now,
      };
      this.data.usageRecords.push(newRecord);
      this.saveDatabase();
      return newRecord.id!;
    }
  }

  /**
   * Get usage records for billing
   */
  getUsageRecords(subscriptionId?: string, syncedOnly: boolean = false): UsageRecord[] {
    let records = this.data.usageRecords;
    
    if (subscriptionId) {
      records = records.filter(r => r.subscription_id === subscriptionId);
    }
    
    if (syncedOnly) {
      records = records.filter(r => !r.synced_to_hostbill);
    }
    
    return records.sort((a, b) => 
      new Date(b.usage_date).getTime() - new Date(a.usage_date).getTime()
    );
  }

  /**
   * Mark usage records as synced
   */
  markUsageSynced(usageIds: number[]): void {
    for (const id of usageIds) {
      const index = this.data.usageRecords.findIndex(r => r.id === id);
      if (index >= 0) {
        this.data.usageRecords[index].synced_to_hostbill = true;
      }
    }
    this.saveDatabase();
  }

  /**
   * Create order record
   */
  createOrderRecord(record: Omit<OrderRecord, 'id' | 'created_at' | 'updated_at'>): number {
    const now = new Date().toISOString();
    
    const newRecord: OrderRecord = {
      id: this.getNextId(),
      ...record,
      created_at: now,
      updated_at: now,
    };
    
    this.data.orderRecords.push(newRecord);
    this.saveDatabase();
    return newRecord.id!;
  }

  /**
   * Update order status
   */
  updateOrderStatus(crayonOrderId: string, status: string, hostbillOrderId?: string): void {
    const index = this.data.orderRecords.findIndex(r => r.crayon_order_id === crayonOrderId);
    if (index >= 0) {
      this.data.orderRecords[index].status = status as any;
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
  getOrderRecords(status?: string): OrderRecord[] {
    let records = this.data.orderRecords;
    
    if (status) {
      records = records.filter(r => r.status === status);
    }
    
    return records.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Close database connection (no-op for JSON)
   */
  close(): void {
    // No-op for JSON file storage
  }

  /**
   * Get database statistics
   */
  getStats(): Record<string, any> {
    const syncStatusCounts = this.data.syncRecords.reduce((counts, record) => {
      counts[record.sync_status] = (counts[record.sync_status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      syncRecords: this.data.syncRecords.length,
      usageRecords: this.data.usageRecords.length,
      orderRecords: this.data.orderRecords.length,
      pendingSyncs: syncStatusCounts.pending || 0,
      syncStatusCounts,
    };
  }
}