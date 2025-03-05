'use server';

import { revalidatePath } from 'next/cache';
import { SyncResponse } from '@/lib/services/shopify';

/**
 * Helper function to validate and get Shopify API endpoint
 */
function getShopifyApiEndpoint() {
  const shopName = process.env.SHOPIFY_SHOP_NAME;
  
  if (!shopName) {
    throw new Error('SHOPIFY_SHOP_NAME environment variable is not defined');
  }
  
  // Remove quotes and any trailing/leading whitespace
  const cleanShopName = shopName.replace(/"/g, '').trim();
  
  // Ensure the shop name is in the correct format
  const formattedShopName = cleanShopName.includes('myshopify.com') 
    ? cleanShopName 
    : `${cleanShopName}.myshopify.com`;
  
  return `https://${formattedShopName}`;
}

/**
 * Helper function to get Shopify access token
 */
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
  
  // Use the GraphQL endpoint
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
export async function getBaseUrl(): Promise<string> {
  // Check if we're in production mode by checking NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    // In production, use the site URL we've set in Vercel
    return process.env.NEXT_PUBLIC_SITE_URL || '';
  }
  
  // In development, just use localhost
  return process.env.NEXT_PUBLIC_APP_URL || '';
}

/**
 * Gets the environment information for API calls
 */
function getEnvironmentInfo() {
  const isVercel = !!process.env.VERCEL;
  const isClientSide = typeof window !== 'undefined';
  const nodeEnv = process.env.NODE_ENV;
  const hasVercelUrl = !!process.env.VERCEL_URL;
  
  return {
    isVercel,
    isClientSide,
    nodeEnv,
    hasVercelUrl
  };
}

/**
 * Constructs the full URL for API calls based on environment
 */
async function constructApiUrl(endpoint: string) {
  const { isClientSide } = getEnvironmentInfo();
  
  // Handle client-side specifics
  if (isClientSide) {
    // When in browser, use the current URL as base
    const currentUrl = window.location.origin;
    return `${currentUrl}${endpoint}`;
  }
  
  // For server-side, use our simplified getBaseUrl function
  const baseUrl = await getBaseUrl();
  
  // Make sure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${normalizedEndpoint}`;
}

/**
 * Handles API response and errors
 */
async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error response body:', errorText);
    
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(
        errorData.message || errorData.error || 
        `API call failed: ${response.status} ${response.statusText}`
      );
    } catch (jsonError) {
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`, { cause: jsonError });
    }
  }
  
  return await response.json();
}

/**
 * Generic function to handle sync operations
 */
async function callShopifySync(
  endpoint: string, 
  requestData: Record<string, unknown> | null = null, 
  pathToRevalidate: string
): Promise<SyncResponse> {
  try {
    // Verify the endpoint exists
    if (!endpoint) {
      throw new Error(`API endpoint is not defined`);
    }
    
    // First, verify the API connection with a shop request
    await testShopifyConnection();
    
    const { isVercel, isClientSide } = getEnvironmentInfo();
    const baseUrl = await getBaseUrl();
    
    console.log('Environment: ', { 
      isVercel, 
      isClientSide, 
      nodeEnv: process.env.NODE_ENV, 
      endpoint 
    });
    
    // Determine if we can use direct imports or need HTTP
    let responseData;
    
    if (!isVercel && !isClientSide && !baseUrl.includes('vercel') && endpoint.startsWith('/api/')) {
      // We're running on the server locally and can directly import and call the handler
      console.log('Directly calling sync handler (local server-side)');
      
      // Determine which API handler to import based on the endpoint
      let handlerModule;
      
      if (endpoint.includes('/products/')) {
        handlerModule = await import('./shopify/products/sync/route');
      } else if (endpoint.includes('/orders/')) {
        handlerModule = await import('./shopify/orders/sync/route');
      } else {
        throw new Error(`Unknown API endpoint: ${endpoint}`);
      }
      
      const { POST } = handlerModule;
      
      // Create a Request object with data if needed
      let requestObject;
      
      if (requestData) {
        requestObject = new Request(`http://localhost${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        // Call the handler directly with our request object
        const result = await POST(requestObject);
        responseData = await result.json();
      } else {
        // Call the handler directly without request data
        // Create an empty request to satisfy the function signature
        const emptyRequest = new Request(`http://localhost${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const result = await POST(emptyRequest);
        responseData = await result.json();
      }
    } else {
      // Get the full URL for the API call
      const fullUrl = await constructApiUrl(endpoint);
      console.log(`Making API call to: ${fullUrl}`);
      
      try {
        // Build request options
        const requestOptions: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          ...(isVercel ? { next: { revalidate: 0 } } : {})
        };
        
        // Add body if we have request data
        if (requestData) {
          requestOptions.body = JSON.stringify(requestData);
          console.log('Request body:', JSON.stringify(requestData));
        }
        
        // Make the API call
        const response = await fetch(fullUrl, requestOptions);
        console.log('Response received - status:', response.status, response.statusText);
        
        // Handle the response
        responseData = await handleApiResponse(response);
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
    
    // Revalidate the page to show updated data
    revalidatePath(pathToRevalidate);
    
    return {
      success: responseData.success || true,
      message: responseData.message || 'Operation completed successfully',
      count: responseData.count || 0,
    };
  } catch (error) {
    console.error('Error in sync operation:', error);
    return {
      success: false,
      message: 'Operation failed: ' + (error as Error).message,
      count: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Server action to sync products from Shopify
 * Uses Next.js Server Actions for secure server-side execution
 */
export async function syncProductsAction(): Promise<SyncResponse> {
  const endpoint = process.env.NEXT_PUBLIC_PRODUCTS_API_ENDPOINT || '/api/shopify/products/sync';
  return callShopifySync(endpoint, null, '/products');
}

/**
 * Server action to sync orders from Shopify for a specific date range
 * Uses Next.js Server Actions for secure server-side execution
 */
export async function syncOrdersAction(startDate: string, endDate: string): Promise<SyncResponse> {
  const endpoint = process.env.NEXT_PUBLIC_ORDERS_API_ENDPOINT || '/api/shopify/orders/sync';
  return callShopifySync(endpoint, { startDate, endDate }, '/orders');
}

/**
 * Function to sync Shopify products
 * @deprecated Use syncProductsAction instead
 */
export async function syncProducts() {
  console.warn('syncProducts is deprecated. Use syncProductsAction instead.');
  return syncProductsAction();
}

/**
 * Function to sync Shopify orders
 * @param {string} startDate - Optional start date for order sync (YYYY-MM-DD)
 * @param {string} endDate - Optional end date for order sync (YYYY-MM-DD)
 * @deprecated Use syncOrdersAction instead
 */
export async function syncOrders(startDate?: string, endDate?: string) {
  console.warn('syncOrders is deprecated. Use syncOrdersAction instead.');
  if (startDate && endDate) {
    return syncOrdersAction(startDate, endDate);
  }
  
  // If dates are missing, call with empty strings to let the backend use defaults
  return syncOrdersAction(startDate || '', endDate || '');
} 