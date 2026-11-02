-- Add secondary_name to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS secondary_name TEXT;

-- Add secondary_description to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS secondary_description TEXT;

-- Add secondary_name to categories table  
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS secondary_name TEXT;

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_products_secondary_name ON products(secondary_name);
CREATE INDEX IF NOT EXISTS idx_products_secondary_description ON products(secondary_description);
CREATE INDEX IF NOT EXISTS idx_categories_secondary_name ON categories(secondary_name);

-- Add comment explaining the columns
COMMENT ON COLUMN products.secondary_name IS 'Non-Arabic name (EN/HE) for the product. Falls back to name if empty.';
COMMENT ON COLUMN categories.secondary_name IS 'Non-Arabic name (EN/HE) for the category. Falls back to name if empty.';
COMMENT ON COLUMN categories.secondary_description IS 'Non-Arabic description (EN/HE) for the category. Falls back to description if empty.';
