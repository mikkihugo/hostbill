/**
 * API endpoint for manual sync operations
 */

import { type Handlers } from '$fresh/server.ts';
import { CloudIQSyncService } from '../../../lib/sync.ts';

// Configuration from environment variables
const config = {
  crayonConfig: {
    clientId: Deno.env.get('CRAYON_CLIENT_ID') || '',
    clientSecret: Deno.env.get('CRAYON_CLIENT_SECRET') || '',
    tenantId: Deno.env.get('CRAYON_TENANT_ID') || ''
  },
  hostbillConfig: {
    apiUrl: Deno.env.get('HOSTBILL_URL') || '',
    apiId: Deno.env.get('HOSTBILL_API_ID') || '',
    apiKey: Deno.env.get('HOSTBILL_API_KEY') || ''
  }
};

export const handler: Handlers = {
  async POST(req, ctx) {
    try {
      const syncService = new CloudIQSyncService(config);

      console.log('Starting manual synchronization...');
      const result = await syncService.performFullSync();

      syncService.cleanup();

      return new Response(
        JSON.stringify({
          success: result.success,
          message: result.message,
          syncedCount: result.syncedCount,
          errorCount: result.errorCount,
          errors: result.errors,
          timestamp: new Date().toISOString()
        }),
        {
          status: result.success ? 200 : 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Manual sync failed:', error);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Manual sync failed due to an internal error.',
          syncedCount: 0,
          errorCount: 1,
          errors: ['An internal error occurred. Please contact support if the issue persists.'],
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  },

  async GET(req, ctx) {
    // For GET requests, redirect to sync page or return simple response
    return new Response(
      JSON.stringify({
        message: 'Use POST to trigger manual sync',
        endpoint: '/api/sync/manual',
        method: 'POST'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
