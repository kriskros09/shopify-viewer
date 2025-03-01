export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          title: string
          description: string
          handle: string
          status: string
          created_at: string
          updated_at: string
          total_inventory: number
          price_min: number
          price_max: number
          currency_code: string
          shopify_id: string
          synced_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          handle: string
          status: string
          created_at: string
          updated_at: string
          total_inventory: number
          price_min: number
          price_max: number
          currency_code: string
          shopify_id: string
          synced_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          handle?: string
          status?: string
          created_at?: string
          updated_at?: string
          total_inventory?: number
          price_min?: number
          price_max?: number
          currency_code?: string
          shopify_id?: string
          synced_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          title: string
          price: number
          sku: string
          inventory_quantity: number
          weight: number
          weight_unit: string
          shopify_id: string
          synced_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title: string
          price: number
          sku: string
          inventory_quantity: number
          weight: number
          weight_unit: string
          shopify_id: string
          synced_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          price?: number
          sku?: string
          inventory_quantity?: number
          weight?: number
          weight_unit?: string
          shopify_id?: string
          synced_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt_text: string | null
          width: number
          height: number
          shopify_id: string
          synced_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          alt_text?: string | null
          width: number
          height: number
          shopify_id: string
          synced_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          alt_text?: string | null
          width?: number
          height?: number
          shopify_id?: string
          synced_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          processed_at: string
          total_price: number
          subtotal_price: number
          tax_price: number
          shipping_price: number
          currency_code: string
          financial_status: string
          fulfillment_status: string
          shopify_id: string
          synced_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          processed_at: string
          total_price: number
          subtotal_price: number
          tax_price: number
          shipping_price: number
          currency_code: string
          financial_status: string
          fulfillment_status: string
          shopify_id: string
          synced_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          processed_at?: string
          total_price?: number
          subtotal_price?: number
          tax_price?: number
          shipping_price?: number
          currency_code?: string
          financial_status?: string
          fulfillment_status?: string
          shopify_id?: string
          synced_at?: string
        }
      }
      line_items: {
        Row: {
          id: string
          order_id: string
          title: string
          quantity: number
          price: number
          currency_code: string
          product_id: string | null
          variant_id: string | null
          shopify_id: string
          synced_at: string
        }
        Insert: {
          id?: string
          order_id: string
          title: string
          quantity: number
          price: number
          currency_code: string
          product_id?: string | null
          variant_id?: string | null
          shopify_id: string
          synced_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          title?: string
          quantity?: number
          price?: number
          currency_code?: string
          product_id?: string | null
          variant_id?: string | null
          shopify_id?: string
          synced_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          shopify_id: string
          synced_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          shopify_id: string
          synced_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          shopify_id?: string
          synced_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          address1: string
          address2: string | null
          city: string
          province: string
          zip: string
          country: string
          name: string
          phone: string | null
          customer_id: string | null
          order_id: string | null
          address_type: 'shipping' | 'billing'
          synced_at: string
        }
        Insert: {
          id?: string
          address1: string
          address2?: string | null
          city: string
          province: string
          zip: string
          country: string
          name: string
          phone?: string | null
          customer_id?: string | null
          order_id?: string | null
          address_type: 'shipping' | 'billing'
          synced_at?: string
        }
        Update: {
          id?: string
          address1?: string
          address2?: string | null
          city?: string
          province?: string
          zip?: string
          country?: string
          name?: string
          phone?: string | null
          customer_id?: string | null
          order_id?: string | null
          address_type?: 'shipping' | 'billing'
          synced_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 