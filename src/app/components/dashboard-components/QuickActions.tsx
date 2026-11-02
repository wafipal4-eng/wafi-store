'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Package, ShoppingCart, TicketPercent, BarChart3 } from 'lucide-react';

const actions = [
  {
    key: 'addProduct',
    icon: Package,
    href: '/dashboard/admin-products',
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
  },
  {
    key: 'viewOrders',
    icon: ShoppingCart,
    href: '/dashboard/admin-orders',
    color: 'from-emerald-500 to-emerald-600',
    hoverColor: 'hover:from-emerald-600 hover:to-emerald-700',
  },
  {
    key: 'manageCoupons',
    icon: TicketPercent,
    href: '/dashboard/admin-coupones',
    color: 'from-purple-500 to-purple-600',
    hoverColor: 'hover:from-purple-600 hover:to-purple-700',
  },
  {
    key: 'productStats',
    icon: BarChart3,
    href: '/dashboard/product-stats',
    color: 'from-indigo-500 to-indigo-600',
    hoverColor: 'hover:from-indigo-600 hover:to-indigo-700',
  },
];

export default function QuickActions() {
  const t = useTranslations('dashboard');

  return (
    <div className="rounded-xl p-6 bg-white shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('quickActions')}</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.key}
              href={action.href}
              className={`
                flex flex-col items-center justify-center
                p-6 rounded-xl
                bg-gradient-to-br ${action.color}
                ${action.hoverColor}
                text-white
                transition-all duration-200
                hover:shadow-lg hover:scale-105
                group
              `}
            >
              <Icon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">{t(action.key)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
