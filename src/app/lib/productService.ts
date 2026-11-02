// import { Attribute, AttributeItem } from "@/app/lib/interfaces"

// app/lib/productService.ts
import { supabase } from "./constants";
import { Product, Order, Category, DiscountCode } from "./interfaces";
import { store_id } from "@/app/lib/constants";

export interface StoreCity {
  id?: string | number;
  name: string;
  shipping_cost: number;
}

export const fetchStoreCities = async (): Promise<StoreCity[]> => {
  try {
    const { data, error } = await supabase
      .from('store')
      .select('cities')
      .eq('id', store_id)
      .single();

    if (error) throw error;
    return data?.cities || [];
  } catch (error) {
    console.error("Error fetching store cities:", error);
    return [];
  }
};

export const fetchHeroImages = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('store')
      .select('images')
      .eq('id', store_id)
      .single();

    if (error) throw error;
    return data?.images || [];
  } catch (error) {
    console.error("Error fetching hero images:", error);
    return [];
  }
};



export const fetchAllProductsIncludeingOutOfStock = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", store_id)
      .eq("is_deleted", false)
      .order("id", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Fetch products with pagination
export const fetchProductsPaginated = async (
  page: number = 1,
  pageSize: number = 10
): Promise<{ products: Product[]; total: number }> => {
  try {
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from("products")
      .select("*", { count: 'exact' })
      .eq("store_id", store_id)
      .eq("is_deleted", false)
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return {
      products: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error("Error fetching paginated products:", error);
    return { products: [], total: 0 };
  }
};


// Fetch all products for a store
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", store_id)
      .eq("is_deleted", false)
      .order("id", { ascending: false });

    if (error) throw error;


    return data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const fetchRecentProducts = async (limit = 8): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", store_id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching recent products:", error);
    return [];
  }
};

// Fetch all images for a specific product
export const fetchProductImages = async (productId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("images")
      .select("image_path")
      .eq("product_id", productId);

    if (error) throw error;

    return (
      data?.map((img) => {
        // convert signed URL to public URL
        if (!img.image_path) return "";
        const url = new URL(img.image_path);
        const publicPath = url.pathname.replace("/sign/", "/public/").split("?")[0];
        return `${url.origin}${publicPath}`;
      }) || []
    );
  } catch (error) {
    console.error("Error fetching product images:", error);
    return [];
  }
};



export const fetchProductImagesForDelete = async (productId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("images")
      .select("image_path")
      .eq("product_id", productId);

    if (error) throw error;

    return (
      data?.map((img) => {
        // convert signed URL to public URL
        if (!img.image_path) return "";
        return `${img.image_path}`;
      }) || []
    );
  } catch (error) {
    console.error("Error fetching product images:", error);
    return [];
  }
};


export const fetchAllProductImages = async (productId: string): Promise<string[]> => {
  try {
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("main_image")
      .eq("id", productId)
      .single();

    if (productError) throw productError;

    const mainImage = productData?.main_image || null;

    const { data: imageData, error: imageError } = await supabase
      .from("images")
      .select("image_path")
      .eq("product_id", productId);

    if (imageError) throw imageError;

    const allImages = [
      ...(mainImage ? [mainImage] : []),
      ...(imageData || []).map((img) => img.image_path),
    ];

    return allImages;
  } catch (error) {
    console.error("❌ Error fetching product images:", error);
    return [];
  }
};



// Fetch a single product by ID
export const fetchProduct = async (productId: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("store_id", store_id)
      .eq("is_deleted", false)// Only fetch non-deleted products
      .single();

    if (error) throw error;

    return data || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
};

// Fetch all orders for a store
export const fetchOrders = async (store_id: number): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", store_id)
      .order("created_at", { ascending: false });


    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// Create a new product
export const createProduct = async (product: Product): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: product.name,
          description: product.description,
          price: product.price,
          new_price: product.new_price === 0 ? null : product.new_price,
          quantity: product.quantity,
          main_image: typeof product.main_image === "string" ? product.main_image : null,
          in_stock: product.in_stock,
          store_id: store_id,
        }
      ])
      .select() // ✅ Make sure the full inserted row is returned
      .single();

    if (error) throw error;

    return data || null;
  } catch (error) {
    console.error("Error creating product:", error);
    return null;
  }
};

