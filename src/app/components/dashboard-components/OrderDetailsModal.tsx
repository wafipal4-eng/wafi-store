'use client';

import React, { useEffect, useState } from 'react';
import { Order } from '@/app/lib/interfaces';
import { useTranslations, useLocale } from 'next-intl';
import { fetchOrderProducts } from '@/app/lib/productService';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Props {
  order: Order;
  onClose: () => void;
}

interface OrderProduct {
  amount: number;
  options: any; // may be stringified JSON or object
  products: { name: string }[] | { name: string } | null;
}

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

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const safeParse = <T,>(raw: any): T | null => {
  try {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string' && raw.trim() === '') return null;
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as T);
  } catch {
    return null;
  }
};

const renderProductNames = (products: OrderProduct['products']) => {
  if (!products) return '-';
  if (Array.isArray(products)) return products.map((p) => p.name).join(', ');
  if (typeof products === 'object' && 'name' in products) return products.name;
  return '-';
};

const renderOptions = (options: any) => {
  const parsed = safeParse<Record<string, any>>(options);
  if (!parsed || typeof parsed !== 'object') return '-';
  const entries = Object.entries(parsed);
  if (!entries.length) return '-';
  return entries.map(([k, v]) => `${capitalize(String(k))}: ${String(v)}`).join(', ');
};

const OrderDetailsModal: React.FC<Props> = ({ order, onClose }) => {
  const t = useTranslations('AdminTable');
  const locale = useLocale();

  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const parsedCoupon = safeParse<DiscountCode>((order as any).coupon);
  const finalPrice: number = Number((order as any).final_price ?? order.total_price);
  const subtotal: number = Number(order.total_price);
  const shippingCost =
    order.shipping_cost == null ? null : Number(order.shipping_cost);
  const productsPrice =
    shippingCost == null ? subtotal : Math.max(0, subtotal - shippingCost);
  const discountAmount = Math.max(0, subtotal - finalPrice);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await fetchOrderProducts(order.id);
      setOrderProducts(data || []);
    };
    loadProducts();
  }, [order.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('close')}
      />

      {/* Modal */}
      <div className="relative z-50 w-[96vw] max-w-2xl bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('orderDetails')}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            title={t('close')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-gray-700 mb-6">
          <p>
            <span className="font-semibold">{t('customerName')}:</span> {order.customer_name}
          </p>
          <p>
            <span className="font-semibold">{t('totalPrice')}:</span>{' '}
            {subtotal.toLocaleString(locale)} {t('currency')}
          </p>
          <p>
            <span className="font-semibold">{t('shippingArea')}:</span> {order.city}
            {shippingCost != null
              ? ` (+${shippingCost.toLocaleString(locale)} ${t('currency')})`
              : ''}
          </p>
          <p>
            <span className="font-semibold">{t('address')}:</span> {order.address}
          </p>
          <p>
            <span className="font-semibold">{t('primaryPhone')}:</span>{' '}
            {order.phone_number_1 ? (
              <a
                href={`https://wa.me/${order.phone_number_1.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline hover:text-green-700"
              >
                {order.phone_number_1}
              </a>
            ) : (
              '-'
            )}
          </p>
          <p>
            <span className="font-semibold">{t('secondaryPhone')}:</span>{' '}
            {order.phone_number_2 ? (
              <a
                href={`https://wa.me/${order.phone_number_2.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline hover:text-green-700"
              >
                {order.phone_number_2}
              </a>
            ) : (
              '-'
            )}
          </p>
          <p className="sm:col-span-2">
            <span className="font-semibold">{t('notes')}:</span>{' '}
            <span className="whitespace-pre-line">{order.notes || '-'}</span>
          </p>
          <p className="sm:col-span-2">
            <span className="font-semibold">{t('orderTime')}:</span>{' '}
            {new Date(order.created_at).toLocaleString(locale)}
          </p>
        </div>

        {/* Summary (Coupon / Discount / Final) */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4 mb-6 text-sm">
          <div className="flex items-center justify-between">
            <span>{t('productsPrice')}</span>
            <span className="font-medium">
              {productsPrice.toLocaleString(locale)} {t('currency')}
            </span>
          </div>

          {shippingCost != null && (
            <div className="mt-2 flex items-center justify-between text-blue-700">
              <span>
                {t('shippingFee')} · {order.city}
              </span>
              <span className="font-medium">
                + {shippingCost.toLocaleString(locale)} {t('currency')}
              </span>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span>{t('totalPrice')}</span>
            <span className="font-medium">
              {subtotal.toLocaleString(locale)} {t('currency')}
            </span>
          </div>

          {parsedCoupon ? (
            <>
              <div className="mt-2 flex items-center justify-between">
                <span>{t('coupon')}</span>
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs border border-green-200">
                    {parsedCoupon.code}
                  </span>
                  <span className="text-xs text-gray-600">{parsedCoupon.discount_value}%</span>
                </span>
              </div>
              <div className="mt-1 text-[11px] text-gray-500">
                {/* extra info in one line to avoid new translation keys */}
                {`min ₪ ${Number(parsedCoupon.min_value).toLocaleString(locale)} · until ${new Date(
                  parsedCoupon.valid_until
                ).toLocaleDateString(locale)}`}
              </div>
            </>
          ) : null}

          <div className="mt-2 flex items-center justify-between">
            <span>{t('discount')}</span>
            <span className={discountAmount > 0 ? 'text-green-700 font-medium' : ''}>
              {discountAmount > 0
                ? `- ${discountAmount.toLocaleString(locale)} ${t('currency')}`
                : '-'}
            </span>
          </div>

          <div className="mt-2 border-t pt-2 flex items-center justify-between">
            <span className="font-semibold">{t('finalPrice')}</span>
            <span className="font-semibold">
              {finalPrice.toLocaleString(locale)} {t('currency')}
            </span>
          </div>
        </div>

        {/* Product List */}
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('products')}</h4>
          {orderProducts.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-700">
              {orderProducts.map((p, idx) => (
                <li
                  key={idx}
                  className="border border-gray-200 rounded-lg px-3 sm:px-4 py-2 bg-white"
                >
                  <p>
                    <span className="font-medium">{t('productName')}:</span>{' '}
                    {renderProductNames(p.products)}
                  </p>
                  <p>
                    <span className="font-medium">{t('amount')}:</span> {p.amount}
                  </p>
                  <p>
                    <span className="font-medium">{t('options')}:</span>{' '}
                    {renderOptions(p.options)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">{t('noProductsInOrder')}</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>{t('close')}</Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
