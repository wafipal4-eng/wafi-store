# 🔄 Product Views Migration Update

## Quick Instructions

You need to run **one more SQL function** to fix product views. The migration file has been updated.

### Option 1: Run Only the New Function (Recommended)

Copy and run this in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION get_most_visited_products(
    p_store_id INTEGER,
    p_limit INTEGER DEFAULT 5
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
    ORDER BY views DESC
    LIMIT p_limit;
END;
$$;
```

### Option 2: Re-run the Entire Migration File

The complete migration file at `migrations/add_visitor_analytics_indexes.sql` now includes the product views function. You can re-run the entire file safely (uses `CREATE OR REPLACE`).

## What This Does

- Aggregates product page views **on the database** using regex pattern matching
- Matches URLs like `/ar/ProductInfo/533`, `/en/product/533`, `/he/products/533`
- Groups by product ID and counts visits
- Returns top N most visited products

## After Running

The dashboard product views should now be:
- ✅ **Correct** - accurate counts
- ✅ **Fast** - aggregated on database instead of in JavaScript
- ✅ **Scalable** - works with any number of analytics records
