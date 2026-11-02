export type Attribute = {
  id: number;
  name: string;
};

export type AttributeItem = {
  id: string;
  attribute_id: number;
  name: string;
  price: number;
  in_stock: boolean;
  v_quantity: number;
};

export type VariantCombination = {
  [key: string]: string | boolean | number | undefined;
  in_stock: boolean;
  v_quantity?: number;
  price_modifier?: number;
};