// Update a product
export const updateProduct = async (product: Product): Promise<Product | string | null> => {
  try {
    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        secondary_name: product.secondary_name || null,
        description: product.description,
        secondary_description: product.secondary_description || null,
        price: product.price,
        new_price: product.new_price === 0 ? null : product.new_price,
        main_image: typeof product.main_image === "string" ? product.main_image : null,
        in_stock: product.in_stock,
        quantity: product.quantity,
      })
      .eq("id", product.id)
      .single();

    if (error) throw error;

    return 'success';
  } catch (error) {
    console.error("Error updating product:", error);
    return null;
  }
};

export const fetchOrderProducts = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from("order_product")
      .select("amount, options, products(name, secondary_name)")
      .eq("order_id", orderId);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching order products:", error);
    return [];
  }
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .neq('orderby', -1) // ⛔ exclude categories with orderby = -1
    .eq('store_id', store_id)
    .order('orderby', { ascending: true }); // ← order by `orderby` ASC


  if (error) {
    console.error('Error fetching categories:', error.message);
    return [];
  }

  return data as Category[];
};

// Add a new category
export const addCategory = async (name: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, store_id }])
    .select()
    .single();

  if (error) {
    console.error('Error adding category:', error.message);
    return null;
  }

  return data;
};

export const deleteCategoryById = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting category:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('❗ Unexpected error:', err);
    return false;
  }
};

export const fetchProductsByCategory = async (categoryId: string | null): Promise<any[]> => {
  try {
    // Step 1: Get product_ids from product_category
    let categoryQuery = supabase
      .from("product_category")
      .select("product_id")
      .eq("store_id", store_id);

    if (categoryId && categoryId !== "all") {
      categoryQuery = categoryQuery.eq("category_id", categoryId);
    }

    const { data: productCategoryRows, error: categoryError } = await categoryQuery;

    if (categoryError) {
      console.error("❌ Error fetching product_category:", categoryError.message);
      return [];
    }

    const productIds = (productCategoryRows ?? []).map(row => row.product_id);

    if (productIds.length === 0) return [];

    // Step 2: Get product data using product_ids
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("is_deleted", false)
      .eq("store_id", store_id)
      .order("created_at", { ascending: false });

    if (productError) {
      console.error("❌ Error fetching products:", productError.message);
      return [];
    }

    return products || [];
  } catch (err) {
    console.error("❗ Unexpected error:", err);
    return [];
  }
};

export const fetchAllCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', store_id);
  if (error) {
    console.error('Error fetching categories:', error.message);
    return [];
  }
  return data;
};

export const createProductCategories = async ({
  product_id,
  category_ids,
}: {
  product_id: string;
  category_ids: string[];
}) => {
  if (!category_ids.length) return [];

  try {
    const entries = category_ids.map((category_id) => ({
      product_id: String(product_id),
      store_id: String(store_id),
      category_id: String(category_id),
    }));

    const { data, error } = await supabase
      .from("product_category")
      .insert(entries);

    if (error) {
      console.error("Supabase insert error:", error);
      return [];
    }

    return data;
  } catch (err) {
    console.error("Unexpected error in createProductCategories:", err);
    return [];
  }
};

export async function fetchProductCategories(productIds: (string | number)[]) {

  const { data: productCats, error: productCatError } = await supabase
    .from("product_category")
    .select("category_id")
    .in("product_id", productIds);

  if (productCatError) {
    console.error("❌ Failed to fetch product-category links:", productCatError.message);
    throw new Error(productCatError.message);
  }


  const categoryIds = productCats?.map((c) => c.category_id) || [];

  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("id, name")
    .in("id", categoryIds);

  if (categoryError) {
    console.error("❌ Failed to fetch categories:", categoryError.message);
    throw new Error(categoryError.message);
  }

  return categories;
}

// Delete image by image_path
export const deleteProductImage = async (imagePath: string): Promise<boolean> => {
  console.log("Deleting image:", imagePath);

  const { error } = await supabase
    .from("images")
    .delete()
    .eq("image_path", imagePath);

  if (error) {
    console.error("❌ Failed to delete image:", error.message);
    return false;
  }

  return true;
};

// app/lib/productService.ts
// Add these:

export const updateCategory = async (
  id: string,
  patch: Partial<{ name: string; secondary_name: string | undefined; is_visible: boolean; orderby: number; extras: Record<string, unknown> }>
): Promise<boolean> => {
  const { error } = await supabase.from('categories').update(patch).eq('id', id);
  if (error) {
    console.error('❌ Error updating category:', error.message);
    return false;
  }
  return true;
};

