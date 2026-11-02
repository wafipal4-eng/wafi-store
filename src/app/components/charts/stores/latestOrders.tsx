'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { fetchRecentOrders } from '@/app/lib/productService';
import { cn } from '@/app/lib/utils';
import { CheckCircle2, Truck, Clock, XCircle } from 'lucide-react';

type OrderStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';

interface Order {
  id: number;
  status: OrderStatus;
  customer_name: string | null;
  created_at: string;
}

function getRelativeTime(dateString: string, locale: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    const value = Math.floor(diff / secondsInUnit);
    if (value > 0) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return rtf.format(-value, unit);
    }
  }
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second');
}

const STATUS_STYLES: Record<
  OrderStatus,
  { className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  Pending:   { className: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200', Icon: Clock },
  Shipped:   { className: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',     Icon: Truck },
  Delivered: { className: 'bg-green-100 text-green-800 ring-1 ring-green-200',   Icon: CheckCircle2 },
  Cancelled: { className: 'bg-red-100 text-red-800 ring-1 ring-red-200',         Icon: XCircle },
};

export default function RecentOrders({
  limit = 12,
}: {
  limit?: number;
}) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchRecentOrders();
        if (alive) setOrders(res || []);
      } catch {
        if (alive) setOrders([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => orders.slice(0, limit), [orders, limit]);

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className="rounded-3xl p-4 md:p-6 border border-transparent bg-white shadow-sm"
      aria-label={t('recentOrders')}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{t('recentOrders')}</h2>

        <Link
          href="/dashboard/admin-orders"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium
                     border-[#d41655]/30 text-[#d41655] hover:bg-[#d41655]/5 focus:outline-none
                     focus-visible:ring-2 focus-visible:ring-[#d41655]/40 transition"
          aria-label={t('viewAll') || 'View all orders'}
        >
          {t('viewAll') || 'View All'}
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-200/50 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.4s_infinite]" />
            </div>
          ))}
          <style jsx>{`
            @keyframes shimmer {
              100% {
                transform: translateX(100%);
              }
            }
          `}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && visible.length === 0 && (
        <div className="flex items-center justify-between rounded-2xl border bg-gray-50 p-4">
          <div>
            <div className="text-sm font-medium text-gray-900">{t('noRecentOrders') ?? 'No recent orders'}</div>
            <div className="text-xs text-gray-500">{t('noRecentOrdersHint') ?? 'New orders will appear here.'}</div>
          </div>
          <Link
            href="/dashboard/admin-orders"
            className="text-sm font-medium text-[#6C63FF] hover:underline"
          >
            {t('viewAll') || 'View All'}
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && visible.length > 0 && (
        <div className="overflow-y-auto max-h-[360px] rounded-xl border">
          <table className="w-full text-sm text-gray-700">
            <thead className="sticky top-0 bg-gray-50 border-b text-gray-500 text-xs uppercase z-10">
              <tr>
                <th className="px-3 py-2 text-start">{t('id')}</th>
                <th className="px-3 py-2 text-start">{t('status')}</th>
                <th className="px-3 py-2 text-start">{t('customerName')}</th>
                <th className="px-3 py-2 text-start">{t('date')}</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {visible.map((order) => {
                const { className, Icon } = STATUS_STYLES[order.status] ?? STATUS_STYLES.Pending;
                return (
                  <tr key={order.id} className="border-b last:border-b-0 hover:bg-gray-50/70">
                    <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                      #{order.id}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
                          className
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {t(`status${order.status}`)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                      {order.customer_name || t('unknownCustomer') || '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">
                      {getRelativeTime(order.created_at, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
