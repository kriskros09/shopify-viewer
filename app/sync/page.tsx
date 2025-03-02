'use client';

import { useState } from 'react';
import { format, sub } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { renderStatusIcon } from '@/lib/mock/uiHelpers';
import { useProductSync, useOrderSync } from '@/lib/hooks/useSyncOperations';

export default function SyncPage() {
  // Default to last 90 days for order sync
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [startDate, setStartDate] = useState(
    format(sub(new Date(), { days: 90 }), 'yyyy-MM-dd')
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [endDate, setEndDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  // Use our custom hooks for sync operations
  const { syncState: productSyncState, syncProducts, isLoading: productsLoading } = useProductSync();
  const { syncState: orderSyncState, syncOrders, isLoading: ordersLoading } = useOrderSync();
  
  const syncAll = async () => {
    syncProducts();
    syncOrders({ startDate, endDate });
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sync Data</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sync Options</h2>
        
        <div className="space-y-6">
          {/* Products Sync Section */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-medium text-gray-900">Products</h3>
                <p className="text-sm text-gray-500">Sync all products from your Shopify store</p>
              </div>
              
              <button
                onClick={() => syncProducts()}
                // disabled={productsLoading}
                disabled={true}
                className={`px-4 py-2 text-white rounded-lg ${
                  productsLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } transition-colors`}
              >
                {productsLoading ? (
                  <span className="flex items-center">
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Syncing...
                  </span>
                ) : (
                  'Sync Products'
                )}
              </button>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              {renderStatusIcon(productSyncState.status)}
              <span className={`font-medium ${
                productSyncState.status === 'error' ? 'text-red-600' : 
                productSyncState.status === 'success' ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                {productSyncState.message}
              </span>
            </div>
            
            {productSyncState.status === 'error' && (
              <p className="mt-2 text-sm text-red-600">{productSyncState.error}</p>
            )}
          </div>
          
          {/* Orders Sync Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-medium text-gray-900">Orders</h3>
                <p className="text-sm text-gray-500">Sync orders from your Shopify store for a specific date range</p>
              </div>
              
              <button
                onClick={() => syncOrders({ startDate, endDate })}
                disabled={ordersLoading}
                // disabled={true}
                className={`px-4 py-2 text-white rounded-lg ${
                  ordersLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } transition-colors`}
              >
                {ordersLoading ? (
                  <span className="flex items-center">
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Syncing...
                  </span>
                ) : (
                  'Sync Orders'
                )}
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-sm">
                {renderStatusIcon(orderSyncState.status)}
                <span className={`font-medium ${
                  orderSyncState.status === 'error' ? 'text-red-600' : 
                  orderSyncState.status === 'success' ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {orderSyncState.message}
                </span>
              </div>
              
              {orderSyncState.status === 'error' && (
                <p className="mt-2 text-sm text-red-600">{orderSyncState.error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Sync All Button */}
      <div className="flex justify-center">
        <button
          onClick={syncAll}
          // disabled={productsLoading || ordersLoading}
          disabled={true}
          className={`px-6 py-3 text-white rounded-lg ${
            productsLoading || ordersLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors text-lg font-medium`}
        >
          {productsLoading || ordersLoading ? (
            <span className="flex items-center">
              <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Syncing...
            </span>
          ) : (
            'Sync All Data'
          )}
        </button>
      </div>
    </div>
  );
} 