export const bulkUpdateCategoryOrder = async (
  items: { id: string; orderby: number }[]
): Promise<boolean> => {
  if (!items.length) return true;
  const { error } = await supabase.from('categories').upsert(items, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (error) {
    console.error('❌ Error bulk updating category order:', error.message);
    return false;
  }
  return true;
};

// app/lib/productService.ts
export const getDashboardStats = async () => {
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", store_id);

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_deleted", false)
    .eq("store_id", store_id);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", store_id)
    .neq("orderby", -1);

  const now = new Date();
  const d30 = new Date(now); d30.setDate(now.getDate() - 30);
  const d7 = new Date(now); d7.setDate(now.getDate() - 7);
  const d1 = new Date(now); d1.setHours(0, 0, 0, 0);
  const dMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const safeNum = (n: any) => (typeof n === "number" && !isNaN(n) ? n : 0);

  const totalSold = (orders ?? []).filter((o: any) => o.status !== "Cancelled").length;

  const totalProducts = products?.length ?? 0;

  const totalRevenue = (orders ?? [])
    .filter((o: any) => o.status !== "Cancelled")
    .reduce((s, o: any) => s + safeNum(o.total_price), 0);

  const revenueLast30Days = (orders ?? [])
    .filter((o: any) => o.status !== "Cancelled" && new Date(o.created_at) >= d30)
    .reduce((s, o: any) => s + safeNum(o.total_price), 0);

  const revenueLast7Days = (orders ?? [])
    .filter((o: any) => o.status !== "Cancelled" && new Date(o.created_at) >= d7)
    .reduce((s, o: any) => s + safeNum(o.total_price), 0);


  const totalSoldLastMonth = (orders ?? [])
    .filter((o: any) => o.status !== "Cancelled" && new Date(o.created_at) >= dMonth)
    .length;

  const totalSoldLastWeek = (orders ?? [])
    .filter((o: any) => o.status !== "Cancelled" && new Date(o.created_at) >= d7)
    .length;

  const ordersToday = (orders ?? [])
    .filter((o: any) => o.status !== "Cancelled" && new Date(o.created_at) >= d1)
    .length;


  const avgOrderValue = totalSold ? +(totalRevenue / totalSold).toFixed(2) : 0;

  const outOfStock = (products ?? []).filter((p: any) => !p.in_stock || safeNum(p.quantity) <= 0).length;
  const lowStock = (products ?? []).filter((p: any) => safeNum(p.quantity) > 0 && safeNum(p.quantity) <= 5).length;
  const newProducts30d = (products ?? []).filter((p: any) => new Date(p.created_at) >= d30).length;

  const activeCategories = categories?.length ?? 0;

  const statusCounts = (orders ?? []).reduce((acc: any, o: any) => {
    const k = (o.status || "unknown").toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  // ordersByDay (last 30 days): {date, orders, revenue}
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const last30: Record<string, { orders: number; revenue: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    last30[dayKey(d)] = { orders: 0, revenue: 0 };
  }
  for (const o of (orders ?? [])) {
    const k = dayKey(new Date(o.created_at));
    if (last30[k]) {
      last30[k].orders += 1;
      last30[k].revenue += safeNum((o as any).total_price);
    }
  }
  const ordersByDay = Object.entries(last30).map(([date, v]) => ({
    date,
    orders: v.orders,
    revenue: +v.revenue.toFixed(2),
  }));

  // topProducts (reuses your existing util)
  const topProducts = await fetchTopSoldProducts(); // id, name, main_image, totalSold

  return {
    // original
    totalSold,
    totalSoldLastMonth,
    totalSoldLastWeek,
    totalProducts,
    // new KPIs
    totalRevenue,
    revenueLast30Days,
    revenueLast7Days,
    avgOrderValue,
    ordersToday,
    outOfStock,
    lowStock,
    newProducts30d,
    activeCategories,
    statusCounts,
    // charts
    ordersByDay,
    topProducts,
  };
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("products")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) {
    console.error("Error marking product as deleted:", error.message);
    return false;
  }

  return true;
};

type Attribute = {
  id: number;
  name: string;
};

type AttributeItem = {
  attribute_id: number;
  name: string;
  price: number;
  in_stock: boolean;
  v_quantity: number;
};





export async function fetchProductById(productId: string) {
  // 1. Get the product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    console.error("❌ Failed to fetch product:", productError?.message);
    return null;
  }

  // 2. Get attribute items for the product
  const { data: items, error: itemsError } = await supabase
    .from("attribute_item")
    .select("*, attribute_id")
    .eq("product_id", productId);

  if (itemsError) {
    console.error("❌ Failed to fetch attribute items:", itemsError.message);
    return { ...product, attribute_items: [] };
  }

  // 3. Get attribute names (only for used IDs)
  const usedAttributeIds = Array.from(new Set(items.map(i => i.attribute_id)));

  const { data: attributes, error: attrError } = await supabase
    .from("attributes")
    .select("id, name")
    .in("id", usedAttributeIds);

  if (attrError) {
    console.error("❌ Failed to fetch attributes:", attrError.message);
  }

  const attributeMap = Object.fromEntries(
    (attributes || []).map(attr => [attr.id, attr.name])
  );

  // 4. Attach attribute_name to each item
  const attribute_items = items.map(item => ({
    ...item,
    attribute_name: attributeMap[item.attribute_id] || "Unknown",
  }));

  // 5. Return combined result
  return {
    ...product,
    attribute_items,
  };
}



type DynamicVariant = {
  variant_id?: number;  // 🛡️ was string (uuid), now number (BIGINT)
  product_id: string;
  in_stock: boolean;
  price_modifier?: number;
  v_quantity: number;
  attribute_items: {
    attribute_id: number;
    attribute_item_id: number;
  }[];
};



export async function saveProductAttributeItems(
  productId: string,
  attributes: Attribute[],
  items: AttributeItem[]
) {


  // We will store a map: (temp attribute id) => (real attribute id from DB)
  const finalAttributeMap: Record<number, number> = {};

  // ---------------------------------------
  // Step 1: Insert each Attribute
  // ---------------------------------------

  for (const attr of attributes) {

    const { data: inserted, error: insertErr } = await supabase
      .from("attributes")
      .insert({ name: attr.name })
      .select("id") // we need the new ID
      .single();    // only one record

    if (insertErr) {
      console.error("❌ Error inserting into 'attributes' table:", insertErr.message);
      continue; // move to next attribute
    }


    // Map temporary ID (frontend ID) → real database ID
    finalAttributeMap[attr.id] = inserted.id;

    // Now insert into 'product_attribute' table to link product to attribute
    const { error: linkErr } = await supabase
      .from("product_attribute")
      .insert({
        product_id: productId,
        attribute_id: inserted.id,
      });

    if (linkErr) {
      console.error("❌ Error inserting into 'product_attribute' table:", linkErr.message);
    } else {

    }
  }

  // ---------------------------------------
  // Step 2: Prepare Attribute Items with real Attribute IDs
  // ---------------------------------------

  const attributeItemsToInsert = items.map((item) => ({
    product_id: productId,
    attribute_id: finalAttributeMap[item.attribute_id], // use real DB ID
    name: item.name,
    price: item.price,
    in_stock: item.in_stock,
    quantity: item.v_quantity
  }));


  // ---------------------------------------
  // Step 3: Insert all Attribute Items
  // ---------------------------------------

  const { data: insertedItems, error: itemInsertErr } = await supabase
    .from("attribute_item")
    .insert(attributeItemsToInsert)
    .select("*"); // get all columns of inserted items

  if (itemInsertErr) {
    console.error("❌ Error inserting into 'attribute_item' table:", itemInsertErr.message);
    return []; // if error, return empty array
  }


  // Return inserted attribute items to caller
  return insertedItems;
}
export async function deleteProductAttributeData(productId: string) {
  // console.log("🧹 Starting hard delete of all attribute-related data for product:", productId);

  // Step 1: Delete from attribute_item
  const { error: deleteItemsErr } = await supabase
    .from("attribute_item")
    .delete()
    .eq("product_id", productId);

  if (deleteItemsErr) {
    console.error("❌ Error deleting from 'attribute_item':", deleteItemsErr.message);
  } else {
    console.log("✅ Deleted attribute items for product:", productId);
  }

  // Step 2: Delete from product_attribute
  const { data: attrLinks, error: fetchLinksErr } = await supabase
    .from("product_attribute")
    .select("attribute_id")
    .eq("product_id", productId);

  const attributeIds = attrLinks?.map((link) => link.attribute_id) || [];

  const { error: deleteLinksErr } = await supabase
    .from("product_attribute")
    .delete()
    .eq("product_id", productId);

  if (deleteLinksErr) {
    console.error("❌ Error deleting from 'product_attribute':", deleteLinksErr.message);
  } else {
    console.log("✅ Deleted product-attribute links for product:", productId);
  }

  // Step 3: Delete from attributes (optional: only delete ones that were linked to this product)
  if (attributeIds.length > 0) {
    const { error: deleteAttrsErr } = await supabase
      .from("attributes")
      .delete()
      .in("id", attributeIds);

    if (deleteAttrsErr) {
      console.error("❌ Error deleting from 'attributes':", deleteAttrsErr.message);
    } else {
      console.log("✅ Deleted attributes:", attributeIds);
    }
  } else {
    console.log("ℹ️ No attributes found to delete.");
  }

  console.log("✅ Finished hard delete for product:", productId);
}

export const saveProductVariants = async (variants: DynamicVariant[]) => {
  console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅");

  console.log(variants)


  console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅");

  for (const variant of variants) {
    // 🟠🟠🟠 Step 1: Insert variant row and get its real BIGINT id
    const { data: insertedVariant, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: Number(variant.product_id),
        in_stock: variant.in_stock,
        price_modifier: variant.price_modifier ?? 0,
        quantity: variant.v_quantity ?? 0,
        deleted_at: null,
      })
      .select("id")
      .single();

    if (variantError || !insertedVariant) {
      console.error("❌ Error inserting variant:", variantError?.message);
      continue;
    }

    const variant_id = insertedVariant.id;

    // 🟠🟠🟠 Step 2: Soft delete old variant items (by variant_id)
    await supabase
      .from("product_variant_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("variant_id", variant_id)
      .is("deleted_at", null);


    // 🟠🟠🟠 Step 3: Create variant-attribute mappings
    const variantItems = variant.attribute_items.map((item) => ({
      variant_id,
      attribute_id: Number(item.attribute_id),  // 🆗 cast to number
      attribute_item_id: Number(item.attribute_item_id), // 🆗 cast to number
    }));


    const { error } = await supabase
      .from("product_variant_items")
      .insert(variantItems);

    if (error) {
      console.error("❌ Error saving variant items:", error.message);
    } else {
    }


  }
};
export const deleteProductVariants = async (productId: number) => {
  console.log("🧹 Starting hard delete of variants for product:", productId);

  // Step 1: Fetch all existing variant IDs for the product
  const { data: existingVariants, error: fetchError } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  if (fetchError) {
    console.error("❌ Error fetching variants:", fetchError.message);
    return;
  }

  const variantIds = existingVariants?.map(v => v.id) || [];

  if (variantIds.length === 0) {
    console.log("ℹ️ No variants found for product:", productId);
    return;
  }

  // Step 2: Delete related variant items
  const { error: deleteItemsError } = await supabase
    .from("product_variant_items")
    .delete()
    .in("variant_id", variantIds);

  if (deleteItemsError) {
    console.error("❌ Error deleting variant items:", deleteItemsError.message);
  } else {
    console.log("✅ Deleted variant items for product:", productId);
  }

  // Step 3: Delete the variants themselves
  const { error: deleteVariantsError } = await supabase
    .from("product_variants")
    .delete()
    .in("id", variantIds);

  if (deleteVariantsError) {
    console.error("❌ Error deleting variants:", deleteVariantsError.message);
  } else {
    console.log("✅ Deleted product variants for product:", productId);
  }
};






export const updateProductVariants = async (
  productId: number,
  variants: DynamicVariant[]
) => {
  console.log("🚀 updateProductVariants called with:");
  console.log("🔹 productId:", productId);
  console.log("🔹 variants:", variants);

  // 🔴 Step 1: Get all existing variant IDs for this product
  const { data: existingVariants, error: fetchError } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  if (fetchError) {
    console.error("❌ Failed to fetch existing variants:", fetchError.message);
    return;
  }

  console.log("🟢 Existing variants fetched:", existingVariants);

  const existingVariantIds = existingVariants?.map((v) => v.id) ?? [];

  // 🔴 Step 2: Delete all variant items related to those variants
  // Deleting related entries
  if (existingVariantIds.length > 0) {
    console.log("🗑 Deleting variant items for variant IDs:", existingVariantIds);

    const { error: deleteItemsError } = await supabase
      .from("product_variant_items")
      .delete()
      .in("variant_id", existingVariantIds);
    if (deleteItemsError) {
      console.error("❌ Failed to delete from product_variant_items:", deleteItemsError.message);
    } else {
      console.log("✅ product_variant_items deleted successfully");
    }

    const { error: deleteAttrError } = await supabase
      .from("product_attribute")
      .delete()
      .eq("product_id", productId);
    if (deleteAttrError) {
      console.error("❌ Failed to delete from product_attribute:", deleteAttrError.message);
    } else {
      console.log("✅ product_attribute deleted successfully");
    }

    const { error: deleteAttrItemError } = await supabase
      .from("attribute_item")
      .delete()
      .eq("product_id", productId);
    if (deleteAttrItemError) {
      console.error("❌ Failed to delete from attribute_item:", deleteAttrItemError.message);
    } else {
      console.log("✅ attribute_item deleted successfully");
    }

    const { error: deleteVariantsError } = await supabase
      .from("product_variants")
      .delete()
      .in("id", existingVariantIds);
    if (deleteVariantsError) {
      console.error("❌ Failed to delete from product_variants:", deleteVariantsError.message);
    } else {
      console.log("✅ product_variants deleted successfully");
    }
  } else {
    console.log("⚠️ No existing variants found to delete");
  }

  // 🟢 Step 4: Insert new variants and their items
  for (const variant of variants) {
    console.log("📝 Inserting new variant:", {
      product_id: productId,
      in_stock: variant.in_stock,
      price_modifier: variant.price_modifier ?? 0,
    });

    const { data: insertedVariant, error: insertError } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        in_stock: variant.in_stock,
        price_modifier: variant.price_modifier ?? 0,
      })
      .select("id")
      .single();

    if (insertError || !insertedVariant) {
      console.error("❌ Error inserting variant:", insertError?.message);
      continue;
    }

    console.log("✅ Inserted variant ID:", insertedVariant.id);

    const variant_id = insertedVariant.id;

    const variantItems = variant.attribute_items.map((item) => ({
      variant_id,
      attribute_id: Number(item.attribute_id),
      attribute_item_id: Number(item.attribute_item_id),
    }));

    console.log("📦 Inserting variant items:", variantItems);

    const { error: insertItemsError } = await supabase
      .from("product_variant_items")
      .insert(variantItems);

    if (insertItemsError) {
      console.error("❌ Error inserting variant items:", insertItemsError.message);
    } else {
      console.log("✅ Variant items inserted successfully");
    }
  }

  console.log("🎉 updateProductVariants completed!");
};








