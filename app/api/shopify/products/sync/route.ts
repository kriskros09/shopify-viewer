import { NextResponse } from 'next/server';
import { fetchShopifyProducts } from '../../../../../lib/shopify/client';
import supabaseAdmin from '../../../../../lib/supabase/admin';
import { ShopifyProduct } from '../../../../../types/shopify';
import { 
  Product, 
  ProductVariant, 
  ProductImage,
  safeString, 
  safeNumber, 
  safeDate 
} from '../../../../../lib/supabase/database-types';

export async function POST() {
  try {
    console.log('Starting product sync process...');
    
    // Check if products table exists
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      console.error('Error accessing products table:', productsError);
      return NextResponse.json(
        {
          success: false,
          message: 'Products table does not exist or has incorrect structure',
          error: productsError.message
        },
        { status: 500 }
      );
    }
    
    console.log(`Products table exists, found ${products?.length || 0} existing products`);

    // Fetch all products from Shopify
    let allProducts: ShopifyProduct[] = [];
    let hasNextPage = true;
    let cursor: string | undefined = undefined;
    
    console.log('Fetching products from Shopify...');
    while (hasNextPage) {
      console.log(`Fetching products batch with cursor: ${cursor || 'initial'}`);
      const result = await fetchShopifyProducts(50, cursor);
      allProducts = [...allProducts, ...result.products];
      
      hasNextPage = result.pageInfo.hasNextPage;
      cursor = result.pageInfo.endCursor || undefined;
      
      console.log(`Fetched ${result.products.length} products, total now: ${allProducts.length}`);
      
      // Add a small delay to avoid hitting rate limits
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Successfully fetched ${allProducts.length} products from Shopify`);
    
    // Get the current date as ISO string for synced_at field
    const syncedAt = new Date().toISOString();
    let syncedCount = 0;
    
    // Process products one by one
    for (const product of allProducts) {
      console.log(`Processing product: ${product.title} (${product.id})`);
      
      // We need to ensure required fields exist
      if (!product.id || !product.title) {
        console.error('Product missing required fields (id, title):', product);
        continue; // Skip this product but continue with others
      }
      
      // Directly create an object with only the fields that exist in the database
      const formattedProduct: Partial<Product> = {
        shopify_id: product.id, // Required field
        title: product.title, // Required field
        description: safeString(product.description),
        handle: safeString(product.handle),
        status: safeString(product.status),
        created_at: safeDate(product.createdAt),
        updated_at: safeDate(product.updatedAt),
        total_inventory: safeNumber(product.totalInventory),
        price_min: safeNumber(product.priceRange?.minVariantPrice?.amount),
        price_max: safeNumber(product.priceRange?.maxVariantPrice?.amount),
        currency_code: safeString(product.priceRange?.minVariantPrice?.currencyCode),
        synced_at: syncedAt,
      };
      
      // First check if product already exists
      const { data: existingProduct, error: checkError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('shopify_id', product.id)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking for existing product:', checkError);
        continue; // Skip this product but continue with others
      }
      
      let productId: string;
      
      if (existingProduct) {
        // Update existing product
        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update(formattedProduct)
          .eq('id', existingProduct.id);
          
        if (updateError) {
          console.error('Error updating product:', updateError);
          continue; // Skip this product but continue with others
        }
        
        console.log(`Updated product: ${product.title}`);
        productId = existingProduct.id;
      } else {
        // Insert new product
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('products')
          .insert(formattedProduct)
          .select();
          
        if (insertError) {
          console.error('Error inserting product:', insertError);
          continue; // Skip this product but continue with others
        }
        
        if (!insertData || insertData.length === 0) {
          console.error('Product was inserted but no data was returned');
          continue; // Skip this product but continue with others
        }
        
        console.log(`Inserted product: ${product.title}`);
        productId = insertData[0].id;
      }
      
      syncedCount++;
      
      // Process variants
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          // Skip variants missing required fields
          if (!variant.id) {
            console.warn('Variant missing required fields (id):', variant);
            continue;
          }
          
          // Check if variant exists
          const { data: existingVariant } = await supabaseAdmin
            .from('product_variants')
            .select('id')
            .eq('shopify_id', variant.id)
            .maybeSingle();
            
          // Create object with only fields that exist in the database
          const formattedVariant: Partial<ProductVariant> = {
            product_id: productId,
            shopify_id: variant.id, // Required field
            title: safeString(variant.title),
            price: safeNumber(variant.price?.amount), // Required field with NOT NULL constraint
            sku: safeString(variant.sku),
            inventory_quantity: safeNumber(variant.inventoryQuantity),
            weight: safeNumber(variant.weight),
            weight_unit: safeString(variant.weightUnit),
            // Note: synced_at is not included as it doesn't exist in the database
          };
          
          if (existingVariant) {
            // Update variant
            const { error: updateError } = await supabaseAdmin
              .from('product_variants')
              .update(formattedVariant)
              .eq('id', existingVariant.id);
              
            if (updateError) {
              console.error('Error updating variant:', updateError);
            }
          } else {
            // Insert variant
            const { error: insertError } = await supabaseAdmin
              .from('product_variants')
              .insert(formattedVariant);
              
            if (insertError) {
              console.error('Error inserting variant:', insertError);
            }
          }
        }
      }
      
      // Process images
      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          // Skip images missing required fields
          if (!image.id) {
            console.warn('Image missing required fields (id):', image);
            continue;
          }
          
          // Check if image exists
          const { data: existingImage } = await supabaseAdmin
            .from('product_images')
            .select('id')
            .eq('shopify_id', image.id)
            .maybeSingle();
            
          // Create object with only fields that exist in the database
          const formattedImage: Partial<ProductImage> = {
            product_id: productId,
            shopify_id: image.id, // Required field
            url: safeString(image.url),
            alt_text: safeString(image.altText),
            width: safeNumber(image.width),
            height: safeNumber(image.height),
            // Note: synced_at is not included as it doesn't exist in the database
          };
          
          if (existingImage) {
            // Update image
            const { error: updateError } = await supabaseAdmin
              .from('product_images')
              .update(formattedImage)
              .eq('id', existingImage.id);
              
            if (updateError) {
              console.error('Error updating image:', updateError);
            }
          } else {
            // Insert image
            const { error: insertError } = await supabaseAdmin
              .from('product_images')
              .insert(formattedImage);
              
            if (insertError) {
              console.error('Error inserting image:', insertError);
            }
          }
        }
      }
    }
    
    // Check final product count in database
    const { data: finalCountData, error: finalCountError } = await supabaseAdmin
      .from('products')
      .select('id');
      
    const finalCount = finalCountError ? 'Error counting' : finalCountData?.length || 0;
    
    console.log(`Sync complete. Total products in database: ${finalCount}`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} of ${allProducts.length} products`,
      count: allProducts.length,
      syncedCount: syncedCount,
      databaseCount: finalCount
    });
    
  } catch (error) {
    console.error('Error syncing products:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync products', 
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