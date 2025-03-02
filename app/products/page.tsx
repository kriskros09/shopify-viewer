'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useFormatPriceRange } from '@/lib/hooks/useFormatters';
import { getStatusBadgeClasses } from '@/lib/mock/uiHelpers';

interface Product {
  id: string;
  shopifyId: string;
  title: string;
  description: string;
  handle: string;
  status: string;
  totalInventory: number;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
  }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10, // Reduced from 50 back to standard pagination amount
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSyncing, setIsSyncing] = useState(false);
  
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const formatPriceRangeFn = useFormatPriceRange();
  
  const fetchProducts = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_API_ENDPOINT || ''}?page=${page}&limit=${pagination.limit}&search=${search}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products);
      setPagination(data.pagination);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    }
  };
  
  useEffect(() => {
    fetchProducts(pagination.page, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1, searchQuery);
  };
  
  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage, searchQuery);
  };
  
  // const syncProducts = async () => {
  //   try {
  //     setIsSyncing(true);
  //     toast({
  //       title: "Syncing products",
  //       description: "Starting product sync with Shopify...",
  //     });
      
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_API_ENDPOINT}`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       }
  //     });
      
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || 'Failed to sync products');
  //     }
      
  //     const result = await response.json();
      
  //     toast({
  //       title: "Sync complete",
  //       description: `Successfully synced ${result.syncedCount || 'all'} products from Shopify.`,
  //       variant: "success",
  //     });
      
  //     // Refresh product list
  //     fetchProducts(pagination.page, searchQuery);
  //   } catch (err) {
  //     toast({
  //       title: "Sync failed",
  //       description: err instanceof Error ? err.message : 'Failed to sync products from Shopify',
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsSyncing(false);
  //   }
  // };
  
  if (error) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h1>
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={() => fetchProducts(1, searchQuery)} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="flex">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </form>
          
          {/* TODO: Uncomment this when we have a way to sync products from Shopify */}
          {/* <button
            onClick={syncProducts}
            disabled={isSyncing}
            className={`ml-2 px-4 py-2 flex items-center space-x-2 ${
              isSyncing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white rounded-lg transition-colors`}
          >
            <Download className="h-4 w-4 mr-1" />
            <span>{isSyncing ? 'Syncing...' : 'Sync Products'}</span>
          </button> */}
          
        </div>
      </div>
      
      {isLoading ? (
        <div className="w-full bg-white rounded-lg shadow overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200"></div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center border-t border-gray-200 p-4">
                <div className="h-16 w-16 bg-gray-200 rounded"></div>
                <div className="ml-4 flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            {/* Table with fixed header and scrollable body */}
            <div className="relative overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[60%]">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                      Inventory
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[16%]">
                      Price
                    </th>
                  </tr>
                </thead>
              </table>
              {/* Separate scrollable area for tbody with exact same column widths */}
              <div className="overflow-y-auto max-h-[550px]">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <tbody ref={tableBodyRef} className="bg-white divide-y divide-gray-200">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                          No products found. Try a different search or sync products from Shopify.
                        </td>
                      </tr>
                    ) : (
                      products.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap w-[60%]">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 mr-4">
                                {product.images && product.images.length > 0 ? (
                                  <Image
                                    src={product.images[0].url}
                                    alt={product.images[0].altText || product.title}
                                    className="h-10 w-10 rounded-md object-cover"
                                    width={40}
                                    height={40}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.title}
                                </div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {product.description.length > 100 
                                    ? `${product.description.substring(0, 100)}...` 
                                    : product.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[12%]">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(product.status)}`}>
                              {product.status.toLowerCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-[12%]">
                            {product.totalInventory}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-[16%]">
                            {formatPriceRangeFn(
                              product.priceRange.minVariantPrice.amount,
                              product.priceRange.maxVariantPrice.amount,
                              product.priceRange.minVariantPrice.currencyCode
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
  
          {/* Pagination */}
          <div className="flex items-center justify-between py-3">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{products.length}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> products
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`p-2 rounded-md ${
                  pagination.page === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200 transition-colors'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`p-2 rounded-md ${
                  pagination.page === pagination.totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200 transition-colors'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}