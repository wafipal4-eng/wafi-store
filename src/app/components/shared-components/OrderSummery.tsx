'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { isQuantityAvailable } from "@/app/lib/productHelper";
import { AlertCircle, BadgePercent, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { main_color } from '@/app/lib/constants';
import ContactInfo from '@/app/components/shared-components/ContactInfo';
import { useCart } from '@/app/context/CartContext';
import { fetchVariants, fetchDiscountByCode, fetchStoreCities, type StoreCity } from '@/app/lib/productService';
import type { DiscountCode as ApiDiscountCode } from "@/app/lib/interfaces";
import { cdn } from '@/lib/cdn';
import Image from 'next/image';

type DiscountCode = {
  id: number;
  code: string;
  discount_value: number; // %
  min_value: number;
  valid_until: string; // ISO date
  store_id: number;
  created_at: string;
  is_active: boolean;
};

function mergeCartItems(cart: any) {
  const mergedMap = new Map<string, typeof cart[number]>();
  for (const item of cart) {
    const key = `${item.product_id}_${JSON.stringify(item.selectedAttributes || {})}`;
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key)!;
      existing.quantity += item.quantity;
    } else {
      mergedMap.set(key, { ...item });
    }
  }
  return Array.from(mergedMap.values());
}

async function isAllQuantitiesAvailable(mergedCart: any) {
  for (const item of mergedCart) {
    const isValid = await isQuantityAvailable(
      item.product_id,
      item.selectedAttributes,
      item.quantity
    );
    if (!isValid) {
      return { success: false, failedProductName: item.name };
    }
  }
  return { success: true, failedProductName: null };
}