export const softDeleteVariantsForProduct = async (product_id: string) => {
  const deleted_at = new Date().toISOString();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", product_id)
    .is("deleted_at", null);

  const variantIds = variants?.map((v) => v.id) ?? [];

  if (variantIds.length === 0) return;

  await supabase
    .from("product_variants")
    .update({ deleted_at })
    .in("id", variantIds);

  await supabase
    .from("product_variant_items")
    .update({ deleted_at })
    .in("variant_id", variantIds);
};


export async function fetchAttributesByIds(attributeIds: number[]) {
  const { data, error } = await supabase
    .from('attributes')
    .select('id, name')
    .in('id', attributeIds);

  if (error) {
    console.error("❌ Failed to fetch attributes:", error.message);
    throw new Error(error.message);
  }

  return data;
}


export async function fetchVariants(productId: string) {

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, price_modifier, in_stock , image_path, quantity")
    .eq("product_id", productId)
    .is("deleted_at", null);

  if (variantsError) {
    console.error("❌ Error fetching product_variants:", variantsError);
    return [];
  }

  const variantIds = variants.map((v) => v.id);

  const { data: variantItems, error: variantItemsError } = await supabase
    .from("product_variant_items")
    .select("variant_id, attribute_id, attribute_item_id")
    .in("variant_id", variantIds);

  if (variantItemsError) {
    console.error("❌ Error fetching product_variant_items:", variantItemsError);
    return [];
  }

  const attributeIds = [...new Set(variantItems.map((vi) => vi.attribute_id))];
  const attributeItemIds = [...new Set(variantItems.map((vi) => vi.attribute_item_id))];

  const { data: attributes } = await supabase
    .from("attributes")
    .select("id, name")
    .in("id", attributeIds);

  const { data: attributeItems } = await supabase
    .from("attribute_item")
    .select("id, name")
    .in("id", attributeItemIds);

  const attributeMap = Object.fromEntries((attributes ?? []).map((a) => [a.id, a.name]));
  const attributeItemMap = Object.fromEntries((attributeItems ?? []).map((ai) => [ai.id, ai.name]));

  const finalVariants = variants.map((variant) => {
    const itemsForVariant = variantItems.filter((vi) => vi.variant_id === variant.id);

    return {
      id: variant.id, // << VERY IMPORTANT - Add this line
      attributes: itemsForVariant.map((item) => ({
        attribute_id: item.attribute_id, // << Add this
        attribute: attributeMap[item.attribute_id],
        attribute_item: attributeItemMap[item.attribute_item_id],
      })),
      in_stock: variant.in_stock,
      price_modifier: variant.price_modifier,
      quantity: variant.quantity,
      image_path: variant.image_path || null, // Add image_path if available
    };
  });


  return finalVariants;
}


