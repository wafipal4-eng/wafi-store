# 🚀 Product Statistics Migration Guide

## Quick Start

You need to run **one SQL migration** to enable the product statistics page.

### Run in Supabase SQL Editor

Copy and run the following SQL (or run the entire `migrations/add_visitor_analytics_indexes.sql` file):

```sql
-- Function to get best selling products
CREATE OR REPLACE FUNCTION get_best_selling_products(
    p_store_id INTEGER,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(product_id INTEGER, total_sold BIGINT, revenue NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.product_id,
        SUM(oi.amount)::BIGINT as total_sold,
        SUM(oi.amount * oi.price)::NUMERIC as revenue
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.store_id = p_store_id
      AND o.status != 'Cancelled'
    GROUP BY oi.product_id
    HAVING SUM(oi.amount) > 0
    ORDER BY total_sold DESC
    LIMIT p_limit;
END;
$$;

-- Function to get least selling products
CREATE OR REPLACE FUNCTION get_least_selling_products(
    p_store_id INTEGER,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(product_id INTEGER, total_sold BIGINT, revenue NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.product_id,
        SUM(oi.amount)::BIGINT as total_sold,
        SUM(oi.amount * oi.price)::NUMERIC as revenue
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.store_id = p_store_id
      AND o.status != 'Cancelled'
    GROUP BY oi.product_id
    HAVING SUM(oi.amount) > 0
    ORDER BY total_sold ASC
    LIMIT p_limit;
END;
$$;

-- Function to get least visited products
CREATE OR REPLACE FUNCTION get_least_visited_products(
    p_store_id INTEGER,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(product_id INTEGER, views BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (regexp_match(page_path, '^/[a-zA-Z]{2}/(?:ProductInfo|product|products)/(\d+)', 'i'))[1]::INTEGER as product_id,
        COUNT(*) as views
    FROM visitor_analytics
    WHERE store_id = p_store_id
      AND page_path IS NOT NULL
      AND page_path ~* '^/[a-zA-Z]{2}/(?:ProductInfo|product|products)/\d+'
    GROUP BY product_id
    HAVING COUNT(*) > 0
    ORDER BY views ASC
    LIMIT p_limit;
END;
$$;
```

## What Was Implemented

### ✅ Database Functions
- `get_best_selling_products()` - Returns top selling products with sales count and revenue
- `get_least_selling_products()` - Returns lowest selling products
- `get_least_visited_products()` - Returns products with fewest page views

### ✅ Analytics Service
Added new functions in `analyticsService.ts`:
-getBestSellingProducts()` 
- `getLeastSellingProducts()`
- `getLeastVisitedProducts()`

### ✅ Product Statistics Page
Created `/dashboard/product-stats` with:
- **Best Selling** - Products sorted by total sales
- **Best Viewed** - Most visited products
- **Least Viewed** - Least visited products
- **Least Sold** - Products with lowest sales

### ✅ Localization
Translations added for:
- Arabic (ar.json) ✓
- English (en.json) ✓
- Hebrew (he.json) ✓

### ✅ Navigation
Added "Product Statistics" link to sidebar navigation with BarChart3 icon

## Testing

1. **Run the migration** in Supabase SQL Editor
2. **Navigate to** `/dashboard/product-stats`
3. **Verify** all four sections display correctly
4. **Switch languages** (ar, en, he) to test translations
5. **Check data** matches your actual sales and analytics

## Features

- 📊 Real-time statistics
- 🎨 Matches dashboard styling
- 🌐 Fully localized
- ⚡ Optimized database queries
- 📱 Responsive design
