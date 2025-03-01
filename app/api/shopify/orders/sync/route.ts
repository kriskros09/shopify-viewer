import { NextResponse } from 'next/server';
import { fetchShopifyOrders } from '../../../../../lib/shopify/client';
import supabaseAdmin from '../../../../../lib/supabase/admin';
import { ShopifyOrder } from '../../../../../types/shopify';
import { 
  Order, 
  Customer, 
  Address, 
  LineItem,
  safeString, 
  safeNumber, 
  safeDate 
} from '../../../../../lib/supabase/database-types';

export async function POST(request: Request) {
  try {
    const { startDate, endDate } = await request.json();
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'startDate and endDate are required' },
        { status: 400 }
      );
    }
    
    console.log(`Starting order sync process for period: ${startDate} to ${endDate}`);
    
    // Query for orders within the date range
    const query = `processed_at:>=${startDate} processed_at:<=${endDate}`;
    
    let allOrders: ShopifyOrder[] = [];
    let hasNextPage = true;
    let cursor: string | undefined = undefined;
    
    // Fetch all orders using pagination
    console.log('Fetching orders from Shopify...');
    while (hasNextPage) {
      console.log(`Fetching orders batch with cursor: ${cursor || 'initial'}`);
      const result = await fetchShopifyOrders(50, cursor, query);
      allOrders = [...allOrders, ...result.orders];

      console.log('result', result);
      console.log('all orders', allOrders);
      
      hasNextPage = result.pageInfo.hasNextPage;
      cursor = result.pageInfo.endCursor || undefined;
      
      console.log(`Fetched ${result.orders.length} orders, total now: ${allOrders.length}`);
      
      // Add a small delay to avoid hitting rate limits
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Successfully fetched ${allOrders.length} orders from Shopify`);
    
    // Get the current date as ISO string for synced_at field
    const syncedAt = new Date().toISOString();
    let syncedCount = 0;
    
    // Process orders one by one
    for (const order of allOrders) {
      console.log(`Processing order: ${order.name} (${order.id})`);
      
      // Skip orders missing required fields
      if (!order.id || !order.name || !order.processedAt) {
        console.error('Order missing required fields (id, name, processedAt):', order);
        continue; // Skip this order but continue with others
      }
      
      // Validate and ensure required fields have values
      const totalPrice = safeNumber(order.totalPrice?.amount);
      const subtotalPrice = safeNumber(order.subtotalPrice?.amount);
      
      // Create order data with only the fields that exist in the database
      const formattedOrder: Partial<Order> = {
        shopify_id: order.id,
        name: order.name, // Required field
        email: safeString(order.email),
        phone: safeString(order.phone),
        processed_at: order.processedAt, // Required field
        total_price: totalPrice, // Required field
        subtotal_price: subtotalPrice, // Required field
        tax_price: safeNumber(order.taxPrice?.amount),
        shipping_price: safeNumber(order.totalShippingPrice?.amount),
        currency_code: safeString(order.totalPrice?.currencyCode, 'USD'),
        financial_status: safeString(order.displayFinancialStatus, 'UNKNOWN'),
        fulfillment_status: safeString(order.displayFulfillmentStatus, 'UNKNOWN'),
        synced_at: syncedAt, // Required field
        created_at: safeDate(new Date()),
        updated_at: safeDate(new Date()),
        // Note: note, some might not included as they don't exist in the database
      };
      
      // Check if order already exists
      const { data: existingOrder, error: orderCheckError } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('shopify_id', order.id)
        .maybeSingle();
        
      if (orderCheckError) {
        console.error('Error checking for existing order:', orderCheckError);
        continue; // Skip this order but continue with others
      }
      
      let orderId: string;
      
      if (existingOrder) {
        // Update existing order
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update(formattedOrder)
          .eq('id', existingOrder.id);
          
        if (updateError) {
          console.error('Error updating order:', updateError);
          continue; // Skip this order but continue with others
        }
        
        console.log(`Updated order: ${order.name}`);
        orderId = existingOrder.id;
      } else {
        // Insert new order
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('orders')
          .insert(formattedOrder)
          .select();
          
        if (insertError) {
          console.error('Error inserting order:', insertError);
          continue; // Skip this order but continue with others
        }
        
        if (!insertData || insertData.length === 0) {
          console.error('Order was inserted but no data was returned');
          continue; // Skip this order but continue with others
        }
        
        console.log(`Inserted order: ${order.name}`);
        orderId = insertData[0].id;
      }
      
      syncedCount++;
      
      // Process customer if exists
      if (order.customer && order.customer.id) {
        // Create customer data with only the fields that exist in the database
        const formattedCustomer: Partial<Customer> = {
          shopify_id: order.customer.id,
          first_name: safeString(order.customer.firstName),
          last_name: safeString(order.customer.lastName),
          email: safeString(order.customer.email),
          phone: safeString(order.customer.phone)
        };
        
        // Check if customer already exists
        const { data: existingCustomer, error: customerCheckError } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('shopify_id', order.customer.id)
          .maybeSingle();
          
        if (customerCheckError) {
          console.error('Error checking for existing customer:', customerCheckError);
          continue; // Skip this customer but continue with the order processing
        }
        
        let customerId: string | undefined = undefined;
        
        if (existingCustomer) {
          // Update existing customer
          const { error: updateError } = await supabaseAdmin
            .from('customers')
            .update(formattedCustomer)
            .eq('id', existingCustomer.id);
            
          if (updateError) {
            console.error('Error updating customer:', updateError);
          } else {
            customerId = existingCustomer.id;
          }
        } else {
          // Insert new customer
          const { data: insertData, error: insertError } = await supabaseAdmin
            .from('customers')
            .insert(formattedCustomer)
            .select();
            
          if (insertError) {
            console.error('Error inserting customer:', insertError);
          } else if (insertData && insertData.length > 0) {
            customerId = insertData[0].id;
          }
        }
        
        // Only process addresses if we have a valid customer ID
        if (customerId) {
          // Process shipping address if exists
          if (order.shippingAddress) {
            // Create shipping address data with only the fields that exist in the database
            const formattedShippingAddress: Partial<Address> = {
              order_id: orderId,
              customer_id: customerId,
              address_type: 'shipping',
              address1: safeString(order.shippingAddress.address1),
              address2: safeString(order.shippingAddress.address2),
              city: safeString(order.shippingAddress.city),
              province: safeString(order.shippingAddress.province, ''),
              zip: safeString(order.shippingAddress.zip),
              country: safeString(order.shippingAddress.country),
              name: safeString(order.shippingAddress.name),
              phone: safeString(order.shippingAddress.phone)
            };
            
            // Check if shipping address already exists
            const { data: existingAddress, error } = await supabaseAdmin
              .from('addresses')
              .select('id')
              .eq('order_id', orderId)
              .eq('address_type', 'shipping')
              .maybeSingle();
              
            if (error) {
              console.error('Error checking for existing shipping address:', error);
            }
            
            if (existingAddress) {
              // Update shipping address
              const { error: updateError } = await supabaseAdmin
                .from('addresses')
                .update(formattedShippingAddress)
                .eq('id', existingAddress.id);
                
              if (updateError) {
                console.error('Error updating shipping address:', updateError);
              }
            } else {
              // Insert shipping address
              const { error: insertError } = await supabaseAdmin
                .from('addresses')
                .insert(formattedShippingAddress);
                
              if (insertError) {
                console.error('Error inserting shipping address:', insertError);
              }
            }
          }
          
          // Process billing address if exists
          if (order.billingAddress) {
            // Create billing address data with only the fields that exist in the database
            const formattedBillingAddress: Partial<Address> = {
              order_id: orderId,
              customer_id: customerId,
              address_type: 'billing',
              address1: safeString(order.billingAddress.address1),
              address2: safeString(order.billingAddress.address2),
              city: safeString(order.billingAddress.city),
              province: safeString(order.billingAddress.province, ''),
              zip: safeString(order.billingAddress.zip),
              country: safeString(order.billingAddress.country),
              name: safeString(order.billingAddress.name),
              phone: safeString(order.billingAddress.phone)
            };
            
            // Check if billing address already exists
            const { data: existingAddress, error } = await supabaseAdmin
              .from('addresses')
              .select('id')
              .eq('order_id', orderId)
              .eq('address_type', 'billing')
              .maybeSingle();
              
            if (error) {
              console.error('Error checking for existing billing address:', error);
            }
            
            if (existingAddress) {
              // Update billing address
              const { error: updateError } = await supabaseAdmin
                .from('addresses')
                .update(formattedBillingAddress)
                .eq('id', existingAddress.id);
                
              if (updateError) {
                console.error('Error updating billing address:', updateError);
              }
            } else {
              // Insert billing address
              const { error: insertError } = await supabaseAdmin
                .from('addresses')
                .insert(formattedBillingAddress);
                
              if (insertError) {
                console.error('Error inserting billing address:', insertError);
              }
            }
          }
        }
      }
      
      // Process line items
      if (order.lineItems && order.lineItems.length > 0) {
        for (const lineItem of order.lineItems) {
          // Skip line items missing required fields
          if (!lineItem.id) {
            console.warn('Line item missing required fields (id):', lineItem);
            continue;
          }
          
          // First, look up the internal product UUID if we have a product ID
          let productId = undefined;
          if (lineItem.variant?.product?.id) {
            const { data: productData, error: productError } = await supabaseAdmin
              .from('products')
              .select('id')
              .eq('shopify_id', lineItem.variant.product.id)
              .maybeSingle();
              
            if (productError) {
              console.error('Error looking up product:', productError);
            } else if (productData) {
              productId = productData.id;
            }
          }
          
          // Next, look up the internal variant UUID if we have a variant ID
          let variantId = undefined;
          if (lineItem.variant?.id) {
            const { data: variantData, error: variantError } = await supabaseAdmin
              .from('product_variants')
              .select('id')
              .eq('shopify_id', lineItem.variant.id)
              .maybeSingle();
              
            if (variantError) {
              console.error('Error looking up variant:', variantError);
            } else if (variantData) {
              variantId = variantData.id;
            }
          }
          
          // Create line item data with only the fields that exist in the database
          const formattedLineItem: Partial<LineItem> = {
            order_id: orderId,
            shopify_id: lineItem.id,
            title: safeString(lineItem.title),
            quantity: safeNumber(lineItem.quantity),
            price: safeNumber(lineItem.variant?.price?.amount),
            currency_code: safeString(lineItem.variant?.price?.currencyCode || order.totalPrice?.currencyCode, 'USD'),
            product_id: productId,
            variant_id: variantId,
          };
          
          // Check if line item already exists
          const { data: existingLineItem, error } = await supabaseAdmin
            .from('line_items')
            .select('id')
            .eq('shopify_id', lineItem.id)
            .maybeSingle();
            
          if (error) {
            console.error('Error checking for existing line item:', error);
          }
          
          if (existingLineItem) {
            // Update line item
            const { error: updateError } = await supabaseAdmin
              .from('line_items')
              .update(formattedLineItem)
              .eq('id', existingLineItem.id);
              
            if (updateError) {
              console.error('Error updating line item:', updateError);
            }
          } else {
            // Insert line item
            const { error: insertError } = await supabaseAdmin
              .from('line_items')
              .insert(formattedLineItem);
              
            if (insertError) {
              console.error('Error inserting line item:', insertError);
            }
          }
        }
      }
    }
    
    // Check final order count in database for the date range
    const { data: finalCountData, error: finalCountError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .gte('processed_at', startDate)
      .lte('processed_at', endDate);
      
    const finalCount = finalCountError ? 'Error counting' : finalCountData?.length || 0;
    
    console.log(`Sync complete. Total orders in database for period: ${finalCount}`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} of ${allOrders.length} orders`,
      count: allOrders.length,
      syncedCount: syncedCount,
      databaseCount: finalCount,
      period: { startDate, endDate },
    });
    
  } catch (error) {
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync orders', 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'This endpoint only accepts POST requests',
  }, { status: 405 });
} 