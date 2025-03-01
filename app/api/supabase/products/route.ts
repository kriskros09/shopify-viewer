import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../lib/supabase/admin';

// Define interfaces to type the data
interface ProductVariant {
  id: string;
  shopifyId: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  sku: string;
  inventoryQuantity: number;
  weight: number;
  weightUnit: string;
}

interface ProductImage {
  id: string;
  shopifyId: string;
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

interface Product {
  id: string;
  shopifyId: string;
  title: string;
  description: string;
  handle: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalInventory: number;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: ProductVariant[];
  images: ProductImage[];
  syncedAt: string;
}

export async function GET(request: Request) {
  try {
    console.log('Products API called');
    console.log('Service role key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'title';
    const order = searchParams.get('order') || 'asc';
    
    console.log('Search params:', { page, limit, search, sort, order });
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // First check if products table has any data at all
    console.log('Checking product count...');
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error getting product count:', countError);
    } else {
      console.log(`Total products in database: ${totalCount}`);
    }
    
    // Build query for products
    console.log('Building query for products...');
    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' });
      
    // Add search if provided
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    
    // Add sorting
    if (sort && order) {
      query = query.order(sort, { ascending: order === 'asc' });
    }
    
    // Add pagination
    query = query.range(from, to);
    
    // Execute query
    console.log('Executing product query...');
    const { data: productsData, count, error: productsError } = await query;
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }
    
    console.log(`Retrieved ${productsData?.length || 0} products`);

    // Format products and collect IDs for additional queries
    const productIds = productsData?.map(product => product.id) || [];
    
    // Format the response while we fetch additional data
    const products: Product[] = productsData?.map(product => {
      return {
        id: product.id,
        shopifyId: product.shopify_id,
        title: product.title,
        description: product.description,
        handle: product.handle,
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        totalInventory: product.total_inventory,
        priceRange: {
          minVariantPrice: {
            amount: product.price_min.toString(),
            currencyCode: product.currency_code,
          },
          maxVariantPrice: {
            amount: product.price_max.toString(),
            currencyCode: product.currency_code,
          },
        },
        variants: [],
        images: [],
        syncedAt: product.synced_at,
      };
    }) || [];
    
    // Only fetch variants and images if we have products
    if (productIds.length > 0) {
      // Fetch variants for these products
      console.log('Fetching variants for products...');
      const { data: variantsData, error: variantsError } = await supabaseAdmin
        .from('product_variants')
        .select('*')
        .in('product_id', productIds);
        
      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
      } else {
        console.log(`Retrieved ${variantsData?.length || 0} variants`);
        
        // Add variants to products
        variantsData?.forEach(variant => {
          const product = products.find(p => p.id === variant.product_id);
          if (product) {
            const productVariant: ProductVariant = {
              id: variant.id,
              shopifyId: variant.shopify_id,
              title: variant.title,
              price: {
                amount: variant.price.toString(),
                currencyCode: products.find(p => p.id === variant.product_id)?.priceRange.minVariantPrice.currencyCode || 'USD',
              },
              sku: variant.sku,
              inventoryQuantity: variant.inventory_quantity,
              weight: variant.weight,
              weightUnit: variant.weight_unit,
            };
            product.variants.push(productVariant);
          }
        });
      }
      
      // Fetch images for these products
      console.log('Fetching images for products...');
      const { data: imagesData, error: imagesError } = await supabaseAdmin
        .from('product_images')
        .select('*')
        .in('product_id', productIds);
        
      if (imagesError) {
        console.error('Error fetching images:', imagesError);
      } else {
        console.log(`Retrieved ${imagesData?.length || 0} images`);
        
        // Add images to products
        imagesData?.forEach(image => {
          const product = products.find(p => p.id === image.product_id);
          if (product) {
            const productImage: ProductImage = {
              id: image.id,
              shopifyId: image.shopify_id,
              url: image.url,
              altText: image.alt_text,
              width: image.width,
              height: image.height,
            };
            product.images.push(productImage);
          }
        });
      }
    }
    
    console.log('Products API completed successfully');
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch products', 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 