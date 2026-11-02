export interface ContactInfoProps {
  options: string;
  amount: number;
  total_price: number;
  disabled?: boolean;
}

export interface DiscountCode {
  id: number
  code: string
  discount_value: number
  min_value: number
  valid_until: string
  store_id: number
  created_at: string
  is_active?: boolean
}

export interface Order {
  id: string;
  customer_name: string;
  total_price: number;
  city: string;
  address: string;
  status: string;
  phone_number_1: string;
  phone_number_2: string | null;
  notes: string | null;
  created_at: string;
  final_price?: number | null;
  coupon?: string | null;
  shipping_cost?: number | null;
}

export interface Product {
  id: string;
  name: string;
  secondary_name?: string;
  description: string;
  secondary_description?: string;
  price: number;
  new_price: number;
  quantity?: number;
  main_image: string | null;
  in_stock: boolean;
}

// export interface Category {
//   id: string;
//   name: string;
//   created_at?: string;
// }


export type Revenue = {
  month: string;
  revenue: number;
};

export interface RevenueChartInterface {
  data: Revenue[];
  steps?: number;
}

export interface JoinedProduct {
  product: Product;
  category: { name: string };
}

export type Attribute = {
  id: number;       // Temporary local ID
  name: string;
};

export type AttributeItem = {
  product_id: string;
  attribute_id: number;
  name: string;
  price: number;
  in_stock: boolean;
};

// app/lib/interfaces.ts
export type Category = {
  id: string;
  name: string;
  secondary_name?: string;
  description?: string;
  secondary_description?: string;
  store_id: number;
  orderby: number | null;   // <- ensure present
  is_visible: boolean;      // <- ensure present
  parent_id?: string | number | null; // <- add this
  extras?: { image_path?: string | null } | null;
};
