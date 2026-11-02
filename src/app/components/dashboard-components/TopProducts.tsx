'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from "next/image";
import { cdn } from '@/lib/cdn';
export const TopProducts = () => {
  const t = useTranslations('topProducts');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const products = [
    { id: 1, name: t('product1'), sales: 148, image: '/sample-product-1.jpg' },
    { id: 2, name: t('product2'), sales: 121, image: '/sample-product-2.jpg' },
    { id: 3, name: t('product3'), sales: 97, image: '/sample-product-3.jpg' }
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden border">

            <Image
              src={cdn(product.image) || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover w-full h-full !bg-transparent"
              sizes="100vw"
              quality={75}
            />
          </div>
          <div className="flex flex-col">
            <h3 className="text-gray-900 font-medium text-base leading-tight">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-indigo-600">
                {product.sales}
              </span>{' '}
              {t('sales')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
