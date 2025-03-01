// Database table interfaces matching the actual schema
export interface Product {
  id: string;
  shopify_id: string;
  title: string;
  description?: string;
  handle?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  total_inventory?: number;
  price_min: number;
  price_max: number;
  currency_code?: string;
  synced_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  shopify_id: string;
  title?: string;
  price: number;
  sku?: string;
  inventory_quantity?: number;
  weight?: number;
  weight_unit?: string;
  // Note: synced_at does not exist in this table
}

export interface ProductImage {
  id: string;
  product_id: string;
  shopify_id: string;
  url?: string;
  alt_text?: string;
  width?: number;
  height?: number;
  // Note: synced_at does not exist in this table
}

export interface Order {
  id: string;
  shopify_id: string;
  name: string; // Required field
  email?: string;
  phone?: string;
  processed_at: string; // Required field
  total_price: number; // Required field
  subtotal_price: number; // Required field
  tax_price?: number; // Optional with default 0
  shipping_price?: number; // Optional with default 0
  currency_code?: string; // Optional with default 'USD'
  financial_status?: string;
  fulfillment_status?: string;
  synced_at: string; // Required field
  created_at?: string; // Optional with default now()
  updated_at?: string; // Optional with default now()
  // Note: note, payment_method, tags do not exist in this table
}

export interface Customer {
  id: string;
  shopify_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface Address {
  id: string;
  order_id: string;
  customer_id?: string;
  address_type: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  name?: string;
  phone?: string;
}

export interface LineItem {
  id: string;
  order_id: string;
  shopify_id: string;
  title?: string;
  quantity?: number;
  price?: number;
  currency_code?: string;
  product_id?: string;
  variant_id?: string;
  // total_price field doesn't exist in the actual database schema
  // Note: sku, variant_title, currency_code, synced_at, image, product_title, total_price do not exist in this table
}

// Helper functions for safely handling values

/**
 * Return a safe value or default if the value is null or undefined
 */
export function safeValue<T>(value: T | null | undefined, defaultValue: T | undefined = undefined): T | undefined {
  return value !== undefined && value !== null ? value : defaultValue;
}

/**
 * Return a safe string value or default if the value is null or undefined
 */
export function safeString(value: string | null | undefined, defaultValue: string | undefined = undefined): string | undefined {
  return safeValue(value, defaultValue);
}

/**
 * Return a safe number value or default if the value is null, undefined, or NaN
 * Use for fields with NOT NULL constraints to ensure a numeric value
 */
export function safeNumber(value: number | string | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? defaultValue : num;
}

/**
 * Return a safe date string or default if the value is null or undefined
 */
export function safeDate(value: string | Date | null | undefined, defaultValue: string | undefined = undefined): string | undefined {
  if (value === null || value === undefined) return defaultValue;
  if (value instanceof Date) return value.toISOString();
  return value;
} 