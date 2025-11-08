/**
 * Load context for Remix server
 * Provides access to server-side utilities and middleware
 */
export function getLoadContext() {
  return {
    apiUrl: process.env.API_URL || 'http://localhost:3000/api'
  };
}
