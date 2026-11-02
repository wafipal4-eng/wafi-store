'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import {
  Home,
  ReceiptText,
  Package2,
  Shapes,
  TicketPercent,
  MessageCircle,
  BarChart3,
  Settings,
} from 'lucide-react';

export default function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const t = useTranslations('NavLinks');
  const pathname = usePathname();

  // Helper to avoid crashes if a key is missing
  const tt = (key: string, fallback: string) => t(key, { defaultMessage: fallback });

  const links = [
    { name: tt('home', 'Home'), key: 'home', href: '/dashboard', icon: Home },
    { name: tt('productStats', 'Product Stats'), key: 'productStats', href: '/dashboard/product-stats', icon: BarChart3 },
    { name: tt('storeSettings', 'Store Settings'), key: 'storeSettings', href: '/dashboard/store-settings', icon: Settings },
    { name: tt('orders', 'Orders'), key: 'orders', href: '/dashboard/admin-orders', icon: ReceiptText },
    { name: tt('products', 'Products'), key: 'products', href: '/dashboard/admin-products', icon: Package2 },
    { name: tt('categories', 'Categories'), key: 'categories', href: '/dashboard/admin-categories', icon: Shapes },
    { name: tt('coupones', 'Coupones'), key: 'coupones', href: '/dashboard/admin-coupones', icon: TicketPercent },
    { name: tt('cities', 'Cities Management'), key: 'cities', href: '/dashboard/admin-cities', icon: ReceiptText },


  ];

  // Active when current route starts with link href (so sub-routes are included)
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <nav className="flex flex-col gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.href);
        return (
          <Link
            key={link.key}
            href={link.href}
            prefetch={false}
            onClick={onLinkClick}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium',
              active
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="truncate">{link.name}</span>
          </Link>
        );
      })}

      {/* Divider */}
      <div className="my-2 h-px bg-gray-200" />

      {/* Support via WhatsApp */}
      <a
        href="https://wa.me/970597772605"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onLinkClick}
        className={clsx(
          'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium',
          'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
        )}
        aria-label={tt('contactSupport', 'Contact support')}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        <span className="truncate">
          {tt('whatsAppSupport', 'WhatsApp Support')}
        </span>

      </a>


    </nav>
  );
}
