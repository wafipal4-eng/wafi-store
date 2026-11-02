# Sales Analytics Migration - Quick Fix

## Issue
The "Best Selling" and "Least Sold" sections show "No data available" because the sales analytics functions haven't been created in your database yet.

## Solution

Run this SQL in your **Supabase SQL Editor**:

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
```

## Steps

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Paste the SQL above
4. Click **Run**
5. Refresh your statistics page

The sales statistics should then appear!

## Note

If you have no orders yet, these sections will naturally show "No data available" until customers start placing orders.
