'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useCart } from '@/app/context/CartContext';
import ContactInfo from '@/app/components/shared-components/ContactInfo';
import { fetchProductById, fetchVariants, fetchStoreCities, type StoreCity } from '@/app/lib/productService';
import { nis, main_color } from '@/app/lib/constants';
import { getProductName, getProductDescription } from '@/app/lib/nameHelpers';
import QuantityInput from '@/app/components/shared-components/QuantityInput';
import { AlertCircle } from "lucide-react"
import { toast } from 'sonner';
import { isQuantityAvailable } from '@/app/lib/productHelper';
import { Ban } from 'lucide-react';


const toPublicUrl = (signedUrl: string) => {
  try {
    const url = new URL(signedUrl);
    const publicPath = url.pathname.replace('/sign/', '/public/').split('?')[0];
    return `${url.origin}${publicPath}`;
  } catch {
    return signedUrl;
  }
};


const variantMatchesSelection = (
  variant: any,
  selected: Record<string, string>,
  attrName?: string,
  candidateValue?: string
) => {
  return Object.entries(selected).every(([name, value]) => {
    const desired = name === attrName ? candidateValue : value;
    return variant.attributes.some(
      (a: any) =>
        a.attribute?.toLowerCase() === name.toLowerCase() &&
        a.attribute_item?.toLowerCase() === (desired ?? '').toLowerCase()
    );
  });
};


const isDisabled = (
  attrName: string,
  value: string,
  selected: Record<string, string>,
  variants: any[]
) => {
  if (Object.keys(selected).length === 0) return false;
  return !variants.some(
    (v) => v.in_stock && variantMatchesSelection(v, selected, attrName, value)
  );
};

