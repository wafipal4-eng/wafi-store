# Analytics Performance Migration

## Overview
This migration adds database indexes and PostgreSQL functions to dramatically improve analytics dashboard performance.

## Migration File
`migrations/add_visitor_analytics_indexes.sql`

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `migrations/add_visitor_analytics_indexes.sql`
4. Copy the entire content
5. Paste into the SQL editor
6. Click **Run** to execute

### Option 2: Supabase CLI
If you have the Supabase CLI installed:

```bash
# Make sure you're in the project directory
cd /Users/ameer/nour/initial-plan

# Run the migration
supabase db push migrations/add_visitor_analytics_indexes.sql
```

### Option 3: Direct PostgreSQL Connection
If you have direct PostgreSQL access:

```bash
psql -h your-db-host -U postgres -d postgres -f migrations/add_visitor_analytics_indexes.sql
```

## What This Migration Does

### Indexes Created
1. **`idx_visitor_analytics_store_id`** - Fast filtering by store
2. **`idx_visitor_analytics_store_created`** - Fast date-range queries
3. **`idx_visitor_analytics_page_path`** - Fast product analytics

### Functions Created
1. **`count_unique_visitors()`** - Efficient unique visitor counting with COUNT(DISTINCT)
2. **`get_daily_visitor_stats()`** - Daily aggregation on database
3. **`get_weekly_visitor_stats()`** - Weekly aggregation on database
4. **`get_monthly_visitor_stats()`** - Monthly aggregation on database

## Verification

After running the migration, check:

1. **Indexes exist**:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'visitor_analytics';
   ```

2. **Functions exist**:
   ```sql
   SELECT routine_name FROM information_schema.routines WHERE routine_type = 'FUNCTION' AND routine_name LIKE '%visitor%';
   ```

3. **Dashboard works**: Navigate to your analytics dashboard and verify statistics are correct and load quickly.

## Expected Performance Improvement

- **Before**: Fetching 100K+ rows, processing in JavaScript (~5-10 seconds)
- **After**: Database-side aggregation with indexes (~50-200ms)

**Expected speedup: 20-50x faster** ⚡