interface VariantUpdateInput {
  id: string;
  price_modifier: number;
  in_stock: boolean;
}

export async function updateVariants(variants: VariantUpdateInput[]) {

  if (!variants.length) return { success: true };

  // Step 1: Prepare individual update promises
  const updatePromises = variants.map((variant) =>
    supabase
      .from("product_variants")
      .update({
        price_modifier: variant.price_modifier,
        in_stock: variant.in_stock,
      })
      .eq("id", variant.id)
      .is("deleted_at", null) // Optional: only if you want to make sure updating non-deleted ones
  );

  // Step 2: Execute all updates in parallel
  const results = await Promise.all(updatePromises);

  // Step 3: Check if any error occurred
  const hasError = results.some((res) => res.error);

  if (hasError) {
    console.error("❌ Some variants failed to update:", results);
    return { success: false };
  }

  return { success: true };
}


export async function removeProductCategory(productId: string, categoryId: string) {
  const { error } = await supabase
    .from("product_category")
    .delete()
    .match({ product_id: productId, category_id: categoryId });

  if (error) {
    console.error("❌ Failed to remove category:", error.message);
    throw new Error(error.message);
  }
}

export async function saveProductCategories(productId: string, categoryIds: number[]) {
  if (!Array.isArray(categoryIds)) {
    console.error("❌ saveProductCategories: categoryIds is not an array");
    throw new Error("Invalid category IDs.");
  }

  const { data, error } = await supabase
    .from('product_category')
    .upsert(
      categoryIds.map((categoryId) => ({
        product_id: productId,
        category_id: categoryId,
        store_id: store_id,
      })),
      {
        onConflict: 'product_id,category_id',
        ignoreDuplicates: true, // 👈 ignore conflicts automatically
      }
    );

  if (error) {
    console.error("❌ Failed to save product categories:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export const updateOrderStatus = async (orderId: number, newStatus: string) => {
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("phone_number_1, customer_name")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order status:", error);
    return false;
  }

  // Send WhatsApp notification
  if (order && order.phone_number_1) {
    try {
      let statusMsg = "";
      switch (newStatus) {
        case "Shipped":
          statusMsg = `تم شحن طلبك بنجاح! 🚚`;
          break;
        case "Delivered":
          statusMsg = `تم توصيل طلبك بنجاح. شكراً لتسوقك معنا! 😊`;
          break;
        case "Cancelled":
          statusMsg = `نعتذر، تم إلغاء طلبك.`;
          break;
        default:
          statusMsg = `تم تحديث حالة طلبك إلى: ${newStatus}`;
      }

      const message = `مرحباً ${order.customer_name}،\n${statusMsg}\nرقم الطلب: #${orderId}`;

      await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [order.phone_number_1],
          message: message,
        }),
      });
    } catch (err) {
      console.error("Failed to send status update WhatsApp:", err);
    }
  }

  return true;
};


