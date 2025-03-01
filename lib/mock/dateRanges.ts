/**
 * Date range presets used across the application
 * 
 * Used in:
 * - app/orders/page.tsx - For filtering orders by date range
 * - app/analytics/page.tsx - For filtering analytics data by date range
 * - app/sync/page.tsx - For selecting sync date ranges
 */

// Define types for date ranges
export interface DateRangeOption {
  label: string;
  days?: number | string;
  custom?: {
    start: string;
    end: string;
  };
}

// Standard date ranges for filtering
export const standardDateRanges: DateRangeOption[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Year to date', days: 'ytd' },
];

// Order page specific date ranges
export const orderDateRanges: DateRangeOption[] = [
  ...standardDateRanges
]; 