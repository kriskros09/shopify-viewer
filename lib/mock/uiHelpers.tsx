/**
 * UI helper functions and constants used across the application
 * 
 * Used in:
 * - app/orders/page.tsx - For rendering status badges
 * - app/products/page.tsx - For rendering status badges
 * - app/sync/page.tsx - For rendering sync status icons
 */

import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Define the sync status type
export type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Get CSS classes for order status badges based on status
 * @param status Order status string (e.g., 'paid', 'pending', 'refunded')
 * @returns CSS class string for appropriate badge styling
 */
export function getStatusBadgeClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'refunded':
      return 'bg-red-100 text-red-800';
    case 'fulfilled':
      return 'bg-green-100 text-green-800';
    case 'unfulfilled':
      return 'bg-yellow-100 text-yellow-800';
    case 'partial':
      return 'bg-blue-100 text-blue-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'archived':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get shortened Shopify ID by extracting the last part after '/'
 * @param shopifyId Full Shopify ID (e.g., 'gid://shopify/Order/1234567890')
 * @returns Shortened ID (e.g., '1234567890')
 */
export function getShortShopifyId(shopifyId: string): string {
  return shopifyId.split('/').pop() || shopifyId;
}

/**
 * Renders an appropriate icon based on the sync status
 * @param status The current sync status ('idle', 'loading', 'success', or 'error')
 * @returns A React element with the appropriate icon
 */
export function renderStatusIcon(status: SyncStatus): React.ReactNode {
  switch (status) {
    case 'loading':
      return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
} 