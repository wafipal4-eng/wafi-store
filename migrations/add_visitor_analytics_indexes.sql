-- Migration: Add indexes to visitor_analytics table for performance optimization
-- Date: 2025-12-26
-- Purpose: Improve analytics dashboard query performance

-- Add index on store_id for faster store-specific filtering
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_store_id 
ON visitor_analytics(store_id);

-- Add composite index on store_id + created_at for efficient date-range queries
-- This is crucial for today/week/month visitor queries
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_store_created 
ON visitor_analytics(store_id, created_at DESC);

-- Add index on page_path for product analytics
-- Helps with getMostVisitedProducts() query performance
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_page_path 
ON visitor_analytics(store_id, page_path) 
WHERE page_path IS NOT NULL;

-- Create PostgreSQL function for efficient unique visitor counting
-- This function uses COUNT(DISTINCT ...) which is much faster than fetching all rows
CREATE OR REPLACE FUNCTION count_unique_visitors(
    p_store_id INTEGER,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    visitor_count INTEGER;
BEGIN
    IF p_start_date IS NULL THEN
        -- Count all-time unique visitors
        SELECT COUNT(DISTINCT visitor_id)
        INTO visitor_count
        FROM visitor_analytics
        WHERE store_id = p_store_id;
    ELSE
        -- Count unique visitors within date range
        SELECT COUNT(DISTINCT visitor_id)
        INTO visitor_count
        FROM visitor_analytics
        WHERE store_id = p_store_id
          AND created_at >= p_start_date
          AND (p_end_date IS NULL OR created_at <= p_end_date);
    END IF;
    
    RETURN visitor_count;
END;
$$;

-- Create function for daily visitor aggregation
CREATE OR REPLACE FUNCTION get_daily_visitor_stats(
    p_store_id INTEGER,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(date DATE, visitors BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT visitor_id) as visitors
    FROM visitor_analytics
    WHERE store_id = p_store_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date;
END;
$$;

-- Create function for weekly visitor aggregation
CREATE OR REPLACE FUNCTION get_weekly_visitor_stats(
    p_store_id INTEGER,
    p_weeks INTEGER DEFAULT 12
)
RETURNS TABLE(week_key TEXT, visitors BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(created_at, 'IYYY-IW') as week_key,
        COUNT(DISTINCT visitor_id) as visitors
    FROM visitor_analytics
    WHERE store_id = p_store_id
      AND created_at >= NOW() - (p_weeks * 7 || ' days')::INTERVAL
    GROUP BY TO_CHAR(created_at, 'IYYY-IW')
    ORDER BY week_key;
END;
$$;

-- Create function for monthly visitor aggregation
CREATE OR REPLACE FUNCTION get_monthly_visitor_stats(
    p_store_id INTEGER,
    p_months INTEGER DEFAULT 12
)
RETURNS TABLE(month_key TEXT, visitors BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month_key,
        COUNT(DISTINCT visitor_id) as visitors
    FROM visitor_analytics
    WHERE store_id = p_store_id
      AND created_at >= NOW() - (p_months || ' months')::INTERVAL
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month_key;
END;
$$;

-- Verify indexes were created
-- You can run: \di visitor_analytics* in psql to see the indexes

-- Create function for most visited products aggregation
-- This function uses PostgreSQL regex and grouping to count product views
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
        -- Extract product ID from page_path using regex
        -- Matches patterns like: /ar/ProductInfo/533, /en/product/533, /he/products/533
        (regexp_match(page_path, '^/[a-zA-Z]{2}/(?:ProductInfo|product|products)/(\d+)', 'i'))[1]::INTEGER as product_id,
        COUNT(*) as views
    FROM visitor_analytics
    WHERE store_id = p_store_id
      AND page_path IS NOT NULL
      -- Filter only rows that match the product page pattern
      AND page_path ~* '^/[a-zA-Z]{2}/(?:ProductInfo|product|products)/\d+'
    GROUP BY product_id
    ORDER BY views DESC
    LIMIT p_limit;
END;
$$;

-- ========================================
-- PRODUCT SALES ANALYTICS FUNCTIONS
-- ========================================

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

-- Function to get least selling products (products with some sales but lowest)
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

-- Function to get least visited products (invert of most visited)
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
