'use client';

import { useState, useEffect, Fragment } from 'react';
import { Search, ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp, Printer, ExternalLink, Package } from 'lucide-react';
import { useFormatDate, useFormatPrice } from '@/lib/hooks/useFormatters';
import { orderDateRanges } from '@/lib/mock/dateRanges';
import { getStatusBadgeClasses, getShortShopifyId } from '@/lib/mock/uiHelpers';
import { useToast } from '@/components/ui/use-toast';

interface Address {
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
}

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  ordersCount: number;
  totalSpent: {
    amount: string;
    currencyCode: string;
  };
}

interface DiscountApplication {
  title: string;
  value: string;
  code?: string;
}

interface ShippingLine {
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
}

interface Order {
  id: string;
  shopifyId: string;
  name: string;
  email: string;
  processedAt: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  subtotalPrice: {
    amount: string;
    currencyCode: string;
  };
  totalTax: {
    amount: string;
    currencyCode: string;
  };
  financialStatus: string;
  fulfillmentStatus: string;
  paymentMethod?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  customer?: Customer;
  note?: string;
  tags: string[];
  discountApplications: DiscountApplication[];
  shippingLines: ShippingLine[];
  lineItems: {
    id: string;
    title: string;
    quantity: number;
    price: {
      amount: string;
      currencyCode: string;
    };
    variantTitle?: string;
    sku?: string;
    productId?: string;
    image?: string;
  }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [noResults, setNoResults] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Date filters - set default to empty to show all orders by default
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Use our custom hooks
  const formatDateFn = useFormatDate();
  const formatPriceFn = useFormatPrice();
  
  const { toast } = useToast();
  
