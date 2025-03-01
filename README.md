# Shopify Viewer

A Next.js application for viewing Shopify store data including orders, products, and analytics.

## Project Structure

- `/app` - Next.js App Router pages and components
  - `/analytics` - Analytics dashboard
  - `/orders` - Orders management
  - `/products` - Products listing
  - `/sync` - Data synchronization with Shopify
  - `/api` - Server actions and API routes
- `/lib` - Shared utilities and libraries
  - `/hooks` - Custom React hooks
  - `/mock` - Mock data and UI helper functions
  - `/services` - API service layer abstractions
  - `/providers` - React providers for context
  - `/supabase` - Supabase client and database types


## Mock Data

Mock data is centralized in the `/lib/mock` directory to maintain consistency across the application. This includes:

- Date range presets for filtering
- Sample sales data for analytics
- UI helper functions for rendering status badges and formatting

See the [Mock Data README](/lib/mock/README.md) for more information.

## Performance Optimizations

This project implements several performance and scalability optimizations:

- **React Query** - For efficient data fetching, caching, and state management
- **API Layer Abstraction** - Centralized service layer for all API operations
- **Server Actions** - Secure server-side API operations without exposing credentials
- **Virtualized Lists** - React Virtual for efficiently rendering large datasets
- **React 19** - Leveraging the new React compiler for automatic optimizations

For detailed information, see [OPTIMIZATIONS.md](/OPTIMIZATIONS.md).

## Future Improvements

<details>
<summary>📋 TODO List (click to expand)</summary>

### Database and ORM
- [ ] Implement a proper ORM (Prisma) for database operations
- [ ] Create migration scripts for database schema changes
- [ ] Add database schema visualization
- [ ] Implement database seeding for development environments

### Component Architecture
- [ ] Refactor repeating UI patterns into reusable components
- [ ] Create a component library for consistent UI elements
- [ ] Add Storybook for component documentation
- [ ] Implement component testing with React Testing Library

### Performance Enhancements
- [ ] Add virtualization for order/product tables for better pagination performance
- [ ] Implement data prefetching for common navigation paths
- [ ] Add bundle analysis and optimization
- [ ] Optimize API response caching strategies

### Developer Experience
- [ ] Add comprehensive TypeScript documentation
- [ ] Improve error handling and logging
- [ ] Create CI/CD pipeline for automated testing
- [ ] Add code quality checks with ESLint/Prettier

</details>

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
```

The application is already configured with environment variables in the `.env` file at the root of the project.

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

<details>
<summary>⚙️ Environment Variables (click to expand)</summary>

The application uses environment variables from the `.env` file in the root directory:

```
# Shopify API Credentials
SHOPIFY_SHOP_NAME="your-store.myshopify.com"
SHOPIFY_API_KEY="your_api_key"
SHOPIFY_API_SECRET="your_api_secret" 
SHOPIFY_API_VERSION="2024-01"
SHOPIFY_ACCESS_TOKEN="your_access_token"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_API_KEY="your_supabase_anon_key"

# API Endpoints
NEXT_PUBLIC_SUPABASE_ORDERS_API_ENDPOINT="/api/supabase/orders"
NEXT_PUBLIC_SUPABASE_PRODUCTS_API_ENDPOINT="/api/supabase/products"
```

### Shopify API Configuration

The Server Actions connect directly to the Shopify Admin API using these environment variables:

- `SHOPIFY_SHOP_NAME`: Your Shopify store URL (e.g., "your-store.myshopify.com")
- `SHOPIFY_API_VERSION`: The Shopify API version to use (e.g., "2024-01")
- `SHOPIFY_ACCESS_TOKEN`: Your private Shopify Admin API access token

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Inter](https://fonts.google.com/specimen/Inter), a modern sans-serif font.

</details>

<details>
<summary>📅 Date Filtering & Testing (click to expand)</summary>

### Date Filtering Logic

The application filters orders based on the **Shopify store's order processing date** (`processedAt`), not the date when orders were synced to our database.

### Example Test Dates

Here are a few example date ranges to test the filtering functionality:

| Test Case | Date Range | Expected Result |
|-----------|------------|-----------------|
| Recent Orders | 2023-12-01 to 2023-12-31 | Orders from December 2023 |
| Black Friday | 2023-11-24 to 2023-11-27 | Holiday shopping period orders |
| All Orders | Leave dates empty, click "View All Orders" | Complete order history |

> **Note**: The demo environment contains sample data primarily from 2023-2024.

To test the date filter:
1. Select a date range using the date pickers
2. Click "Apply" or use a preset button like "Last 7 Days" 
3. Verify the displayed orders match your selected dates
4. Use "View All Orders" to reset filters

### Testing Date Filters

To test the date filtering functionality:

1. **Setup Test Environment**
   ```bash
   # Start the development server
   npm run dev
   ```

2. **Manual Testing**
   - Navigate to the Orders page
   - Use the date picker to select different date ranges
   - Verify that the orders displayed match the expected date range
   - Test edge cases such as:
     - Selecting dates with no orders
     - Selecting a single day
     - Selecting a very wide date range

3. **API Testing**
   - Use the API directly to verify filtering:
   ```bash
   # Replace with your actual base URL and date parameters
   curl "http://localhost:3000/api/supabase/orders?startDate=2023-01-01&endDate=2023-01-31"
   ```

4. **Testing Preset Date Ranges**
   - Click the preset date range buttons ("Last 7 days", "Last 30 days", etc.)
   - Verify that the correct date range is applied and the appropriate orders are displayed

5. **View All Orders**
   - Click the "View All Orders" button to clear date filters
   - Verify that all orders are displayed regardless of date

Note that if you need to filter by database sync date instead, this would require schema modifications and API changes.

</details>

<details>
<summary>🔄 Shopify Data Synchronization (click to expand)</summary>

The application provides functionality to synchronize products and orders from your Shopify store to the Supabase database.

### How Synchronization Works

1. **Products Synchronization**
   - Click the "Sync Products" button on the Products page
   - The app connects to the Shopify GraphQL Admin API using your credentials
   - Products, variants, and images are fetched from Shopify
   - Data is then stored in the Supabase database with proper relationships
   - Existing products are updated and new products are added

2. **Orders Synchronization**
   - Select a date range on the Orders page
   - Click the "Sync Orders" button
   - The app fetches orders from the specified date range from Shopify
   - Orders and related data (line items, addresses, customers) are stored in Supabase
   - The system maintains relationships between orders and products

### Synchronization Flow

```
UI Request → API Route → Shopify GraphQL API → Transform Data → Supabase Database
```

Each synchronization operation provides real-time feedback through toast notifications, indicating whether the sync was successful or if any errors occurred.

### Technical Implementation

The synchronization is implemented through server-side API routes:
- `/api/shopify/products/sync`: Syncs all products from the Shopify store
- `/api/shopify/orders/sync`: Syncs orders from a specified date range

These endpoints authenticate with Shopify using your store credentials from environment variables, then use the Shopify Admin API to fetch the data. The data is then processed and stored in the Supabase database using the Supabase client's `upsert` functionality to avoid duplicates.

### Testing Synchronization

To test the synchronization:
1. Ensure your Shopify API credentials are correctly set in the environment variables
2. Click the "Sync Products" button on the Products page
3. For Orders, select a date range and click "Sync Orders"
4. Check the updated listings to verify the data was imported correctly

</details>

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
