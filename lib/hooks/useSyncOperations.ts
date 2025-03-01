import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { shopifyService, SyncState } from '@/lib/services/shopify';

/**
 * Custom hook for product sync operations
 * Provides state and mutation functions for syncing products
 */
export function useProductSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: 'Not started',
    count: 0,
  });

  const syncProductsMutation = useMutation({
    mutationFn: shopifyService.syncProducts,
    onMutate: () => {
      setSyncState({
        status: 'loading',
        message: 'Syncing products...',
        count: 0,
      });
    },
    onSuccess: (data) => {
      setSyncState({
        status: data.success ? 'success' : 'error',
        message: data.message,
        count: data.count,
        error: data.error,
      });
    },
    onError: (error) => {
      setSyncState({
        status: 'error',
        message: 'Failed to sync products',
        count: 0,
        error: (error as Error).message,
      });
    },
  });

  return {
    syncState,
    syncProducts: syncProductsMutation.mutate,
    isLoading: syncProductsMutation.isPending,
  };
}

/**
 * Custom hook for order sync operations
 * Provides state and mutation functions for syncing orders
 */
export function useOrderSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: 'Not started',
    count: 0,
  });

  const syncOrdersMutation = useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) => 
      shopifyService.syncOrders(startDate, endDate),
    onMutate: () => {
      setSyncState({
        status: 'loading',
        message: 'Syncing orders...',
        count: 0,
      });
    },
    onSuccess: (data) => {
      setSyncState({
        status: data.success ? 'success' : 'error',
        message: data.message,
        count: data.count,
        error: data.error,
      });
    },
    onError: (error) => {
      setSyncState({
        status: 'error',
        message: 'Failed to sync orders',
        count: 0,
        error: (error as Error).message,
      });
    },
  });

  return {
    syncState,
    syncOrders: syncOrdersMutation.mutate,
    isLoading: syncOrdersMutation.isPending,
  };
} 