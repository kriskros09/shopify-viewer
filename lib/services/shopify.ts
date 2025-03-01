/**
 * Shopify API Service
 * 
 * Centralized service for all Shopify API operations.
 * Provides typed methods with consistent error handling and response formatting.
 */

import { SyncStatus } from '@/lib/mock/uiHelpers';
import { syncProductsAction, syncOrdersAction } from '@/app/api/actions';

// Types for API responses
export interface SyncResponse {
  success: boolean;
  message: string;
  count: number;
  error?: string;
}

// Types for sync state
export interface SyncState {
  status: SyncStatus;
  message: string;
  count: number;
  error?: string;
}

/**
 * Shopify API service with methods for all Shopify-related operations
 * Uses server actions for secure API operations
 */
export const shopifyService = {
  /**
   * Sync all products from Shopify
   * @returns Promise with sync response
   */
  async syncProducts(): Promise<SyncResponse> {
    try {
      // Use server action which now points to the correct endpoint
      return await syncProductsAction();
    } catch (error) {
      console.error('Error in syncProducts:', error);
      return {
        success: false,
        message: 'Failed to sync products',
        count: 0,
        error: (error as Error).message
      };
    }
  },

  /**
   * Sync orders from Shopify for a specific date range
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @returns Promise with sync response
   */
  async syncOrders(startDate: string, endDate: string): Promise<SyncResponse> {
    try {
      // Use server action which now points to the correct endpoint
      return await syncOrdersAction(startDate, endDate);
    } catch (error) {
      console.error('Error in syncOrders:', error);
      return {
        success: false,
        message: 'Failed to sync orders',
        count: 0,
        error: (error as Error).message
      };
    }
  }
}; 