const ProductDetails = ({
  productId,
  onVariantChange,
}: {
  productId: string;
  onVariantChange?: (variantId: number, imagePath: string) => void;
}) => {
  const locale = useLocale();
  const t = useTranslations('ProductDetails');
  const { addToCart } = useCart();
  const isArabic = locale === 'ar';

  const [amount, setAmount] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [product, setProduct] = useState<any | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [quantityError, setQuantityError] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [cities, setCities] = useState<StoreCity[]>([]);

  // Get localized product name and description
  const productName = product ? getProductName(product, locale) : '';
  const productDescription = product ? getProductDescription(product, locale) : '';

  const shippingOptions = useMemo(
    () => cities.map((c, index) => ({
      id: String(c.id ?? index),
      label: c.name,
      cost: c.shipping_cost,
    })),
    [cities]
  );


  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, storeCities] = await Promise.all([
        fetchProductById(productId),
        fetchStoreCities()
      ]);
      setProduct(p);
      setCities(storeCities);

      if (p?.id) {
        const fetchedVariants = await fetchVariants(p.id);
        // console.log("fetchedVariants:", fetchedVariants)
        setVariants(fetchedVariants);
      }

      setLoading(false);
    };
    load();
  }, [productId]);


  useEffect(() => {
    const checkQuantity = async () => {

      const available = await isQuantityAvailable(
        Number(productId),
        selected,
        amount
      );

      if (!available) {
        setButtonsDisabled(true);
        setQuantityError(true);
      } else {
        setButtonsDisabled(false);
        setQuantityError(false);
      }
    };

    checkQuantity();
  }, [selected, amount, productId]);

  const selectedVariant = useMemo(() => {
    const match = variants.find((v) => v.in_stock && variantMatchesSelection(v, selected));
    return match;
  }, [selected, variants]);


  const handleQuantity = async (amount: number) => {

    // console.log(product)
    const available = await isQuantityAvailable(
      product.id,
      selected,
      amount // use the requested amount, not item.quantity
    );


    if (!available) {
      setButtonsDisabled(true);
      setQuantityError(true);

    } else {
      setButtonsDisabled(false);
      setQuantityError(false);

    }


    setAmount(amount);

  };


  const basePrice = product?.new_price ?? product?.price ?? 0;
  const priceModifier = selectedVariant?.price_modifier ?? 0;
  const finalPrice = basePrice + priceModifier;

  const attributesMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    (product?.attribute_items ?? []).forEach((item: any) => {
      map[item.attribute_name] ??= [];
      map[item.attribute_name].push(item);
    });
    return map;
  }, [product]);

  useEffect(() => {
    if (!product || !product.attribute_items || Object.keys(selected).length > 0) return;

    const initial: Record<string, string> = {};
    product.attribute_items.forEach((item: any) => {
      initial[item.attribute_name] ??= item.name;
    });

    setSelected(initial);
  }, [product]);

  const allChosen = Object.keys(attributesMap).every((k) => selected[k]);

  const choose = (attr: string, value: string, disabled: boolean) => {
    if (!disabled) {
      setSelected((prev) => ({ ...prev, [attr]: value }));
    }
  };

  useEffect(() => {
    if (selectedVariant && onVariantChange) {
      const publicImagePath = toPublicUrl(selectedVariant.image_path);
      onVariantChange(selectedVariant.id, publicImagePath);
    }
  }, [selectedVariant, onVariantChange]);


  const handleAddToCart = () => {
    if (!product.in_stock) return;

    const finalSelected = { ...selected };

    if (Object.keys(finalSelected).length === 0 && product?.attribute_items?.length > 0) {
      const attrMap: Record<string, any[]> = {};
      product.attribute_items.forEach((item: any) => {
        attrMap[item.attribute_name] ??= [];
        attrMap[item.attribute_name].push(item);
      });

      for (const [attrName, items] of Object.entries(attrMap)) {
        const random = items[Math.floor(Math.random() * items.length)];
        finalSelected[attrName] = random.name;
      }
    }

    addToCart({
      product_id: product.id,
      name: productName,
      quantity: amount,
      price: finalPrice,
      base_price: basePrice,
      image: product.main_image ?? '/placeholder.svg',
      selectedAttributes: finalSelected,
      attributeOptions: attributesMap || {},
    });

    toast.success(t('savedSuccessfully'));
  };

  if (loading || !product) {
    return (
      <div className="p-6 bg-white rounded-4xl animate-pulse space-y-4">
        {/* Skeleton Loader */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 w-full bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="product-details p-6 bg-white rounded-4xl"
      style={{ textAlign: isArabic ? 'right' : 'left' }}
    >
      <h1 className="text-2xl font-bold mb-4">{productName}</h1>

      {!product.in_stock && (
        <div className="mb-4 px-4 py-2 bg-yellow-100 text-yellow-800 font-semibold rounded-xl border border-yellow-300">
          {t('outOfStock')}
        </div>
      )}

      {product.description && (
        <p className="text-gray-600 mb-4 max-w-2xl whitespace-pre-line">
          {productDescription}
        </p>
      )}

      <div className="flex items-center gap-4 mb-4">
        <span className="text-3xl font-semibold text-green-600">
          {finalPrice} ₪
        </span>

      
      </div>

      {Object.entries(attributesMap).map(([attrName, items]) => (
        <div key={attrName} className="mb-6">
          <h3 className="text-lg font-medium mb-2">{attrName}</h3>
          <div className="flex gap-2 flex-wrap">
            {items.map((item) => {
              const disabled = isDisabled(attrName, item.name, selected, variants);
              const active = selected[attrName] === item.name;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  aria-disabled={disabled}
                  title={disabled ? 'Unavailable' : undefined}
                  onClick={() => choose(attrName, item.name, disabled)}
                  className={[
                    'group relative rounded-4xl border px-3 py-1 text-sm transition',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20',
                    active ? 'text-white border-transparent' : 'text-gray-800 border-gray-200',
                    disabled
                      ? 'cursor-not-allowed text-gray-400 border-dashed border-gray-300'
                      : 'hover:bg-gray-50'
                  ].join(' ')}
                  style={{ backgroundColor: active ? main_color : undefined }}
                >
                  {/* label */}
                  <span className={disabled ? 'line-through' : ''}>{item.name}</span>

                  {/* disabled hatch overlay */}
                  {disabled && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-4xl
                           bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.05)_6px,rgba(0,0,0,0.05)_12px)]"
                    />
                  )}

                  {/* disabled icon */}
                  {disabled && (
                    <span className="pointer-events-none absolute -top-1 -right-1 rounded-full bg-white shadow p-0.5">
                      <Ban className="h-3.5 w-3.5 text-gray-400" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}


      <div className="mb-6">
        <QuantityInput label={t('selectAmount')} value={amount} onChange={handleQuantity} />
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">{t('selectShipping')}</h3>
        <div className="flex gap-2 flex-wrap">
          {shippingOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedShippingId(option.id)}
              className={`px-4 py-1 rounded-full border text-sm font-medium transition-all ${selectedShippingId === option.id ? 'text-white' : 'text-black'
                }`}
              style={
                selectedShippingId === option.id
                  ? { backgroundColor: main_color, borderColor: main_color }
                  : {}
              }
            >
              {option.label} {option.cost > 0 ? `+${option.cost} ₪` : `(${t('free')})`}
            </button>
          ))}
        </div>
      </div>

      {selectedShippingId === null && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mt-1">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">{t("selectShippingOption")}</p>
        </div>
      )}

      {quantityError === true && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mt-1">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">{t("SorryQuantityNotAvailable")}</p>
        </div>
      )}





      <div className="flex gap-4 mt-6">
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={!allChosen || !product.in_stock || buttonsDisabled}
          className={`w-full py-2 rounded-4xl font-medium text-white ${!allChosen || !product.in_stock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          style={{ backgroundColor: main_color }}
          onClick={handleAddToCart}
        >
          {t('addToCart')}
        </motion.button>


        {/* <ContactInfo
          options={[
            {
              product_id: product.id,
              name: productName,
              quantity: amount,
              selectedAttributes: selected,
              price: finalPrice,
            },
          ]}
          amount={amount}
          total_price={amount * finalPrice + selectedShipping}
          disabled={!product.in_stock || selectedShipping === 0 || buttonsDisabled}
          isCart={false}
        /> */}

      </div>
    </div>
  );
};

export default ProductDetails;