export const fetchCategoryLinks = async (): Promise<{ category_id: number; product_id: number }[]> => {
  try {
    const { data, error } = await supabase
      .from("product_category")
      .select("category_id, product_id")
      .eq("store_id", store_id);

    if (error) {
      console.error("❌ Error fetching category links:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❗ Unexpected error:", err);
    return [];
  }
};


export const fetchTopSoldProducts = async () => {
  try {
    // 1. Fetch order_product entries joined with orders to filter by store
    const { data: orderProducts, error } = await supabase
      .from("order_product")
      .select("product_id, amount, orders(store_id)")
      .gte("amount", 1); // Optional filter to exclude invalid entries

    if (error) throw error;

    // 2. Filter by store_id
    const filtered = orderProducts.filter((entry: any) => entry.orders?.store_id === store_id);

    // 3. Count total sold per product_id
    const countMap: Record<number, number> = {};
    for (const item of filtered) {
      const productId = item.product_id;
      const amount = item.amount || 0;
      countMap[productId] = (countMap[productId] || 0) + amount;
    }

    const topProductIds = Object.entries(countMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([id]) => Number(id));

    if (topProductIds.length === 0) return [];

    // 4. Fetch product info
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, name, secondary_name, main_image")
      .in("id", topProductIds);

    if (prodError) throw prodError;

    // 5. Merge and return
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      main_image: p.main_image,
      totalSold: countMap[p.id] || 0,
    }));
  } catch (err) {
    console.error("❌ Error in fetchTopSoldProducts:", err);
    return [];
  }
};

