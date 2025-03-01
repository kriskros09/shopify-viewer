export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalInventory: number;
  variants: ShopifyProductVariant[];
  images: ShopifyImage[];
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
}

export interface ShopifyProductVariant {
  id: string;
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

export interface ShopifyImage {
  id: string;
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyDiscountApplication {
  title: string;
  value: {
    amount: string;
    currencyCode: string;
  };
  code: string | null;
}

export interface ShopifyShippingLine {
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
}

export interface ShopifyOrder {
  id: string;
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
  taxPrice: {
    amount: string;
    currencyCode: string;
  };
  totalShippingPrice: {
    amount: string;
    currencyCode: string;
  };
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  paymentGateway: string | null;
  note: string | null;
  tags: string[] | string; 
  discountApplications?: ShopifyDiscountApplication[];
  shippingLines?: ShopifyShippingLine[];
  customer: ShopifyCustomer;
  lineItems: ShopifyLineItem[];
  shippingAddress: ShopifyAddress | null;
  billingAddress: ShopifyAddress | null;
}

export interface ShopifyCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  ordersCount?: number;
  totalSpent?: {
    amount: string;
    currencyCode: string;
  };
}

export interface ShopifyLineItem {
  id: string;
  title: string;
  quantity: number;
  variant: {
    id: string;
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    sku?: string;
    image?: {
      url: string;
    };
    product: {
      id: string;
      title: string;
    };
  };
}

export interface ShopifyAddress {
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  zip: string;
  country: string;
  name: string;
  phone: string | null;
}

export interface ShopifySalesData {
  totalOrders: number;
  totalSales: {
    amount: string;
    currencyCode: string;
  };
  averageOrderValue: {
    amount: string;
    currencyCode: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
} 