  const fetchOrders = async (page = 1, search = '', start = startDate, end = endDate) => {
    try {
      setIsLoading(true);
      
      // Build URL with proper handling of empty date ranges
      let url = `${process.env.NEXT_PUBLIC_SUPABASE_ORDERS_API_ENDPOINT || ''}?page=${page}&limit=${pagination.limit}`;
      
      // Add search parameter if provided
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      // Only add date parameters if they're provided
      if (start) {
        url += `&startDate=${encodeURIComponent(start)}`;
      }
      
      if (end) {
        url += `&endDate=${encodeURIComponent(end)}`;
      }
      
      console.log(`Fetching orders with URL: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.orders.length === 0) {
        setNoResults(true);
      } else {
        setNoResults(false);
      }
      
      // Ensure we're using the correct pagination data from the server
      setOrders(data.orders);
      setPagination(data.pagination);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    }
  };
  
  useEffect(() => {
    // Fetch all orders by default (with empty date range)
    fetchOrders(pagination.page, searchQuery, '', '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1, searchQuery, startDate, endDate);
  };
  
  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage, searchQuery, startDate, endDate);
  };
  
  const handleDateFilter = () => {
    // Clear previous errors
    setDateRangeError(null);
    
    // Validate that both dates are provided
    if (!startDate || !endDate) {
      setDateRangeError('Please provide both start and end dates for the date range');
      return;
    }
    
    toast({
      title: "Date filter applied",
      description: `Showing orders from ${startDate} to ${endDate}`,
      variant: "success",
    });
    
    fetchOrders(1, searchQuery, startDate, endDate);
  };
  
  // Toggle row expansion
  const toggleRowExpand = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };
  
  const handleDateRangeSelect = (days: number | 'ytd') => {
    setDateRangeError('');
    
    // Get the current date and time (end of the range)
    const end = new Date();
    // Set to end of day (23:59:59.999)
    end.setHours(23, 59, 59, 999);
    
    let start: Date;
    
    if (days === 'ytd') {
      // Year to date - start from January 1st of current year
      const currentYear = end.getFullYear();
      start = new Date(currentYear, 0, 1);
    } else {
      // Calculate start date by subtracting the specified number of days
      start = new Date(end);
      start.setDate(end.getDate() - days);
      // Set to beginning of day (00:00:00.000)
      start.setHours(0, 0, 0, 0);
    }
    
    // Format dates in a timezone-safe way
    // ISO format (YYYY-MM-DD) ensures consistent date handling between client and server
    const startFormatted = start.toISOString().split('T')[0];
    const endFormatted = end.toISOString().split('T')[0];
    
    setStartDate(startFormatted);
    setEndDate(endFormatted);
    
    toast({
      title: "Date range applied",
      description: days === 'ytd' 
        ? `Showing orders for year to date (${startFormatted} to ${endFormatted})`
        : `Showing orders for last ${days} days (${startFormatted} to ${endFormatted})`,
      variant: "success",
    });
    
    // Fetch orders with the new date range
    fetchOrders(1, searchQuery, startFormatted, endFormatted);
  };
  
  // Count total items in order
  const getTotalItems = (order: Order) => {
    return order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  };
  
  const clearAllFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setDateRangeError(null);
    
    // Reset to first page
    const resetPage = 1;
    
    // Explicitly call fetchOrders with empty parameters
    fetchOrders(resetPage, '', '', '');
    
    toast({
      title: "Filters cleared",
      description: "All filters have been cleared.",
    });
  };
  
  // TODO: Uncomment this when we have a way to sync orders from Shopify
  // const syncOrders = async () => {
  //   if (!startDate || !endDate) {
  //     setDateRangeError('Please select a date range to sync orders');
  //     return;
  //   }

  //   try {
  //     setIsSyncing(true);
  //     toast({
  //       title: "Syncing orders",
  //       description: `Starting order sync with Shopify for period ${startDate} to ${endDate}...`,
  //     });
      
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_ORDERS_API_ENDPOINT}`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         startDate,
  //         endDate
  //       })
  //     });
      
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || 'Failed to sync orders');
  //     }
      
  //     const result = await response.json();
      
  //     toast({
  //       title: "Sync complete",
  //       description: `Successfully synced ${result.syncedCount || 'all'} orders from Shopify.`,
  //       variant: "success",
  //     });
      
  //     // Refresh order list
  //     fetchOrders(pagination.page, searchQuery, startDate, endDate);
  //   } catch (err) {
  //     toast({
  //       title: "Sync failed",
  //       description: err instanceof Error ? err.message : 'Failed to sync orders from Shopify',
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsSyncing(false);
  //   }
  // };

  console.log('orders', orders);
  
  if (error) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Orders</h1>
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={() => fetchOrders(1, searchQuery, startDate, endDate)} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        
        <div className="w-full md:w-auto">
          {/* Top row with aligned date picker and search */}
          <div className="flex flex-col md:flex-row items-end md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Date range selector */}
            <div className="w-full md:w-auto">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDateRangeError(null);
                    }}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <span className="text-gray-500">to</span>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDateRangeError(null);
                    }}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={handleDateFilter}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="flex w-full md:w-auto">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full placeholder-gray-500 text-gray-900"
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
            
            {/* TODO: Uncomment this when we have a way to sync orders from Shopify */}
            {/* <button
              onClick={syncOrders}
              disabled={isSyncing || !startDate || !endDate}
              className={`ml-2 px-4 py-2 flex items-center space-x-2 ${
                isSyncing || !startDate || !endDate
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white rounded-lg transition-colors`}
              title={!startDate || !endDate ? "Select a date range first" : ""}
            >
              <Download className="h-4 w-4 mr-1" />
              <span>{isSyncing ? 'Syncing...' : 'Sync Orders'}</span>
            </button> */}
            
          </div>
          
          {/* Bottom row for date range buttons only */}
          <div className="flex justify-center md:justify-start mt-2">
            <div className="flex flex-wrap gap-2">
              <button
                key="view-all"
                onClick={clearAllFilters}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                View All Orders
              </button>
              {orderDateRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    // Clear any previous date range errors
                    setDateRangeError('');
                    
                    if (range.custom) {
                      setStartDate(range.custom.start);
                      setEndDate(range.custom.end);
                      
                      toast({
                        title: "Date range applied",
                        description: `Showing orders for ${range.label} (${range.custom.start} to ${range.custom.end})`,
                        variant: "success",
                      });
                      
                      fetchOrders(1, searchQuery, range.custom.start, range.custom.end);
                    } else if (range.days) {
                      handleDateRangeSelect(range.days as number | 'ytd');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-800 text-white rounded transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          
          {dateRangeError && (
            <div className="text-sm text-red-600 font-medium mt-1">
              {dateRangeError}
            </div>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="w-full bg-white rounded-lg shadow overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200"></div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="border-t border-gray-200 p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shopify ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      No orders found for the selected date range. Try a different search or date range.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <Fragment key={order.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.name}
                          <button 
                            onClick={(e) => toggleRowExpand(order.id, e)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            {expandedRows[order.id] ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <div className="font-medium">
                              {formatDateFn(order.processedAt, 'MMM dd, yyyy')}
                              <span className="ml-1 text-xs text-gray-400">(local)</span>
                            </div>
                            <div className="text-gray-500 text-sm">
                              {formatDateFn(order.processedAt, 'h:mm a', true)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              UTC: {new Date(order.processedAt).toISOString().replace('T', ' ').substring(0, 16)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getTotalItems(order)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(order.financialStatus)}`}>
                              {order.financialStatus.toLowerCase()}
                            </span>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(order.fulfillmentStatus)}`}>
                              {order.fulfillmentStatus.toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPriceFn(order.totalPrice.amount, order.totalPrice.currencyCode)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getShortShopifyId(order.shopifyId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button className="p-1 text-blue-600 hover:text-blue-800" title="View in Shopify">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:text-gray-800" title="Print Order">
                              <Printer className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-green-600 hover:text-green-800" title="Fulfill Order">
                              <Package className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[order.id] && (
                        <tr>
                          <td colSpan={8} className="bg-gray-50 p-6 border-b border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Order Items */}
                              <div className="col-span-2">
                                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {order.lineItems.map(item => (
                                        <tr key={item.id}>
                                          <td className="px-4 py-2 text-sm text-gray-900">{item.title}</td>
                                          <td className="px-4 py-2 text-sm text-gray-500">{item.variantTitle || 'Default'}</td>
                                          <td className="px-4 py-2 text-sm text-gray-500">{formatPriceFn(item.price.amount, item.price.currencyCode)}</td>
                                          <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                            {formatPriceFn(
                                              (parseFloat(item.price.amount) * item.quantity).toString(), 
                                              item.price.currencyCode
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                
                                {/* Order Summary */}
                                <div className="mt-4 bg-white rounded-lg shadow p-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">
                                      {formatPriceFn(order.subtotalPrice?.amount || '0', order.totalPrice.currencyCode)}
                                    </span>
                                  </div>
                                  {order.discountApplications && order.discountApplications.length > 0 && (
                                    <div className="flex justify-between text-sm mb-2">
                                      <span className="text-gray-600">Discounts</span>
                                      <span className="text-green-600">
                                        -{order.discountApplications.map(d => d.value).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                  {order.shippingLines && order.shippingLines.length > 0 && (
                                    <div className="flex justify-between text-sm mb-2">
                                      <span className="text-gray-600">Shipping ({order.shippingLines[0].title})</span>
                                      <span className="text-gray-900">
                                        {formatPriceFn(order.shippingLines[0].price.amount, order.shippingLines[0].price.currencyCode)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="text-gray-900">
                                      {formatPriceFn(order.totalTax?.amount || '0', order.totalPrice.currencyCode)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 mt-2">
                                    <span>Total</span>
                                    <span>
                                      {formatPriceFn(order.totalPrice.amount, order.totalPrice.currencyCode)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Order Details */}
                              <div>
                                <h4 className="font-medium text-gray-900 mb-3">Order Details</h4>
                                <div className="bg-white rounded-lg shadow p-4 space-y-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Order Number</p>
                                    <p className="text-sm font-medium text-gray-900">{order.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Date</p>
                                    <p className="text-sm text-gray-900">
                                      {formatDateFn(order.processedAt, 'MMM dd, yyyy • h:mm a', true)}
                                      <span className="ml-1 text-xs text-gray-500">(local)</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      UTC: {new Date(order.processedAt).toISOString().replace('T', ' ').substring(0, 19)}
                                    </p>
                                  </div>
                                  {order.paymentMethod && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">Payment Method</p>
                                      <p className="text-sm text-gray-900">{order.paymentMethod}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Customer</p>
                                    <p className="text-sm text-gray-900">{order.email}</p>
                                  </div>
                                  {order.note && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">Order Note</p>
                                      <p className="text-sm text-gray-900">{order.note}</p>
                                    </div>
                                  )}
                                  {order.tags && order.tags.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">Tags</p>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {order.tags.map(tag => (
                                          <span key={tag} className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {order.shippingAddress && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">Shipping Address</p>
                                      <p className="text-sm text-gray-900">
                                        {order.shippingAddress.address1}<br/>
                                        {order.shippingAddress.address2 && <>{order.shippingAddress.address2}<br/></>}
                                        {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}<br/>
                                        {order.shippingAddress.country}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
  
          {/* Pagination */}
          {/* 
            Note: pagination.total comes from the server response and represents the total 
            number of orders matching the current filters. If there's a discrepancy, check
            the backend API implementation.
          */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{orders.length}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> orders
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`p-2 rounded ${
                  pagination.page === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages || 1}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                className={`p-2 rounded ${
                  pagination.page === pagination.totalPages || pagination.totalPages === 0
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-200'
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