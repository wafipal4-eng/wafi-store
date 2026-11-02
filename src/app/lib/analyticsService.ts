import { supabase, store_id } from "./constants";

/* ----------------------------------------------------
   TYPES
---------------------------------------------------- */
export interface VisitorStats {
    uniqueVisitors: number;
    pageViews: number;
}

export interface TrendPoint {
    date: string;
    visitors: number;
}

export interface PopularProduct {
    product_id: number;
    views: number;
    product?: any;
}

/* ----------------------------------------------------
   UTIL: Get or create unique visitor ID
---------------------------------------------------- */
export function getVisitorId(): string {
    if (typeof window === "undefined") return "";

    let id = localStorage.getItem("visitor_id");
    if (!id) {
        id = "visitor_" + crypto.randomUUID();
        localStorage.setItem("visitor_id", id);
    }
    return id;
}

/* ----------------------------------------------------
   TRACK VISIT
---------------------------------------------------- */
export async function trackVisit(pagePath: string) {
    try {
        const visitorId = getVisitorId();
        if (!visitorId) return;

        await supabase.from("visitor_analytics").insert({
            store_id,
            visitor_id: visitorId,
            session_id: getSessionId(),   // ⭐ REQUIRED
            page_path: pagePath,
            referrer: typeof document !== "undefined" ? document.referrer : null,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
            created_at: new Date().toISOString(),
        });

    } catch (err) {
        console.error("trackVisit failed:", err);
    }
}

/* ----------------------------------------------------
   HELPERS
---------------------------------------------------- */
function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function daysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

/* ----------------------------------------------------
   UNIQUE VISITORS: TODAY / WEEK / MONTH / ALL-TIME
   ⚡ Optimized to use PostgreSQL RPC function with COUNT(DISTINCT)
---------------------------------------------------- */
export async function getVisitorsToday(): Promise<number> {
    try {
        const { data, error } = await supabase.rpc("count_unique_visitors", {
            p_store_id: store_id,
            p_start_date: startOfToday().toISOString(),
        });

        if (error) {
            console.error("Error fetching today's visitors:", error);
            return 0;
        }

        console.log(`📊 Today's visitors: ${data || 0}`);
        return data || 0;
    } catch (err) {
        console.error("Exception in getVisitorsToday:", err);
        return 0;
    }
}

export async function getVisitorsThisWeek(): Promise<number> {
    try {
        const { data, error } = await supabase.rpc("count_unique_visitors", {
            p_store_id: store_id,
            p_start_date: daysAgo(7),
        });

        if (error) {
            console.error("Error fetching week's visitors:", error);
            return 0;
        }

        console.log(`📊 This week's visitors: ${data || 0}`);
        return data || 0;
    } catch (err) {
        console.error("Exception in getVisitorsThisWeek:", err);
        return 0;
    }
}

export async function getVisitorsThisMonth(): Promise<number> {
    try {
        const { data, error } = await supabase.rpc("count_unique_visitors", {
            p_store_id: store_id,
            p_start_date: daysAgo(30),
        });

        if (error) {
            console.error("Error fetching month's visitors:", error);
            return 0;
        }

        return data || 0;
    } catch (err) {
        console.error("Exception in getVisitorsThisMonth:", err);
        return 0;
    }
}

export async function getAllTimeVisitors(): Promise<number> {
    try {
        const { data, error } = await supabase.rpc("count_unique_visitors", {
            p_store_id: store_id,
        });

        if (error) {
            console.error("Error fetching all-time visitors:", error);
            return 0;
        }

        return data || 0;
    } catch (err) {
        console.error("Exception in getAllTimeVisitors:", err);
        return 0;
    }
}

