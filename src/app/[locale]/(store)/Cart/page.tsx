'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import CartItem from '@/app/components/shared-components/CartItem';
import OrderSummary from '@/app/components/shared-components/OrderSummery';
import { isQuantityAvailable } from '@/app/lib/productHelper';

// Local cart item type
type LocalCartItem = {
  product_id: number;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  base_price?: number;
  selectedAttributes: Record<string, string>;
  attributeOptions: Record<string, any[]>;
  addedAt: number;
};

const Page = () => {
  const t = useTranslations('Cart');
  const [cartProducts, setCartProducts] = useState<LocalCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailableItems, setUnavailableItems] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const stored = localStorage.getItem("cart");
      if (!stored) {
        setLoading(false);
        return;
      }

      const parsedCart = JSON.parse(stored);
      setCartProducts(parsedCart);

      const unavailable: number[] = [];

      for (const item of parsedCart) {
        const res = await isQuantityAvailable(
          item.product_id,
          item.selectedAttributes,
          item.quantity
        );

        if (!res) {
          unavailable.push(item.addedAt);
        }
      }

      setUnavailableItems(unavailable);
      setLoading(false);
    };

    loadData();
  }, []);


  const handleRemove = (addedAt: number) => {
    const updated = cartProducts.filter((item) => item.addedAt !== addedAt);
    setCartProducts(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const handleAttributeChange = async (attr: string, value: string, addedAt: number) => {
    const updated = cartProducts.map((item) => {
      if (item.addedAt !== addedAt) return item;
      return {
        ...item,
        selectedAttributes: {
          ...item.selectedAttributes,
          [attr]: value,
        },
      };
    });

    setCartProducts(updated);
    localStorage.setItem("cart", JSON.stringify(updated));

    // ✅ Recheck availability
    const changedItem = updated.find((i) => i.addedAt === addedAt);
    if (!changedItem) return;

    const isValid = await isQuantityAvailable(
      changedItem.product_id,
      changedItem.selectedAttributes,
      changedItem.quantity
    );

    setUnavailableItems((prev) => {
      const exists = prev.includes(addedAt);
      if (!isValid && !exists) return [...prev, addedAt];
      if (isValid && exists) return prev.filter((id) => id !== addedAt);
      return prev;
    });
  };


  const handleQuantityChange = async (quantity: number, addedAt: number) => {
    const item = cartProducts.find((i) => i.addedAt === addedAt);
    if (!item) return;

    const isValid = await isQuantityAvailable(
      item.product_id,
      item.selectedAttributes,
      quantity
    );

    // ✅ Update unavailableItems based on result
    setUnavailableItems((prev) => {
      const exists = prev.includes(addedAt);
      if (!isValid && !exists) return [...prev, addedAt];
      if (isValid && exists) return prev.filter((id) => id !== addedAt);
      return prev;
    });

    if (!isValid) return;

    const updated = cartProducts.map((i) => {
      if (i.addedAt !== addedAt) return i;
      return {
        ...i,
        quantity,
      };
    });

    setCartProducts(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-center py-10 text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      <div className="flex justify-center items-center">
        <div className="flex flex-col gap-4 w-full m-4">
          {cartProducts.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">{t('empty')}</p>
          ) : (
            cartProducts.map((product) => (
              <CartItem
                key={`${product.product_id}-${product.addedAt}`}
                product={product}
                isUnavailable={unavailableItems.includes(product.addedAt)} // 👈 Pass this
                onRemove={handleRemove}
                onAttributeChange={handleAttributeChange}
                onQuantityChange={handleQuantityChange}
              />

            ))
          )}
        </div>
      </div>

      <div className="mx-auto">
        <div className="sticky top-20">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
};

export default Page;
