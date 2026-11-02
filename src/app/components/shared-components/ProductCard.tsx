'use client';

import React, { useEffect, useState } from 'react';
import { LiaShoppingBagSolid } from 'react-icons/lia';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { useTranslations } from 'next-intl';
import { Product } from '@/app/lib/interfaces';
import { main_color } from '@/app/lib/constants';
import { toast } from 'sonner';
import { fetchProductById } from '@/app/lib/productService';
import { cdn } from '@/lib/cdn';
import { getProductName } from '@/app/lib/nameHelpers';
import { useLocale } from 'next-intl';

interface ProductCardProps {
  product: Product;
}

const getEffectivePrice = (product: any) => {
  if (!product.new_price || product.new_price === 0) {
    return product.price;
  }
  return product.new_price;
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const t = useTranslations('ProductCard');
  const locale = useLocale();
  const { addToCart } = useCart();
  const [added, setAddedToCart] = useState(false);

  const productName = getProductName(product, locale);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const parsed = JSON.parse(storedCart);
      const isInCart = parsed.some(
        (item: { product_id: number }) => item.product_id === Number(product.id)
      );
      setAddedToCart(isInCart);
    }
  }, [product.id]);

  const cartHandle = async () => {
    const fullProduct = await fetchProductById(product.id);
    const selectedAttributes: Record<string, string> = {};

    if (fullProduct?.attribute_items?.length) {
      const attrMap: Record<string, { attribute_name: string; name: string }[]> = {};
      fullProduct.attribute_items.forEach((item: { attribute_name: string; name: string }) => {
        attrMap[item.attribute_name] ??= [];
        attrMap[item.attribute_name].push(item);
      });

      for (const [attrName, items] of Object.entries(attrMap)) {
        const random = items[Math.floor(Math.random() * items.length)];
        selectedAttributes[attrName] = random.name;
      }

      addToCart({
        product_id: Number(product.id),
        image: product.main_image,
        quantity: 1,
        selectedAttributes,
        attributeOptions: attrMap,
        name: productName,
        price: getEffectivePrice(product),
      });
    } else {
      addToCart({
        product_id: Number(product.id),
        image: product.main_image,
        quantity: 1,
        selectedAttributes: {},
        attributeOptions: {},
        name: productName,
        price: getEffectivePrice(product),
      });
    }

    toast.success(t("AddedToCart"));
    setAddedToCart(true);
  };


  const discountPercentage =
    product.new_price !== null &&
      product.new_price !== 0 &&
      product.price > product.new_price
      ? Math.round(((product.price - product.new_price) / product.price) * 100)
      : null;

  return (
    <div className="relative p-2 rounded-xl shadow-3xl cursor-pointer h-full flex flex-col">
      {/* Discount Badge */}
      {discountPercentage && (
        <div className="absolute top-2 left-2 bg-red-500 bg-opacity-50 text-white text-[11px] font-semibold px-2 py-[2px] rounded-full shadow-md backdrop-blur-sm z-10">
          {discountPercentage}%
        </div>
      )}

      {/* Out of Stock Badge */}
      {!product.in_stock && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md z-10">
          {t('OutOfStock')}
        </div>
      )}

      {/* Product Link */}
      <Link
        href={`/ProductInfo/${product.id}`}
        prefetch={false}
        passHref
        className="flex-grow flex flex-col"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100">
          <Image
            src={cdn(product.main_image || '') ?? '/fallback.jpg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            quality={75}
            loading="lazy"
            className="object-cover hover:scale-104 transition-transform duration-300"
          />
        </div>

        <div className="text-center mt-4 flex-grow flex flex-col justify-start">
          <h5 className="text-md font-bold text-gray-900 min-h-[2.5rem]">{productName}</h5>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ₪ {product.new_price != null && product.new_price !== 0 ? product.new_price : product.price}
            </span>
            {product.new_price != null && product.new_price !== 0 && (
              <span className="text-red-500 line-through text-sm">₪ {product.price}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="mt-auto flex items-center justify-between gap-1">
        <button
          disabled={!product.in_stock}
          className={`px-2 py-1 text-white rounded-xl flex items-center gap-1 w-full justify-center text-sm transition-opacity duration-200 ${!product.in_stock ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          style={{ backgroundColor: main_color }}
          onClick={cartHandle}
        >
          <LiaShoppingBagSolid size={20} />
          {added ? t('AddedToCart') : t('AddToCart')}
        </button>


      </div>
    </div>
  );
};

export default ProductCard;
