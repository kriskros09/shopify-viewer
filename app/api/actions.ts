'use server';

import { revalidatePath } from 'next/cache';
import { SyncResponse } from '@/lib/services/shopify';

// Helper function to validate and get Shopify API endpoint
function getShopifyApiEndpoint() {
  const shopName = process.env.SHOPIFY_SHOP_NAME;
  
  if (!shopName) {
    throw new Error('SHOPIFY_SHOP_NAME environment variable is not defined');
  }
  
  // Remove quotes and any trailing/leading whitespace
  const cleanShopName = shopName.replace(/"/g, '').trim();
  
  // Ensure the shop name is in the correct format
  // If it already contains 'myshopify.com', use it as is
  // Otherwise, append '.myshopify.com'
  const formattedShopName = cleanShopName.includes('myshopify.com') 
    ? cleanShopName 
    : `${cleanShopName}.myshopify.com`;
  
  // Simple format: https://store-name.myshopify.com
  return `https://${formattedShopName}`;
}

// Helper function to get Shopify access token
function getShopifyAccessToken() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!token) {
    throw new Error('SHOPIFY_ACCESS_TOKEN environment variable is not defined');
  }
  // Remove quotes and any trailing/leading whitespace
  return token.replace(/"/g, '').trim();
}

/**
 * Helper function to test Shopify API connection
 */
async function testShopifyConnection() {
  const apiEndpoint = getShopifyApiEndpoint();
  const accessToken = getShopifyAccessToken();
  
  // Use the GraphQL endpoint as that's what was used before
  const url = `${apiEndpoint}/admin/api/2024-01/graphql.json`;
  console.log('Testing connection with:', url);
  
  // GraphQL query to fetch shop info
  const query = `{
    shop {
      name
      id
    }
  }`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query }),
    cache: 'no-store',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Connection test failed:', response.status, errorText);
    throw new Error(`API connection test failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('API connection test successful:', data.data?.shop?.name);
  return true;
}

/**
 * Helper function to get the base URL for API calls
 * This is needed because server-side fetch requires absolute URLs
 */
function getBaseUrl() {
  // First priority: NEXT_PUBLIC_APP_URL if set (works for both dev and prod)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // For development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // For production on Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Final fallbacks
  return process.env.SITE_URL || 'http://localhost:3000';
}

/**
 * Server action to sync products from Shopify
 * Uses Next.js Server Actions for secure server-side execution
 */
export async function syncProductsAction(): Promise<SyncResponse> {
  try {
    // First, verify the API connection with a shop request
    try {
      await testShopifyConnection();
    } catch (error) {
      throw new Error(`Shopify connection test failed: ${(error as Error).message}`);
    }
    
    // From here, we'll just call the existing sync API endpoint
    // This is similar to how it worked before, where the client called our API,
    // and our API then called Shopify
    const syncEndpoint = process.env.NEXT_PUBLIC_PRODUCTS_API_ENDPOINT;
    
    if (!syncEndpoint) {
      throw new Error('NEXT_PUBLIC_PRODUCTS_API_ENDPOINT is not defined');
    }
    
    // Get the base URL for API calls
    const baseUrl = getBaseUrl();
    console.log('Syncing products using endpoint:', `${baseUrl}${syncEndpoint}`);
    
    // Make the call to our API endpoint that handles the Shopify sync logic
    const response = await fetch(`${baseUrl}${syncEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      // Try to get more details about the error
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || 
          `Failed to sync products: ${response.status} ${response.statusText}`
        );
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        throw new Error(`Failed to sync products: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    // Revalidate the products page to show updated data
    revalidatePath('/products');
    
    return {
      success: data.success || true,
      message: data.message || 'Products synced successfully',
      count: data.count || 0,
    };
  } catch (error) {
    console.error('Error syncing products:', error);
    return {
      success: false,
      message: 'Failed to sync products: ' + (error as Error).message,
      count: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Server action to sync orders from Shopify for a specific date range
 * Uses Next.js Server Actions for secure server-side execution
 */
export async function syncOrdersAction(startDate: string, endDate: string): Promise<SyncResponse> {
  try {
    // Similar to products, we'll call the existing endpoint that was working before
    const syncEndpoint = process.env.NEXT_PUBLIC_ORDERS_API_ENDPOINT;
    
    if (!syncEndpoint) {
      throw new Error('NEXT_PUBLIC_ORDERS_API_ENDPOINT is not defined');
    }
    
    // Get the base URL for API calls
    const baseUrl = getBaseUrl();
    console.log('Syncing orders using endpoint:', `${baseUrl}${syncEndpoint}`);
    
    // Make the call to our API endpoint that handles the Shopify sync logic
    const response = await fetch(`${baseUrl}${syncEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startDate, endDate }),
      cache: 'no-store',
    });

    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      // Try to get more details about the error
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || 
          `Failed to sync orders: ${response.status} ${response.statusText}`
        );
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        throw new Error(`Failed to sync orders: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    // Revalidate the orders page to show updated data
    revalidatePath('/orders');
    
    return {
      success: data.success || true,
      message: data.message || 'Orders synced successfully',
      count: data.count || 0,
    };
  } catch (error) {
    console.error('Error syncing orders:', error);
    return {
      success: false,
      message: 'Failed to sync orders: ' + (error as Error).message,
      count: 0,
      error: (error as Error).message,
    };
  }
} 