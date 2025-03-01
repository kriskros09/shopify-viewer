import { format, parseISO } from 'date-fns';

/**
 * Hook for formatting dates consistently across the application
 */
export function useFormatDate() {
  /**
   * Format an ISO date string into a human-readable format
   * @param dateString ISO date string to format
   * @param formatString Optional format string (defaults to 'MMM dd, yyyy • h:mm a')
   * @returns Formatted date string
   */
  const formatDate = (dateString: string, formatString: string = 'MMM dd, yyyy • h:mm a') => {
    if (!dateString) return '';
    return format(parseISO(dateString), formatString);
  };

  return formatDate;
}

/**
 * Hook for formatting prices consistently across the application
 */
export function useFormatPrice() {
  /**
   * Format a price amount with currency code
   * @param amount Price amount as string
   * @param currencyCode Currency code (e.g., USD, EUR)
   * @param options Optional formatting options
   * @returns Formatted price string
   */
  const formatPrice = (
    amount: string, 
    currencyCode: string, 
    options: { 
      useLocale?: boolean,
      minimumFractionDigits?: number,
      maximumFractionDigits?: number
    } = {}
  ) => {
    if (!amount) return `${currencyCode} 0.00`;
    
    const parsedAmount = parseFloat(amount);
    
    if (options.useLocale) {
      return `${currencyCode} ${parsedAmount.toLocaleString(undefined, {
        minimumFractionDigits: options.minimumFractionDigits ?? 2,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
      })}`;
    }
    
    return `${currencyCode} ${parsedAmount.toFixed(2)}`;
  };

  return formatPrice;
}

/**
 * Hook for formatting price ranges (for products with variants)
 */
export function useFormatPriceRange() {
  const formatPrice = useFormatPrice();

  /**
   * Format a price range for a product with min and max variant prices
   * @param minAmount Minimum price amount
   * @param maxAmount Maximum price amount
   * @param currencyCode Currency code
   * @returns Formatted price range string
   */
  const formatPriceRange = (
    minAmount: string,
    maxAmount: string,
    currencyCode: string
  ) => {
    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    
    if (min === max) {
      return formatPrice(minAmount, currencyCode);
    }
    
    return `${currencyCode} ${min.toFixed(2)} - ${max.toFixed(2)}`;
  };

  return formatPriceRange;
} 