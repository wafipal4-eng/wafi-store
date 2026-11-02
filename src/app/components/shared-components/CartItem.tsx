'use client';

import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { main_color } from '@/app/lib/constants';
import { fetchVariants } from '@/app/lib/productService';
import { isDisabled } from '@/lib/variantUtils';
import QuantityInput from '@/app/components/shared-components/QuantityInput';
import { useCart } from '@/app/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { isQuantityAvailable } from "@/app/lib/productHelper";
import { AlertCircle } from "lucide-react"
import { cdn } from '@/lib/cdn';
import { getProductName } from '@/app/lib/nameHelpers';
import Image from "next/image";

interface CartItemProps {
  product: {
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
  isUnavailable?: boolean;
  onRemove: (addedAt: number) => void;
  onAttributeChange: (attr: string, value: string, addedAt: number) => void;
  onQuantityChange: (quantity: number, addedAt: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ product }) => {
  const t = useTranslations('CartItem');
  const locale = useLocale();
  const productName = getProductName(product as any, locale);
  const isRtl = ['ar', 'he', 'fa', 'ur'].includes(locale);

  const { cart, updateItem, removeFromCart } = useCart();
  const liveItem = cart.find((i) => i.addedAt === product.addedAt) || product;

  const [variants, setVariants] = useState<any[]>([]);
  const [selected, setSelected] = useState(liveItem.selectedAttributes || {});
  const [visible, setVisible] = useState(true);
  const [localUnavailable, setLocalUnavailable] = useState(false);

  useEffect(() => {
    const loadVariants = async () => {
      try {
        const res = await fetchVariants(String(product.product_id));
        setVariants(res || []);
      } catch (err) {
        console.error('❌ Failed to fetch variants:', err);
      }
    };
    loadVariants();
  }, [product.product_id]);


  useEffect(() => {
    const checkQuantity = async () => {
      if (!selected || Object.keys(selected).length === 0) return;

      const liveQuantity = liveItem.quantity;

      const isValid = await isQuantityAvailable(
        product.product_id,
        selected,
        liveQuantity
      );

      setLocalUnavailable(!isValid); // update red warning
    };

    checkQuantity();
  }, [selected, product.product_id, liveItem.quantity]);


  const getModifiedPrice = () => {
    const matchedVariant = variants.find((variant) => {
      const variantAttrs = variant.attributes || [];

      const match = variantAttrs.every((attr: { attribute: string; attribute_item: string }) => {
        const selVal = selected[attr.attribute];
        return (
          selVal &&
          String(selVal).toLowerCase() === String(attr.attribute_item).toLowerCase()
        );
      });

      return match;
    });

    if (!matchedVariant) {
      console.warn("⚠️ No matching variant found for:", selected);
    } else {
    }

    const priceModifier = matchedVariant?.price_modifier ?? 0;
    const basePrice = product.base_price ?? product.price;
    console.log(`Base price: ${basePrice}, Modifier: ${priceModifier}, Final: ${basePrice + priceModifier}`);
    return basePrice + priceModifier;
  };



  const choose = (attr: string, value: string) => {
    if (isDisabled(attr, value, selected, variants)) return;
    const updated = { ...selected, [attr]: value };
    setSelected(updated);
    updateItem(product.addedAt, { selectedAttributes: updated });
  };

  const changeQuantity = async (val: number) => {
    updateItem(product.addedAt, { quantity: val });
  };


  const handleRemove = () => {
    setVisible(false); // triggers animation
    setTimeout(() => {
      removeFromCart(product.addedAt); // update context & localStorage
    }, 200); // delay to let animation finish
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mb-4"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="grid grid-cols-4 gap-4 items-start">
            <Link
              href={`/ProductInfo/${product.product_id}`}
              prefetch={false}
              className="relative w-12 h-12 md:w-24 md:h-24 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image
                src={cdn(product.image || '')}
                alt={product.name}
                width={96}
                height={96}
                className="object-contain"
                sizes="(max-width: 768px) 48px, 96px"
                quality={75}
              />
            </Link>

            <div className="col-span-2 flex flex-col gap-y-2">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm md:text-base font-semibold text-gray-900">{productName}</h3>
                <p className="text-gray-600 text-sm">
                  {t('currency', { price: getModifiedPrice() })}
                </p>
              </div>

              <QuantityInput
                value={liveItem.quantity}
                onChange={changeQuantity}
                label={t('quantity')}
                min={0}
              />
            </div>

            <div className="col-span-1 flex flex-col justify-between items-end h-full">
              <button
                onClick={handleRemove}
                className="text-red-500 text-lg hover:scale-125 transition"
                aria-label={t('removeItem')}
              >
                <FaTimes />
              </button>
              <p className="text-black text-sm mt-auto font-bold">
                {t('currency', { price: getModifiedPrice() * liveItem.quantity })}
              </p>
            </div>
          </div>

          <hr className="mt-4" style={{ borderColor: main_color }} />
          {localUnavailable && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mt-1">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">{t("SorryQuantityNotAvailable")}</p>
            </div>)}

          {product.attributeOptions &&
            Object.entries(product.attributeOptions).map(([attrName, items]) => (
              <div key={attrName} className="mt-4">
                <h4 className="text-lg font-bold text-black mb-2">
                  {(attrName.toLowerCase()) || attrName}
                </h4>

                <div className="flex flex-wrap gap-2">
                  {items.map((item: any) => {
                    const disabled = isDisabled(attrName, item.name, selected, variants);
                    const active = selected[attrName] === item.name;

                    return (
                      <button
                        key={item.id || item.name}
                        disabled={disabled}
                        onClick={() => choose(attrName, item.name)}
                        className={`
                          rounded-full px-4 py-2 text-sm
                          ${active ? 'text-white' : 'text-gray-800'}
                          ${disabled ? 'bg-gray-100 opacity-60 cursor-not-allowed' :
                            active ? '' : 'hover:bg-gray-50'}
                        `}
                        style={{
                          backgroundColor: active ? main_color : undefined,
                          border: active ? 'none' : '1px solid #ccc',
                        }}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartItem;