/* ----------------------------------------------------
   DAILY VISITOR TREND (last N days)
   ⚡ Optimized to use PostgreSQL RPC function
---------------------------------------------------- */
export async function getDailyVisitors(days = 30): Promise<TrendPoint[]> {
    try {
        const { data, error } = await supabase.rpc("get_daily_visitor_stats", {
            p_store_id: store_id,
            p_days: days,
        });

        if (error) {
            console.error("Error fetching daily visitors:", error);
            return [];
        }

        return (data || []).map((row: any) => ({
            date: row.date,
            visitors: Number(row.visitors),
        }));
    } catch (err) {
        console.error("Exception in getDailyVisitors:", err);
        return [];
    }
}

/* ----------------------------------------------------
   WEEKLY VISITOR TREND (last 12 weeks)
   ⚡ Optimized to use PostgreSQL RPC function
---------------------------------------------------- */
export async function getWeeklyVisitorsTrend(weeks = 12): Promise<TrendPoint[]> {
    try {
        const { data, error } = await supabase.rpc("get_weekly_visitor_stats", {
            p_store_id: store_id,
            p_weeks: weeks,
        });

        if (error) {
            console.error("Error fetching weekly visitors:", error);
            return [];
        }

        return (data || []).map((row: any) => ({
            date: row.week_key,
            visitors: Number(row.visitors),
        }));
    } catch (err) {
        console.error("Exception in getWeeklyVisitorsTrend:", err);
        return [];
    }
}

/* ----------------------------------------------------
   MONTHLY VISITOR TREND (last 12 months)
   ⚡ Optimized to use PostgreSQL RPC function
---------------------------------------------------- */
export async function getMonthlyVisitorsTrend(months = 12): Promise<TrendPoint[]> {
    try {
        const { data, error } = await supabase.rpc("get_monthly_visitor_stats", {
            p_store_id: store_id,
            p_months: months,
        });

        if (error) {
            console.error("Error fetching monthly visitors:", error);
            return [];
        }

        return (data || []).map((row: any) => ({
            date: row.month_key,
            visitors: Number(row.visitors),
        }));
    } catch (err) {
        console.error("Exception in getMonthlyVisitorsTrend:", err);
        return [];
    }
}

/* ----------------------------------------------------
   MOST VISITED PRODUCTS
   ⚡ Optimized to use PostgreSQL RPC function
---------------------------------------------------- */
export async function getMostVisitedProducts(limit = 5): Promise<PopularProduct[]> {
    try {
        // Use database function to aggregate product views
        const { data: productViews, error } = await supabase.rpc("get_most_visited_products", {
            p_store_id: store_id,
            p_limit: limit,
        });

        if (error) {
            console.error("❌ Error fetching product views:", error);
            return [];
        }

        if (!productViews || productViews.length === 0) {
            return [];
        }

        // Fetch product details for all products in ONE query
        const productIds = productViews.map((p: any) => p.product_id);

        const { data: products, error: productsError } = await supabase
            .from("products")
            .select("*")
            .in("id", productIds);

        if (productsError) {
            console.error("❌ Error fetching product details:", productsError);
            return [];
        }

        // Combine views with product details
        const result = productViews.map((item: any) => ({
            product_id: item.product_id,
            views: Number(item.views),
            product: products?.find((p) => p.id === item.product_id) || null,
        }));

        return result;

    } catch (err) {
        console.error("getMostVisitedProducts failed:", err);
        return [];
    }
}


export function getSessionId(): string {
    if (typeof window === "undefined") return "";

    let id = sessionStorage.getItem("session_id");
    if (!id) {
        id = "session_" + crypto.randomUUID();
        sessionStorage.setItem("session_id", id);
    }
    return id;
}

/* ----------------------------------------------------
   TRACK LOGO CLICK
---------------------------------------------------- */
export async function trackLogoClick() {
    try {
        const visitorId = getVisitorId();
        if (!visitorId) return;

        await supabase.from("visitor_analytics").insert({
            store_id,
            visitor_id: visitorId,
            session_id: getSessionId(),
            page_path: "/matjari-logo-click",
            referrer: typeof document !== "undefined" ? document.referrer : null,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
            created_at: new Date().toISOString(),
        });

        console.log("✅ Logo click tracked");
    } catch (err) {
        console.error("trackLogoClick failed:", err);
    }
}

