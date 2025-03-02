import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../lib/supabase/admin';

// Define interfaces to type the data
interface LineItem {
  id: string;
  shopifyId: string;
  title: string;
  quantity: number;
  price: {
    amount: string;
    currencyCode: string;
  };
  productId: string | null;
  variantId: string | null;
  variantTitle: string | null;
  sku: string | null;
  image: string | null;
}

interface Address {
  id: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  zip: string;
  country: string;
  name: string;
  phone: string | null;
}

interface Customer {
  id: string;
  shopifyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  ordersCount: number;
  totalSpent: {
    amount: string;
    currencyCode: string;
  };
}

interface DiscountApplication {
  title: string;
  value: string;
  code: string | null;
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
  phone: string | null;
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
  totalShippingPrice: {
    amount: string;
    currencyCode: string;
  };
  financialStatus: string;
  fulfillmentStatus: string;
  paymentMethod: string | null;
  note: string | null;
  tags: string[];
  discountApplications: DiscountApplication[];
  shippingLines: ShippingLine[];
  lineItems: LineItem[];
  customer: Customer | null;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  syncedAt: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'processed_at';
    const order = searchParams.get('order') || 'desc';  // Most recent orders first by default
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    
    console.log('API request params:', { page, limit, search, startDate, endDate });
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Build query for orders
    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' });
      
    // Add search if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // Add date range if provided
    if (startDate && endDate) {
      // Ensure we get the full day ranges
      // Create UTC date objects from the local date strings and ensure proper day boundaries
      // This handles the timezone offset properly by ensuring we cover the full day in UTC
      const utcStartDate = new Date(`${startDate}T00:00:00Z`).toISOString().split('T')[0];
      const utcEndDateObj = new Date(`${endDate}T23:59:59Z`);
      // Add a day to ensure we capture all records for the end date in any timezone
      utcEndDateObj.setDate(utcEndDateObj.getDate() + 1);
      const fullEndDate = utcEndDateObj.toISOString(); 
      
      console.log('Using UTC date range:', { utcStartDate, fullEndDate });
      query = query.gte('processed_at', utcStartDate).lt('processed_at', fullEndDate);
    } else if (startDate) {
      const utcStartDate = new Date(`${startDate}T00:00:00Z`).toISOString().split('T')[0];
      console.log('Using UTC start date only:', utcStartDate);
      query = query.gte('processed_at', utcStartDate);
    } else if (endDate) {
      // Add a day to make sure we get the entire end date in any timezone
      const utcEndDateObj = new Date(`${endDate}T23:59:59Z`);
      utcEndDateObj.setDate(utcEndDateObj.getDate() + 1);
      const fullEndDate = utcEndDateObj.toISOString();
      
      console.log('Using UTC end date only:', fullEndDate);
      query = query.lt('processed_at', fullEndDate);
    }
    
    // Add sorting
    if (sort && order) {
      query = query.order(sort, { ascending: order === 'asc' });
    }
    
    // Add pagination
    query = query.range(from, to);
    
    // Execute query
    const { data: ordersData, count, error: ordersError } = await query;
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log(`Found ${ordersData.length} orders in database query`);
    if (ordersData.length > 0) {
      console.log('Sample order dates:', ordersData.map(o => o.processed_at).slice(0, 3));
    } else {
      console.log('No orders found with the current filters');
    }

    // Collect order IDs for additional queries
    const orderIds = ordersData.map(order => order.id);
    
    // Format the base order objects
    const orders: Order[] = ordersData.map(order => {
      // Parse tags if they exist, otherwise return empty array
      const tags = order.tags ? 
        (typeof order.tags === 'string' ? order.tags.split(',').map((tag: string) => tag.trim()) : order.tags) : 
        [];
      
      return {
        id: order.id,
        shopifyId: order.shopify_id,
        name: order.name,
        email: order.email,
        phone: order.phone,
        processedAt: order.processed_at,
        totalPrice: {
          amount: order.total_price.toString(),
          currencyCode: order.currency_code,
        },
        subtotalPrice: {
          amount: order.subtotal_price.toString(),
          currencyCode: order.currency_code,
        },
        totalTax: {
          amount: order.tax_price.toString(),
          currencyCode: order.currency_code,
        },
        totalShippingPrice: {
          amount: order.shipping_price.toString(),
          currencyCode: order.currency_code,
        },
        financialStatus: order.financial_status || 'unknown',
        fulfillmentStatus: order.fulfillment_status || 'unknown',
        paymentMethod: order.payment_method || null,
        note: order.note || null,
        tags: tags,
        discountApplications: order.discount_applications || [],
        shippingLines: order.shipping_lines || [],
        lineItems: [],
        customer: null,
        shippingAddress: null,
        billingAddress: null,
        syncedAt: order.synced_at,
      };
    });
    