export const fetchRecentOrders = async () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", store_id)
    .gte("created_at", threeDaysAgo.toISOString()) // ⬅️ Only last 3 days
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }

  return data || [];
};

export async function updateVariantImagePath(variantId: string, imagePath: string) {
  const { error } = await supabase
    .from('product_variants')
    .update({ image_path: imagePath })
    .eq('id', variantId);

  if (error) {
    console.error(`❌ Failed to update image for variant ${variantId}:`, error);
    return false;
  }

  return true;
}


export async function fetchDiscountByCode(code: string): Promise<DiscountCode | null> {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, discount_value, min_value, valid_until, store_id, created_at, is_active")
    .eq("store_id", store_id)
    .eq("is_active", true)
    .gte("valid_until", today)
    .ilike("code", code.trim().toUpperCase())
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("fetchDiscountByCode error", error)
    return null
  }
  return data ?? null
}


// Fetch
export async function fetchDiscountCodes(): Promise<DiscountCode[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, discount_value, min_value, valid_until, store_id, created_at, is_active")
    .eq("store_id", store_id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

// Create
export async function addDiscountCode(code: Omit<DiscountCode, "id" | "created_at">): Promise<DiscountCode | null> {
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: code.code,
      discount_value: code.discount_value,
      min_value: code.min_value,
      valid_until: code.valid_until,
      store_id: store_id,
      is_active: code.is_active ?? true
    })
    .select("id, code, discount_value, min_value, valid_until, store_id, created_at, is_active")
    .single()

  if (error) throw error
  return data
}

