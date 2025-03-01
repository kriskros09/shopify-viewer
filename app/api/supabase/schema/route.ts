import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../lib/supabase/admin';

interface SchemaInfo {
  exists: boolean;
  error?: string;
}

interface SchemaResult {
  [table: string]: SchemaInfo;
}

interface TableColumn {
  column_name: string;
  [key: string]: any;
}

interface UpdateResult {
  success: boolean;
  action?: string;
  error?: string | null;
}

interface UpdateResults {
  [table: string]: UpdateResult;
}

// This endpoint provides functionality to check and update the database schema
export async function GET() {
  try {
    // Query information about the database tables
    const tables = ['products', 'product_variants', 'product_images', 'orders', 'line_items'];
    const schema: SchemaResult = {};
    
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        schema[table] = { exists: false, error: error.message };
      } else {
        schema[table] = { exists: true };
      }
    }
    
    return NextResponse.json({ 
      schema,
      message: 'Schema information retrieved successfully'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to retrieve schema information',
      details: errorMessage
    }, { status: 500 });
  }
}

// Add synced_at column to tables if missing
export async function POST() {
  try {
    const updateResults: UpdateResults = {};
    
    // Check and update product_variants table
    try {
      // Check if synced_at column exists
      const { data: variantColumns, error: variantError } = await supabaseAdmin.rpc(
        'get_table_columns', 
        { table_name: 'product_variants' }
      );
      
      if (variantError) {
        updateResults.product_variants = { 
          success: false, 
          error: variantError.message 
        };
      } else {
        const hasSyncedAt = variantColumns ? 
          variantColumns.some((col: TableColumn) => col.column_name === 'synced_at') : 
          false;
        
        if (!hasSyncedAt) {
          // Add the missing column
          const { error: alterError } = await supabaseAdmin.rpc(
            'run_sql',
            { sql: 'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;' }
          );
          
          updateResults.product_variants = {
            success: !alterError,
            action: 'added synced_at column',
            error: alterError ? alterError.message : null
          };
        } else {
          updateResults.product_variants = {
            success: true,
            action: 'synced_at column already exists'
          };
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      updateResults.product_variants = { 
        success: false, 
        error: errorMessage
      };
    }
    
    // Check and update product_images table
    try {
      // Check if synced_at column exists
      const { data: imageColumns, error: imageError } = await supabaseAdmin.rpc(
        'get_table_columns', 
        { table_name: 'product_images' }
      );
      
      if (imageError) {
        updateResults.product_images = { 
          success: false, 
          error: imageError.message 
        };
      } else {
        const hasSyncedAt = imageColumns ? 
          imageColumns.some((col: TableColumn) => col.column_name === 'synced_at') : 
          false;
        
        if (!hasSyncedAt) {
          // Add the missing column
          const { error: alterError } = await supabaseAdmin.rpc(
            'run_sql',
            { sql: 'ALTER TABLE product_images ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;' }
          );
          
          updateResults.product_images = {
            success: !alterError,
            action: 'added synced_at column',
            error: alterError ? alterError.message : null
          };
        } else {
          updateResults.product_images = {
            success: true,
            action: 'synced_at column already exists'
          };
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      updateResults.product_images = { 
        success: false, 
        error: errorMessage
      };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Schema update operations completed',
      results: updateResults
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message: 'Failed to update schema',
      error: errorMessage
    }, { status: 500 });
  }
} 