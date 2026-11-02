# Language Configuration Guide

## Overview

Your store's supported languages are now centrally configured in `src/app/lib/constants.ts`. You can easily change which languages your store supports from one place!

## Current Configuration

```typescript
export const SUPPORTED_LANGUAGES = {
  primary: 'ar',           // Primary language (Arabic)
  secondary: ['en', 'he'], // Secondary languages (English, Hebrew)
  all: ['ar', 'en', 'he'], // All enabled languages
};
```

## How It Works

### Primary Language (`ar`)
- Uses the **`name`** column in the database
- Always displayed when viewing in Arabic
- Example: `name = "عباية سوداء"`

### Secondary Languages (`en`, `he`)
- Use the **`secondary_name`** column in the database
- Falls back to `name` if `secondary_name` is empty
- Example: `secondary_name = "Black Abaya"`

## Changing Languages

### To Add a New Language

1. Add it to the `secondary` array:
```typescript
export const SUPPORTED_LANGUAGES = {
  primary: 'ar',
  secondary: ['en', 'he', 'fr'], // Added French!
  all: ['ar', 'en', 'he', 'fr'],
};
```

2. Make sure you have translation files for it (`messages/fr.json`)

### To Remove a Language

1. Remove it from the `secondary` array:
```typescript
export const SUPPORTED_LANGUAGES = {
  primary: 'ar',
  secondary: ['en'], // Removed Hebrew
  all: ['ar', 'en'],
};
```

### To Change the Primary Language

> ⚠️ **Warning**: Changing the primary language requires database migration!

If you want English to be primary instead of Arabic:

1. Update the configuration:
```typescript
export const SUPPORTED_LANGUAGES = {
  primary: 'en',           // Changed to English
  secondary: ['ar', 'he'], // Arabic is now secondary
  all: ['ar', 'en', 'he'],
};
```

2. Run a database migration to swap `name` and `secondary_name` values

## Helper Functions

The configuration includes two helper functions:

### `isPrimaryLocale(locale)`
```typescript
isPrimaryLocale('ar') // true
isPrimaryLocale('en') // false
```

### `usesSecondaryName(locale)`
```typescript
usesSecondaryName('ar') // false  
usesSecondaryName('en') // true
usesSecondaryName('he') // true
```

## Where It's Used

The language configuration is automatically used in:
- ✅ Product displays (ProductCard, ProductDetails)
- ✅ Cart items
- ✅ Dashboard components (Low Stock Alerts, Product Stats)
- ✅ All name helper functions (`getProductName`, `getCategoryName`)

## Example Use Case

**Before** (hardcoded):
```typescript
const productName = locale === 'ar' ? product.name : product.secondary_name;
```

**After** (configuration-driven):
```typescript
const productName = getProductName(product, locale);
// Automatically uses the SUPPORTED_LANGUAGES config!
```

## Quick Reference

| Language Code | Type | Database Column | When Empty |
|--------------|------|----------------|-----------|
| `ar` | Primary | `name` | N/A (required) |
| `en` | Secondary | `secondary_name` | Falls back to `name` |
| `he` | Secondary | `secondary_name` | Falls back to `name` |

---

**Location**: `src/app/lib/constants.ts` (lines 6-27)
