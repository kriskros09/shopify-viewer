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
 * Utility function to get the base URL for API requests
 * @returns {Promise<string>} The base URL for API requests
 */
export async function getBaseUrl() {
  // Check for VERCEL_URL environment variable first (set in Vercel deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Check for NEXT_PUBLIC_VERCEL_URL environment variable (can be set manually)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  // Check if we're in production mode by checking NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    // Use the site URL if available
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    
    // Fallback to a default production URL if needed
    // This should be configured in your environment variables
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Last resort fallback for production
    console.warn('No production URL found. Using default production URL.');
    return 'https://your-production-domain.com'; // Replace with your actual production domain
  }
  
  // Development environment - use localhost
  if (typeof window !== 'undefined') {
    // Browser environment - use the current window location
    return window.location.origin;
  }
  
  // Server-side in development
  return 'http://localhost:3000';
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
    const syncEndpoint = process.env.NEXT_PUBLIC_PRODUCTS_API_ENDPOINT;
    
    if (!syncEndpoint) {
      throw new Error('NEXT_PUBLIC_PRODUCTS_API_ENDPOINT is not defined');
    }
    
    // Check if we're running on Vercel
    const isVercel = !!process.env.VERCEL;
    
    // Check if we're running on the client side (browser) vs server side
    const isClientSide = typeof window !== 'undefined';
    
    // Get the base URL for API calls - but we may not use it depending on environment
    const baseUrl = await getBaseUrl();
    console.log('Base URL available:', baseUrl);
    console.log('Environment: ', {
      isVercel,
      isClientSide,
      nodeEnv: process.env.NODE_ENV,
      hasVercelUrl: !!process.env.VERCEL_URL
    });
    
    // For server actions in Next.js, we should use direct handler imports rather than
    // making a new HTTP request when we're already on the server, EXCEPT on Vercel
    let responseData;
    
    if (!isVercel && !isClientSide && !baseUrl.includes('vercel') && syncEndpoint.startsWith('/api/')) {
      // We're running on the server locally and can directly import and call the handler
      console.log('Directly calling product sync handler (local server-side)');
      
      // Dynamically import the handler to avoid circular dependencies
      const { POST } = await import('./shopify/products/sync/route');
      
      // Call the handler directly - this will fetch real products from Shopify
      const result = await POST();
      responseData = await result.json();
    } else {
      // Handle client-side or Vercel server-side with proper URL construction
      let fullUrl;
      
      if (isClientSide) {
        // When in browser, use the current URL as base
        const currentUrl = window.location.origin;
        fullUrl = `${currentUrl}${syncEndpoint}`;
        console.log('Client-side (browser) call using current URL:', fullUrl);
      } else if (isVercel) {
        // In Vercel server environment, construct absolute URL
        if (process.env.VERCEL_URL) {
          // Standard Vercel deployment
          fullUrl = `https://${process.env.VERCEL_URL}${syncEndpoint}`;
        } else if (process.env.VERCEL_BRANCH_URL) {
          // Branch-specific preview deployment
          fullUrl = `https://${process.env.VERCEL_BRANCH_URL}${syncEndpoint}`;
        } else if (process.env.NEXT_PUBLIC_APP_URL) {
          // Fallback to configured app URL
          fullUrl = `${process.env.NEXT_PUBLIC_APP_URL}${syncEndpoint}`;
        } else {
          // Last resort fallback - this should ideally never happen
          console.error('No Vercel URL environment variables found, using a placeholder that will likely fail');
          fullUrl = `https://shopify-viewer.vercel.app${syncEndpoint}`;
        }
      } else {
        // Local development server-side
        fullUrl = `${baseUrl}${syncEndpoint}`;
      }
      
      console.log('Syncing products using URL:', fullUrl);
      
      try {
        // Make the call to our API endpoint that handles the Shopify sync logic
        console.log('Initiating fetch request with method:', 'POST');
        
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          // Add longer timeout for Vercel environment
          ...(isVercel ? { next: { revalidate: 0 } } : {}),
        });
  
        console.log('Response received - status:', response.status, response.statusText);
        
        if (!response.ok) {
          // Try to get more details about the error
          try {
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (jsonError) {
              console.error('Response not in JSON format', jsonError);
              throw new Error(`Failed to sync products: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
            }
            
            throw new Error(
              errorData.message || errorData.error || 
              `Failed to sync products: ${response.status} ${response.statusText}`
            );
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
            throw new Error(`Failed to sync products: ${response.status} ${response.statusText}`);
          }
        }
  
        responseData = await response.json();
      } catch (fetchError: unknown) {
        console.error('Fetch operation failed:', fetchError);
        
        // For Vercel debugging, log more details
        if (isVercel) {
          console.error('Vercel environment detected, fetch error details:');
          console.error('- Error name:', fetchError instanceof Error ? fetchError.name : 'Unknown');
          console.error('- Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
          console.error('- Target URL:', fullUrl);
          console.error('- Stack trace:', fetchError instanceof Error ? fetchError.stack : 'No stack trace');
        }
        
        throw new Error(`Fetch operation failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
    }
    
    // Revalidate the products page to show updated data
    revalidatePath('/products');
    
    return {
      success: responseData.success || true,
      message: responseData.message || 'Products synced successfully',
      count: responseData.count || 0,
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
    
    // Check if we're running on Vercel
    const isVercel = !!process.env.VERCEL;
    
    // Check if we're running on the client side (browser) vs server side
    const isClientSide = typeof window !== 'undefined';
    
    // Get the base URL for API calls - but we may not use it depending on environment
    const baseUrl = await getBaseUrl();
    console.log('Base URL available:', baseUrl);
    console.log('Environment: ', {
      isVercel,
      isClientSide,
      nodeEnv: process.env.NODE_ENV,
      hasVercelUrl: !!process.env.VERCEL_URL
    });
    
    // Similar to products, use direct handler imports for server-side calls
    let responseData;
    
    if (!isVercel && !isClientSide && !baseUrl.includes('vercel') && syncEndpoint.startsWith('/api/')) {
      // We're running on the server locally and can directly import and call the handler
      console.log('Directly calling orders sync handler (local server-side)');
      
      // Dynamically import the handler to avoid circular dependencies
      const { POST } = await import('./shopify/orders/sync/route');
      
      // Create a Request object with the real startDate and endDate data
      const requestBody = JSON.stringify({ startDate, endDate });
      const requestObject = new Request('http://localhost/api/shopify/orders/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
      
      // Call the handler directly with our request object containing the real data
      const result = await POST(requestObject);
      responseData = await result.json();
    } else {
      // Handle client-side or Vercel server-side with proper URL construction
      let fullUrl;
      
      if (isClientSide) {
        // When in browser, use the current URL as base
        const currentUrl = window.location.origin;
        fullUrl = `${currentUrl}${syncEndpoint}`;
        console.log('Client-side (browser) call using current URL:', fullUrl);
      } else if (isVercel) {
        // In Vercel server environment, construct absolute URL
        if (process.env.VERCEL_URL) {
          // Standard Vercel deployment
          fullUrl = `https://${process.env.VERCEL_URL}${syncEndpoint}`;
        } else if (process.env.VERCEL_BRANCH_URL) {
          // Branch-specific preview deployment
          fullUrl = `https://${process.env.VERCEL_BRANCH_URL}${syncEndpoint}`;
        } else if (process.env.NEXT_PUBLIC_APP_URL) {
          // Fallback to configured app URL
          fullUrl = `${process.env.NEXT_PUBLIC_APP_URL}${syncEndpoint}`;
        } else {
          // Last resort fallback - this should ideally never happen
          console.error('No Vercel URL environment variables found, using a placeholder that will likely fail');
          fullUrl = `https://shopify-viewer.vercel.app${syncEndpoint}`;
        }
      } else {
        // Local development server-side
        fullUrl = `${baseUrl}${syncEndpoint}`;
      }
      
      console.log('Syncing orders using URL:', fullUrl);
      
      try {
        // Make the call to our API endpoint that handles the Shopify sync logic
        console.log('Initiating fetch request with method:', 'POST');
        console.log('Request body:', JSON.stringify({ startDate, endDate }));
        
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ startDate, endDate }),
          cache: 'no-store',
          // Add longer timeout for Vercel environment
          ...(isVercel ? { next: { revalidate: 0 } } : {}),
        });
  
        console.log('Response received - status:', response.status, response.statusText);
        
        if (!response.ok) {
          // Try to get more details about the error
          try {
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (jsonError) {
              console.error('Response not in JSON format', jsonError);
              throw new Error(`Failed to sync orders: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
            }
            
            throw new Error(
              errorData.message || errorData.error || 
              `Failed to sync orders: ${response.status} ${response.statusText}`
            );
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
            throw new Error(`Failed to sync orders: ${response.status} ${response.statusText}`);
          }
        }
  
        responseData = await response.json();
      } catch (fetchError: unknown) {
        console.error('Fetch operation failed:', fetchError);
        
        // For Vercel debugging, log more details
        if (isVercel) {
          console.error('Vercel environment detected, fetch error details:');
          console.error('- Error name:', fetchError instanceof Error ? fetchError.name : 'Unknown');
          console.error('- Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
          console.error('- Target URL:', fullUrl);
          console.error('- Stack trace:', fetchError instanceof Error ? fetchError.stack : 'No stack trace');
        }
        
        throw new Error(`Fetch operation failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
    }
    
    // Revalidate the orders page to show updated data
    revalidatePath('/orders');
    
    return {
      success: responseData.success || true,
      message: responseData.message || 'Orders synced successfully',
      count: responseData.count || 0,
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

/**
 * Function to sync Shopify products
 * @returns {Promise<any>} The response from the API
 */
export async function syncProducts() {
  try {
    const baseUrl = await getBaseUrl();
    console.log(`Syncing products with base URL: ${baseUrl}`);
    
    const response = await fetch(`${baseUrl}/api/shopify/products/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to sync products: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to sync products: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing products:', error);
    throw error;
  }
}

/**
 * Function to sync Shopify orders
 * @param {string} startDate - Optional start date for order sync (YYYY-MM-DD)
 * @param {string} endDate - Optional end date for order sync (YYYY-MM-DD)
 * @returns {Promise<any>} The response from the API
 */
export async function syncOrders(startDate?: string, endDate?: string) {
  try {
    const baseUrl = await getBaseUrl();
    console.log(`Syncing orders with base URL: ${baseUrl}`, { startDate, endDate });
    
    // Construct URL with optional date parameters
    let url = `${baseUrl}/api/shopify/orders/sync`;
    
    // Add date range parameters if provided
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to sync orders: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to sync orders: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing orders:', error);
    throw error;
  }
} 