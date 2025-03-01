/**
 * Mock data for the analytics page
 * 
 * Used in:
 * - app/analytics/page.tsx - For displaying mock sales analytics data
 * 
 * This mock data simulates the response from a Shopify analytics API
 * and contains sample data for visualization purposes.
 */

export interface SalesData {
  totalOrders: number;
  totalSales: {
    amount: string;
    currencyCode: string;
  };
  averageOrderValue: {
    amount: string;
    currencyCode: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  topProducts: Array<{
    id: string;
    title: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  salesByDay: Array<{
    date: string;
    totalSales: number;
    orderCount: number;
  }>;
}

/**
 * Generates mock sales analytics data for a given date range
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @returns Mocked sales data for UI display
 */
export function generateMockSalesData(startDate: string, endDate: string): SalesData {
  return {
    totalOrders: 32,
    totalSales: {
      amount: '32771.30',
      currencyCode: 'USD',
    },
    averageOrderValue: {
      amount: '1024.10',
      currencyCode: 'USD',
    },
    period: {
      startDate,
      endDate,
    },
    topProducts: [
      {
        id: '1',
        title: 'The Complete Snowboard',
        totalSold: 12,
        totalRevenue: 8399.40,
      },
      {
        id: '2',
        title: 'The Minimal Snowboard',
        totalSold: 8,
        totalRevenue: 7087.60,
      },
      {
        id: '3',
        title: 'The Videographer Snowboard',
        totalSold: 7,
        totalRevenue: 6201.65,
      },
      {
        id: '4',
        title: 'Gift Card',
        totalSold: 5,
        totalRevenue: 500.00,
      },
      {
        id: '5',
        title: 'Selling Plans Ski Wax',
        totalSold: 3,
        totalRevenue: 149.85,
      },
    ],
    salesByDay: [
      {
        date: '2025-02-28',
        totalSales: 31875.35,
        orderCount: 1,
      },
      {
        date: '2025-02-27',
        totalSales: 785.95,
        orderCount: 1,
      },
      {
        date: '2025-02-26',
        totalSales: 110.00,
        orderCount: 1,
      },
    ],
  };
} 