// Delete
export async function deleteDiscountCodeById(id: string): Promise<boolean> {
  const { error } = await supabase.from("coupons").delete().eq("id", Number(id))
  if (error) return false
  return true
}

// Update (partial)
export async function updateDiscountCode(id: string, updates: Partial<DiscountCode>): Promise<boolean> {
  // prevent updating primary keys/store_id by mistake
  const { error } = await supabase
    .from("coupons")
    .update({
      ...(updates.code !== undefined ? { code: updates.code } : {}),
      ...(updates.discount_value !== undefined ? { discount_value: updates.discount_value } : {}),
      ...(updates.min_value !== undefined ? { min_value: updates.min_value } : {}),
      ...(updates.valid_until !== undefined ? { valid_until: updates.valid_until } : {}),
      ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {})
    })
    .eq("id", Number(id))

  if (error) return false
  return true
}

// Fetch low stock products (quantity <= 5)
export async function fetchLowStockProducts() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, secondary_name, main_image, quantity")
      .eq("store_id", store_id)
      .lte("quantity", 5)
      .order("quantity", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("❌ Error in fetchLowStockProducts:", err);
    return [];
  }
}

// Get order status breakdown
export async function getOrderStatusBreakdown() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("status")
      .eq("store_id", store_id);

    if (error) throw error;

    // Count by status
    const breakdown: Record<string, number> = {};
    data.forEach((order) => {
      breakdown[order.status] = (breakdown[order.status] || 0) + 1;
    });

    return breakdown;
  } catch (err) {
    console.error("❌ Error in getOrderStatusBreakdown:", err);
    return {};
  }
}
