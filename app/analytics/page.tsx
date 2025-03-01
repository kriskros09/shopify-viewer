'use client';

import { useState } from 'react';
import { format, sub, parseISO } from 'date-fns';
import { Calendar, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { useFormatDate, useFormatPrice } from '@/lib/hooks/useFormatters';
import { standardDateRanges } from '@/lib/mock/dateRanges';
import { generateMockSalesData, SalesData } from '@/lib/mock/analyticsData';

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState(
    format(sub(new Date(), { days: 30 }), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  // Use mock data instead of API calls
  const [salesData, setSalesData] = useState<SalesData>(
    generateMockSalesData(startDate, endDate)
  );
  
  const handleDateFilter = () => {
    // Update mock data when date range changes
    setSalesData(generateMockSalesData(startDate, endDate));
  };
  
  // Use our custom hooks
  const formatDateFn = useFormatDate();
  const formatPriceFn = useFormatPrice();
  
  const handleDateRangeSelect = (days: number | string) => {
    const end = new Date();
    let start;
    
    if (days === 'ytd') {
      start = new Date(end.getFullYear(), 0, 1); // January 1st of current year
    } else {
      start = sub(end, { days: days as number });
    }
    
    const newStartDate = format(start, 'yyyy-MM-dd');
    const newEndDate = format(end, 'yyyy-MM-dd');
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // Update mock data with new date range
    setSalesData(generateMockSalesData(newStartDate, newEndDate));
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
        
        <div className="flex flex-col w-full md:w-auto space-y-4">
          {/* Date range selector */}
          <div className="flex flex-col space-y-2">
            <div className="text-sm font-medium text-gray-700">Date Range</div>
            <div className="flex flex-wrap gap-2">
              {standardDateRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => range.days && handleDateRangeSelect(range.days)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
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
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <button
                onClick={handleDateFilter}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-green-100 text-green-800 mr-4">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPriceFn(salesData.totalSales.amount, salesData.totalSales.currencyCode, { useLocale: true })}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            From {formatDateFn(salesData.period.startDate, 'MMM dd, yyyy')} to {formatDateFn(salesData.period.endDate, 'MMM dd, yyyy')}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-800 mr-4">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">
                {salesData.totalOrders.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            From {formatDateFn(salesData.period.startDate, 'MMM dd, yyyy')} to {formatDateFn(salesData.period.endDate, 'MMM dd, yyyy')}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-purple-100 text-purple-800 mr-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPriceFn(salesData.averageOrderValue.amount, salesData.averageOrderValue.currencyCode, { useLocale: true })}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            From {formatDateFn(salesData.period.startDate, 'MMM dd, yyyy')} to {formatDateFn(salesData.period.endDate, 'MMM dd, yyyy')}
          </p>
        </div>
      </div>
      
      {/* Top Products Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h2>
        
        {salesData.topProducts && salesData.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.topProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.totalSold.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salesData.totalSales.currencyCode} {product.totalRevenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No product data available for the selected period.</p>
        )}
      </div>
      
      {/* Sales by Day Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Sales</h2>
        
        {salesData.salesByDay && salesData.salesByDay.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.salesByDay.map((day) => (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDateFn(day.date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.orderCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPriceFn(day.totalSales.toString(), salesData.totalSales.currencyCode, { useLocale: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No daily sales data available for the selected period.</p>
        )}
      </div>
    </div>
  );
} 