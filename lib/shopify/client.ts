import { ShopifyProduct, ShopifyOrder } from '../../types/shopify';

const SHOPIFY_SHOP_NAME = process.env.SHOPIFY_SHOP_NAME;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_SHOP_NAME || !SHOPIFY_API_VERSION || !SHOPIFY_ACCESS_TOKEN) {
  throw new Error('Missing Shopify environment variables');
}

const SHOPIFY_ADMIN_API_URL = `https://${SHOPIFY_SHOP_NAME}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

/**
 * Makes a GraphQL request to the Shopify Admin API
 */
async function shopifyGraphqlRequest<T>(query: string, variables = {}): Promise<T> {
  try {
    const response = await fetch(SHOPIFY_ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN as string,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data.data as T;
  } catch (error) {
    console.error('Error making Shopify GraphQL request:', error);
    throw error;
  }
}

/**
 * Fetches products from Shopify
 */
export async function fetchShopifyProducts(first = 50, after?: string): Promise<{
  products: ShopifyProduct[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}> {
  const query = `
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges {
          node {
            id
            title
            description
            handle
            status
            createdAt
            updatedAt
            totalInventory
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  inventoryQuantity
                  weight
                  weightUnit
                }
              }
            }
            images(first: 10) {
              edges {
                node {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables = {
    first,
    after,
  };

  type ShopifyProductResponse = {
    products: {
      edges: Array<{
        node: any;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };

  const data = await shopifyGraphqlRequest<ShopifyProductResponse>(query, variables);

  // Transform the response into our ShopifyProduct interface
  const products = data.products.edges.map(({ node }) => {
    return {
      id: node.id,
      title: node.title,
      description: node.description,
      handle: node.handle,
      status: node.status,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      totalInventory: node.totalInventory,
      variants: node.variants.edges.map(({ node: variantNode }: any) => ({
        id: variantNode.id,
        title: variantNode.title,
        price: {
          amount: variantNode.price,
          currencyCode: 'USD' // Default currency code since it's not available as a separate field
        },
        sku: variantNode.sku,
        inventoryQuantity: variantNode.inventoryQuantity,
        weight: variantNode.weight,
        weightUnit: variantNode.weightUnit,
      })),
      images: node.images.edges.map(({ node: imageNode }: any) => ({
        id: imageNode.id,
        url: imageNode.url,
        altText: imageNode.altText,
        width: imageNode.width,
        height: imageNode.height,
      })),
      priceRange: node.priceRange,
    };
  });

  return {
    products,
    pageInfo: data.products.pageInfo,
  };
}

/**
 * Fetches orders from Shopify within a given date range
 */
export async function fetchShopifyOrders(
  first = 50,
  after?: string,
  query?: string
): Promise<{
  orders: ShopifyOrder[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}> {
  const gqlQuery = `
    query GetOrders($first: Int!, $after: String, $query: String) {
      orders(first: $first, after: $after, query: $query) {
        edges {
          node {
            id
            name
            email
            phone
            processedAt
            totalPrice
            subtotalPrice
            totalTax
            totalShippingPrice
            displayFinancialStatus
            displayFulfillmentStatus
            note
            tags
            customer {
              id
              firstName
              lastName
              email
              phone
            }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    title
                    price
                    product {
                      id
                      title
                    }
                  }
                }
              }
            }
            shippingAddress {
              address1
              address2
              city
              province
              zip
              country
              name
              phone
            }
            billingAddress {
              address1
              address2
              city
              province
              zip
              country
              name
              phone
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables = {
    first,
    after,
    query,
  };

  type ShopifyOrderResponse = {
    orders: {
      edges: Array<{
        node: any;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };

  const data = await shopifyGraphqlRequest<ShopifyOrderResponse>(gqlQuery, variables);

  // Transform the response into our ShopifyOrder interface
  const orders = data.orders.edges.map(({ node }) => {
    return {
      id: node.id,
      name: node.name,
      email: node.email,
      phone: node.phone,
      processedAt: node.processedAt,
      totalPrice: {
        amount: node.totalPrice,
        currencyCode: 'USD'
      },
      subtotalPrice: {
        amount: node.subtotalPrice,
        currencyCode: 'USD'
      },
      taxPrice: {
        amount: node.totalTax,
        currencyCode: 'USD'
      },
      totalShippingPrice: {
        amount: node.totalShippingPrice,
        currencyCode: 'USD'
      },
      displayFinancialStatus: node.displayFinancialStatus || 'UNKNOWN',
      displayFulfillmentStatus: node.displayFulfillmentStatus || 'UNKNOWN',
      paymentGateway: null,
      note: node.note || null,
      tags: node.tags || [],
      customer: {
        id: node.customer?.id || '',
        firstName: node.customer?.firstName || '',
        lastName: node.customer?.lastName || '',
        email: node.customer?.email || '',
        phone: node.customer?.phone || null,
      },
      lineItems: node.lineItems.edges.map(({ node: lineItemNode }: any) => ({
        id: lineItemNode.id,
        title: lineItemNode.title,
        quantity: lineItemNode.quantity,
        variant: lineItemNode.variant ? {
          id: lineItemNode.variant.id,
          title: lineItemNode.variant.title,
          price: {
            amount: lineItemNode.variant.price,
            currencyCode: 'USD' // Default currency code
          },
          product: lineItemNode.variant.product ? {
            id: lineItemNode.variant.product.id,
            title: lineItemNode.variant.product.title,
          } : {
            id: '',
            title: '',
          },
        } : {
          id: '',
          title: '',
          price: { amount: '0', currencyCode: 'USD' },
          product: { id: '', title: '' },
        },
      })),
      shippingAddress: node.shippingAddress ? {
        address1: node.shippingAddress.address1,
        address2: node.shippingAddress.address2,
        city: node.shippingAddress.city,
        province: node.shippingAddress.province,
        zip: node.shippingAddress.zip,
        country: node.shippingAddress.country,
        name: node.shippingAddress.name,
        phone: node.shippingAddress.phone,
      } : null,
      billingAddress: node.billingAddress ? {
        address1: node.billingAddress.address1,
        address2: node.billingAddress.address2,
        city: node.billingAddress.city,
        province: node.billingAddress.province,
        zip: node.billingAddress.zip,
        country: node.billingAddress.country,
        name: node.billingAddress.name,
        phone: node.billingAddress.phone,
      } : null,
    };
  });

  return {
    orders,
    pageInfo: data.orders.pageInfo,
  };
}

/**
 * Calculates sales data for a given date range
 */
export async function getShopifySalesData(startDate: string, endDate: string) {
  // Query for orders within the date range
  const query = `processed_at:>=${startDate} processed_at:<=${endDate}`;
  
  let allOrders: ShopifyOrder[] = [];
  let hasNextPage = true;
  let cursor: string | undefined = undefined;
  
  // Fetch all orders using pagination
  while (hasNextPage) {
    const result = await fetchShopifyOrders(50, cursor, query);
    allOrders = [...allOrders, ...result.orders];
    
    hasNextPage = result.pageInfo.hasNextPage;
    cursor = result.pageInfo.endCursor || undefined;
  }
  
  // Calculate total sales and average order value
  const totalOrders = allOrders.length;
  
  // Default to USD if no orders
  let currencyCode = 'USD';
  
  if (totalOrders > 0) {
    currencyCode = allOrders[0].totalPrice.currencyCode;
  }
  
  const totalSalesAmount = allOrders.reduce((sum, order) => {
    return sum + parseFloat(order.totalPrice.amount);
  }, 0);
  
  const averageOrderValue = totalOrders > 0 
    ? totalSalesAmount / totalOrders 
    : 0;
  
  return {
    totalOrders,
    totalSales: {
      amount: totalSalesAmount.toFixed(2),
      currencyCode,
    },
    averageOrderValue: {
      amount: averageOrderValue.toFixed(2),
      currencyCode,
    },
    period: {
      startDate,
      endDate,
    },
  };
} 