'use client';

import React, { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { main_color } from '@/app/lib/constants';
import { fetchCategories } from '@/app/lib/productService';
import type { Category } from '@/app/lib/interfaces';
import { getCategoryName } from '@/app/lib/nameHelpers';

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const locale = useLocale();
  const t = useTranslations('Sidebar');
  const [categories, setCategories] = useState<Category[]>([]);
  const isRtl = ['ar', 'he', 'fa', 'ur'].includes(locale);
  const direction = isRtl ? 'rtl' : 'ltr';
  const borderStyle = isRtl
    ? { borderRight: '1px solid #e5e7eb' }
    : { borderLeft: '1px solid #e5e7eb' };
  const paddingInlineStyle = {
    paddingInlineStart: isRtl ? '20px' : '0',
    paddingInlineEnd: isRtl ? '0' : '20px',
  };
  const borderRadiusClass = isRtl ? 'rounded-l-3xl' : 'rounded-r-3xl';

  const sidebarItems = [
    { href: '/', label: 'sidebarItem4' },
    { href: '/Products', label: 'sidebarItem1' },
    // { href: '/AccountInfo', label: 'sidebarItem2' },
    { href: '/Cart', label: 'sidebarItem3' },

    // { href: '/AccountInfo', label: 'sidebarItem4' },
    { href: '/MyOrders', label: 'sidebarItem5' },
  ];

  useEffect(() => {
    const loadCategories = async () => {
      const categoryList = await fetchCategories();
      setCategories((categoryList || []).filter((category) => category.is_visible !== false));
    };

    loadCategories();
  }, []);

  const handleCloseDrawer = () => {
    setTimeout(() => {
      const drawerCheckbox = document.getElementById('my-drawer') as HTMLInputElement | null;
      if (drawerCheckbox) drawerCheckbox.checked = false;
    }, 100);
  };

  return (
    <div className={`drawer ${direction}`} dir={direction}>
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">{children}</div>

      <div className="drawer-side" style={{ zIndex: 1000, ...borderStyle }}>
        <label htmlFor="my-drawer" className="drawer-overlay" aria-label={t('closeSidebar')} />
        <ul
          className={`menu bg-white shadow-md min-h-[97%] w-80 py-6 px-4 text-gray-800 ${borderRadiusClass}`}
          style={paddingInlineStyle}
        >
          <li className="mb-2 select-none pointer-events-none">
            <h1 className="text-2xl font-semibold text-gray-900">{t('mainMenu')}</h1>
          </li>

          <div className="mb-4 border-b border-gray-200" />

          {sidebarItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href as any}
                className="flex items-center px-3 py-2 rounded-xl hover:bg-indigo-50 hover:text-secondary-800 transition-colors duration-200"
                onClick={handleCloseDrawer}
              >
                {t(item.label)}
              </Link>
            </li>
          ))}

          {categories.length > 0 && (
            <>
              <div className="my-4 border-b border-gray-200" />

              <li className="mb-1 select-none pointer-events-none">
                <h2
                  className="px-3 text-sm font-semibold uppercase tracking-wide"
                  style={{ color: main_color }}
                >
                  {t('categoriesTitle')}
                </h2>
              </li>

              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/Products?category=${category.id}` as any}
                    className="flex items-center px-3 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors duration-200"
                    onClick={handleCloseDrawer}
                  >
                    {getCategoryName(category, locale)}
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