/* ----------------------------------------------------
   PRODUCT SALES ANALYTICS
   ⚡ Optimized database queries for sales statistics
---------------------------------------------------- */

export interface SalesProduct {
    product_id: number;
    total_sold: number;
    revenue: number;
    product?: any;
}
export async function getBestSellingProducts(limit = 10): Promise<SalesProduct[]> {
    try {
        const { data: orderProducts, error } = await supabase
            .from("order_product")
            .select("product_id, amount, orders(store_id, status)")
            .gte("amount", 1);

        if (error) {
            console.error("❌ Error fetching order products:", error);
            return [];
        }

        const filtered = orderProducts.filter(
            (entry: any) => entry.orders?.store_id === store_id && entry.orders?.status !== 'Cancelled'
        );

        const countMap: Record<number, number> = {};
        for (const item of filtered) {
            countMap[item.product_id] = (countMap[item.product_id] || 0) + (item.amount || 0);
        }

        const topProductIds = Object.entries(countMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([id]) => Number(id));

        if (topProductIds.length === 0) return [];

        const { data: products, error: prodError } = await supabase
            .from("products")
            .select("*")
            .in("id", topProductIds);

        if (prodError) {
            console.error("❌ Error fetching product details:", prodError);
            return [];
        }

        return topProductIds.map((id) => ({
            product_id: id,
            total_sold: countMap[id],
            revenue: 0,
            product: products?.find((p) => p.id === id) || null,
        }));
    } catch (err) {
        console.error("getBestSellingProducts failed:", err);
        return [];
    }
}

export async function getLeastSellingProducts(limit = 10): Promise<SalesProduct[]> {
    try {
        const { data: orderProducts, error } = await supabase
            .from("order_product")
            .select("product_id, amount, orders(store_id, status)")
            .gte("amount", 1);

        if (error) {
            console.error("❌ Error fetching order products:", error);
            return [];
        }

        const filtered = orderProducts.filter(
            (entry: any) => entry.orders?.store_id === store_id && entry.orders?.status !== 'Cancelled'
        );

        const countMap: Record<number, number> = {};
        for (const item of filtered) {
            countMap[item.product_id] = (countMap[item.product_id] || 0) + (item.amount || 0);
        }

        const leastProductIds = Object.entries(countMap)
            .sort(([, a], [, b]) => a - b)
            .slice(0, limit)
            .map(([id]) => Number(id));

        if (leastProductIds.length === 0) return [];

        const { data: products, error: prodError } = await supabase
            .from("products")
            .select("*")
            .in("id", leastProductIds);

        if (prodError) {
            console.error("❌ Error fetching product details:", prodError);
            return [];
        }

        return leastProductIds.map((id) => ({
            product_id: id,
            total_sold: countMap[id],
            revenue: 0,
            product: products?.find((p) => p.id === id) || null,
        }));
    } catch (err) {
        console.error("getLeastSellingProducts failed:", err);
        return [];
    }
}


export async function getLeastVisitedProducts(limit = 10): Promise<PopularProduct[]> {
    try {
        const { data: productViews, error } = await supabase.rpc("get_least_visited_products", {
            p_store_id: store_id,
            p_limit: limit,
        });

        if (error) {
            console.error("❌ Error fetching least visited products:", error);
            return [];
        }

        if (!productViews || productViews.length === 0) {
            return [];
        }

        const productIds = productViews.map((p: any) => p.product_id);

        const { data: products, error: productsError } = await supabase
            .from("products")
            .select("*")
            .in("id", productIds);

        if (productsError) {
            console.error("❌ Error fetching product details:", productsError);
            return [];
        }

        return productViews.map((item: any) => ({
            product_id: item.product_id,
            views: Number(item.views),
            product: products?.find((p) => p.id === item.product_id) || null,
        }));

    } catch (err) {
        console.error("getLeastVisitedProducts failed:", err);
        return [];
    }
}