export default function OrderSummary() {
  const t = useTranslations('OrderSummary');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // shipping
  const [cities, setCities] = useState<StoreCity[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const shippingOptions = useMemo(
    () => cities.map((c, index) => ({
      id: String(c.id ?? index),
      label: c.name,
      cost: c.shipping_cost,
    })),
    [cities]
  );
  const selectedShipping = shippingOptions.find((option) => option.id === selectedShippingId)?.cost ?? 0;
  const selectedShippingArea =
    shippingOptions.find((option) => option.id === selectedShippingId)?.label ?? '';

  useEffect(() => {
    fetchStoreCities().then(data => {
      setCities(data);
      if (data.length > 0) {
        setSelectedShippingId(String(data[0].id ?? 0));
      }
    });
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [quantityError, setQuantityError] = useState(false);
  const [failedProductName, setFailedProductName] = useState<string | null>(null);

  const { cart } = useCart();

  // variants cache
  const [variantsMap, setVariantsMap] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const loadAllVariants = async () => {
      const map: Record<number, any[]> = {};
      await Promise.all(
        cart.map(async (item) => {
          if (!map[item.product_id]) {
            try {
              const variants = await fetchVariants(String(item.product_id));
              map[item.product_id] = variants || [];
            } catch (err) {
              console.error(`❌ Failed to fetch variants for ${item.product_id}`, err);
            }
          }
        })
      );
      setVariantsMap(map);
    };
    loadAllVariants();
  }, [cart]);

  // final price per item (base + variant modifier)
  const getFinalPrice = (item: any) => {
    const variants = variantsMap[item.product_id] || [];
    const variant = variants.find((variant: any) => {
      return (variant.attributes || []).every((attr: any) => {
        const key = attr.attribute;
        const variantVal = String(attr.attribute_item).toLowerCase();
        const selectedVal = String(item.selectedAttributes?.[key] ?? '').toLowerCase();
        return selectedVal === variantVal;
      });
    });
    const modifier = variant?.price_modifier ?? 0;
    const base = item.base_price ?? item.price;
    return base + modifier;
  };

  // coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ApiDiscountCode | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // totals (subtotal before shipping/discount; then discount; then + shipping)
  const {
    productsTotal,
    totalQuantity,
    orderOptions,
    discountAmount,
    totalWithShipping
  } = useMemo(() => {
    const productsTotal = cart.reduce((sum, item) => {
      const price = getFinalPrice(item);
      return sum + price * item.quantity;
    }, 0);

    const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

    const discountPerc = appliedCoupon?.discount_value ?? 0;
    const discountAmount = Number(((productsTotal * discountPerc) / 100).toFixed(2));

    const totalWithShipping = Math.max(0, productsTotal - discountAmount) + selectedShipping;

    const orderOptions = cart.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      selectedAttributes: item.selectedAttributes,
      price: getFinalPrice(item),
    }));

    return {
      productsTotal,
      totalQuantity,
      orderOptions,
      discountAmount,
      totalWithShipping,
    };
  }, [cart, selectedShipping, variantsMap, appliedCoupon]);

  // apply coupon with validation
  const handleApplyCoupon = async () => {
    setCouponError(null);
    const raw = couponCode.trim().toUpperCase();
    if (!raw) {
      setCouponError(t('enterCodeError'));
      return;
    }

    setCouponLoading(true);
    try {
      const found = await fetchDiscountByCode(raw); // ✅ pass store id + code
      if (!found) {
        setCouponError(t('notFound'));
        setAppliedCoupon(null);
        return;
      }
      if (!found.is_active) {
        setCouponError(t('inactive'));
        setAppliedCoupon(null);
        return;
      }
      const today = new Date();
      const validUntil = new Date(found.valid_until);
      validUntil.setHours(23, 59, 59, 999); // inclusive
      if (validUntil < today) {
        setCouponError(t('expired'));
        setAppliedCoupon(null);
        return;
      }
      // ✅ min order validation: min_value must NOT exceed the cart subtotal
      const min = Number(found.min_value || 0);
      if (productsTotal < min) {
        setCouponError(
          t('minNotMet', { value: min.toLocaleString() })
        );
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(found);
      setCouponError(null);
    } catch (e) {
      console.error(e);
      setCouponError(t('genericError'));
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Auto-revalidate coupon when cart subtotal changes (e.g., user removes items)
  useEffect(() => {
    if (!appliedCoupon) return;
    const min = Number(appliedCoupon.min_value || 0);
    if (productsTotal < min) {
      setCouponError(
        t('minNotMet', { value: min.toLocaleString() })
      );
      setAppliedCoupon(null);
    } else {
      setCouponError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsTotal]); // depend only on subtotal

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponCode('');
  };

  return (
    <>
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="mt-4 w-full max-w-full sm:max-w-md md:max-w-lg rounded-[2rem] bg-white p-4 sm:p-6 md:p-8 shadow-sm"
      >
        <h2 className="text-lg sm:text-xl font-bold text-black mb-4">{t('title')}</h2>

        <div className="flex items-center justify-between text-black mb-3 text-sm sm:text-base">
          <span>{t('total_products')}</span>
          <span>₪ {productsTotal.toLocaleString()}</span>
        </div>

        {/* 🎟️ Coupon */}
        <div className="mt-3">
          <label className="block text-sm font-medium text-black mb-1 flex items-center gap-2">
            <BadgePercent className="h-4 w-4" />
            {t('label')}
          </label>

          {!appliedCoupon ? (
            <div className={`flex flex-col sm:flex-row ${isRTL ? 'sm:flex-row-reverse' : ''} gap-2`}>
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={t('placeholder')}
                className="w-full sm:flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-white text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: main_color }}
              >
                {couponLoading ? t('applying') : t('apply')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
              <div className="text-sm">
                <span className="font-semibold text-green-700">
                  {t('applied', { code: appliedCoupon.code })}
                </span>
                <span className="ml-2 text-green-700">
                  {t('discountLine', { value: appliedCoupon.discount_value })}
                </span>
                {appliedCoupon.min_value > 0 && (
                  <span className="ml-2 text-green-700">
                    {t('minLine', { value: Number(appliedCoupon.min_value).toLocaleString() })}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="inline-flex items-center gap-1 self-start sm:self-auto rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                aria-label={t('remove')}
                title={t('remove')}
              >
                <X className="h-4 w-4" />
                {t('remove')}
              </button>
            </div>
          )}

          {couponError && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{couponError}</p>
            </div>
          )}
        </div>

        {/* 🚚 Shipping options */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {shippingOptions.map((option) => (
            <button
              key={option.id}
              className={`px-3 sm:px-4 py-1 rounded-full border text-xs sm:text-sm font-medium transition-all ${selectedShippingId === option.id ? 'text-white' : 'text-black'
                }`}
              style={
                selectedShippingId === option.id
                  ? { backgroundColor: main_color, borderColor: main_color }
                  : {}
              }
              onClick={() => setSelectedShippingId(option.id)}
            >
              {option.label} {option.cost > 0 ? `+${option.cost} ₪` : `(${t('free')})`}
            </button>
          ))}
        </div>

        <hr className="my-4 border-gray-200" />

        {/* Totals breakdown */}
        {appliedCoupon && (
          <div className="flex items-center justify-between text-black mb-2 text-sm sm:text-base">
            <span>{t('discount')}</span>
            <span>- ₪ {discountAmount.toLocaleString()}</span>
          </div>
        )}

        <div className="flex items-center justify-between font-bold text-black mb-2 text-sm sm:text-base">
          <span>{t('total')}</span>
          <span>₪ {totalWithShipping.toLocaleString()}</span>
        </div>

        <p className="text-[11px] sm:text-xs text-gray-500">* {t('tax_included')}</p>
        <p className="text-[11px] sm:text-xs text-red-600">* {t('check_options')}</p>

        <hr className="my-4 border-gray-200" />

        {quantityError === true && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mt-1">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm font-medium">
              {t("SorryQuantityNotAvailable")}
              {failedProductName && `: ${failedProductName}`}
            </p>
          </div>
        )}

        <button
          type="button"
          className="w-full mt-5 py-2 rounded-3xl sm:rounded-4xl text-white text-sm font-medium transition hover:opacity-90"
          style={{ backgroundColor: main_color, opacity: cart.length === 0 ? 0.5 : 1 }}
          onClick={async () => {
            const merged = mergeCartItems(cart);
            const result = await isAllQuantitiesAvailable(merged);
            if (!result.success) {
              setFailedProductName(result.failedProductName);
              setQuantityError(true);
              return;
            }
            setQuantityError(false);
            setFailedProductName(null);
            setShowModal(true);
          }}
          disabled={cart.length === 0}
        >
          {t('complete_order')}
        </button>
      </div>

      {/* 🛒 Order Review Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{t('order_review')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.addedAt} className="border-b pb-3 last:border-none text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden">
                    <Image
                      src={item.image ? cdn(item.image) : "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md !bg-transparent"
                      sizes="64px"
                      quality={75}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 break-words">
                      {Object.entries(item.selectedAttributes || {})
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(', ')}
                    </p>
                    <p>{t('quantity')}: {item.quantity}</p>
                    <p>{t('price')}: ₪ {getFinalPrice(item).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm sm:text-base text-black">
            <div className="flex justify-between">
              <span>{t('total_products')}</span>
              <span>₪ {productsTotal.toLocaleString()}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between">
                <span>{t('discount')}</span>
                <span>- ₪ {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t('shipping') || 'Shipping'}</span>
              <span>₪ {selectedShipping.toLocaleString()}</span>
            </div>
            <div className="mt-1 border-t pt-2 font-bold flex justify-between">
              <span>{t('total')}</span>
              <span>₪ {totalWithShipping.toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <ContactInfo
              options={orderOptions}
              amount={totalQuantity}
              total_price={totalWithShipping + discountAmount}
              final_price={totalWithShipping}
              coupon={appliedCoupon?.code}
              disabled={false}
              isCart={true}
              shipping={selectedShipping}
              shippingArea={selectedShippingArea}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