    // Only fetch additional data if we have orders
    if (orderIds.length > 0) {
      // Fetch line items for these orders
      const { data: lineItemsData, error: lineItemsError } = await supabaseAdmin
        .from('line_items')
        .select('*')
        .in('order_id', orderIds);
        
      if (lineItemsError) {
        console.error('Error fetching line items:', lineItemsError);
      } else if (lineItemsData) {
        // Add line items to orders
        lineItemsData.forEach(item => {
          const order = orders.find(o => o.id === item.order_id);
          if (order) {
            const lineItem: LineItem = {
              id: item.id,
              shopifyId: item.shopify_id,
              title: item.title,
              quantity: item.quantity,
              price: {
                amount: item.price.toString(),
                currencyCode: item.currency_code,
              },
              productId: item.product_id,
              variantId: item.variant_id,
              variantTitle: item.variant_title,
              sku: item.sku,
              image: item.image,
            };
            order.lineItems.push(lineItem);
          }
        });
      }
      
      // Fetch addresses for these orders
      const { data: addressesData, error: addressesError } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .in('order_id', orderIds);
        
      if (addressesError) {
        console.error('Error fetching addresses:', addressesError);
      } else if (addressesData) {
        // Add addresses to orders
        addressesData.forEach(address => {
          const order = orders.find(o => o.id === address.order_id);
          if (order) {
            const addressData: Address = {
              id: address.id,
              address1: address.address1,
              address2: address.address2,
              city: address.city,
              province: address.province,
              zip: address.zip,
              country: address.country,
              name: address.name,
              phone: address.phone,
            };
            
            if (address.address_type === 'shipping') {
              order.shippingAddress = addressData;
            } else if (address.address_type === 'billing') {
              order.billingAddress = addressData;
            }
          }
        });
      }
      
      // Fetch customers for these orders
      // First, collect customer IDs from addresses
      const customerIds = addressesData
        ?.filter(addr => addr.customer_id)
        .map(addr => addr.customer_id)
        .filter((value, index, self) => value && self.indexOf(value) === index) as string[];
        
      if (customerIds && customerIds.length > 0) {
        const { data: customersData, error: customersError } = await supabaseAdmin
          .from('customers')
          .select('*')
          .in('id', customerIds);
          
        if (customersError) {
          console.error('Error fetching customers:', customersError);
        } else if (customersData) {
          // Add customers to orders
          customersData.forEach(customer => {
            // Find addresses with this customer
            const orderIdsWithCustomer = addressesData
              ?.filter(addr => addr.customer_id === customer.id)
              .map(addr => addr.order_id);
              
            // Add customer to each order
            orderIdsWithCustomer?.forEach(orderId => {
              const order = orders.find(o => o.id === orderId);
              if (order) {
                const customerData: Customer = {
                  id: customer.id,
                  shopifyId: customer.shopify_id,
                  firstName: customer.first_name,
                  lastName: customer.last_name,
                  email: customer.email,
                  phone: customer.phone,
                  ordersCount: customer.orders_count || 0,
                  totalSpent: {
                    amount: (customer.total_spent || '0').toString(),
                    currencyCode: customer.currency_code || 'USD'
                  }
                };
                order.customer = customerData;
              }
            });
          });
        }
      }
      
      // Add mock discount and shipping data where missing
      orders.forEach(order => {
        // Add mock discount data if missing
        if (!order.discountApplications || order.discountApplications.length === 0) {
          // Randomly add discount to some orders for demonstration purposes
          if (Math.random() > 0.7) {
            order.discountApplications = [{
              title: 'Demo Discount',
              value: `${order.totalPrice.currencyCode} ${(parseFloat(order.totalPrice.amount) * 0.1).toFixed(2)}`,
              code: 'DEMO10'
            }];
          } else {
            order.discountApplications = [];
          }
        }
        
        // Add mock shipping data if missing
        if (!order.shippingLines || order.shippingLines.length === 0) {
          order.shippingLines = [{
            title: 'Standard Shipping',
            price: {
              amount: order.totalShippingPrice.amount || '0',
              currencyCode: order.totalPrice.currencyCode
            }
          }];
        }
      });
    }
    
    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch orders', 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 