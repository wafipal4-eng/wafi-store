# Bilingual Names Migration Guide

## Quick Start

You need to run the SQL migration in Supabase to add `secondary_name` columns.

### Option 1: Run in Supabase SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `migrations/add_secondary_names.sql`
3. Click **Run**
4. Verify columns added: 
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'products' AND column_name = 'secondary_name';
   ```

### Option 2: SQL Script

```sql
-- Add secondary_name to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS secondary_name TEXT;

-- Add secondary_name to categories table  
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS secondary_name TEXT;

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_products_secondary_name ON products(secondary_name);
CREATE INDEX IF NOT EXISTS idx_categories_secondary_name ON categories(secondary_name);
```

---

## How It Works

### Display Logic

- **Arabic (`/ar`)**: Always shows `name` column (Arabic)
- **English (`/en`)**: Shows `secondary_name` if set, otherwise falls back to `name`
- **Hebrew (`/ he`)**: Shows `secondary_name` if set, otherwise falls back to `name`

### Example

```typescript
// Product in database:
{
  id: 1,
  name: "عباية سوداء",           // Arabic (required)
  secondary_name: "Black Abaya",  // English/Hebrew (optional)
  ...
}

// Display logic:
- Arabic user sees: "عباية سوداء"
- English user sees: "Black Abaya"
- If secondary_name is null:
  - English user sees: "عباية سوداء" (fallback)
```

---

## What Was Updated

### ✅ Files Created

1. **migrations/add_secondary_names.sql** - Database migration
2. **lib/nameHelpers.ts** - Utility functions:
   - `getLocalizedName()` - Core logic
   - `getProductName()` - For products
   - `getCategoryName()` - For categories

### ✅ Customer-Facing Components Updated

-**ProductCard.tsx** - Store product cards
- **ProductDetails.tsx** - Product detail page
- **CartItem.tsx** - Shopping cart items
- **LowStockAlerts.tsx** - Dashboard low stock widget

### ✅ Database Queries Updated

- **productService.ts** - All product SELECT queries now include `secondary_name`

---

## Adding Secondary Names

### Via Admin Dashboard (To Be Implemented)

When you edit a product, you'll see a new field:
```
Primary Name (AR): [عباية سوداء]
Secondary Name (EN/HE): [Black Abaya]
```

### Via Supabase Directly

```sql
UPDATE products
SET secondary_name = 'Black Abaya'
WHERE id = 1;
```

---

## Still To Do

1. **Admin Forms**: Add `secondary_name` input field to product/category forms
2. **More Components**: Update remaining components that show names
3. **Category Support**: Apply same pattern to category displays
4. **Testing**: Test across all three locales

---

## Backward Compatibility

✅ **100% Backward Compatible**
- Existing products work without any changes
- `secondary_name` is optional
- Falls back to `name` if empty
- No breaking changes

