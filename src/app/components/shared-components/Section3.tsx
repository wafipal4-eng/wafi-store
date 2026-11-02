'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchCategories, fetchProductsByCategory, fetchRecentProducts } from '@/app/lib/productService';
import ProductCard from '@/app/components/shared-components/ProductCard';
import type { Category, Product } from '@/app/lib/interfaces';
import { main_color } from '@/app/lib/constants';
import { getCategoryName } from '@/app/lib/nameHelpers';

type CatWithProducts = { category: Category; products: Product[] };

export default function Section3() {
  const t = useTranslations('HomePage');
  const locale = useLocale();
  const isRTL = locale === 'ar' || locale === 'he';

  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [items, setItems] = useState<CatWithProducts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [recentProducts, cats] = await Promise.all([
          fetchRecentProducts(10),
          fetchCategories(),
        ]);

        const visible = (cats || [])
          .filter((c: any) => c?.is_visible !== false)
          .sort((a: any, b: any) => {
            const ao = a?.orderby ?? Number.MAX_SAFE_INTEGER;
            const bo = b?.orderby ?? Number.MAX_SAFE_INTEGER;
            return ao - bo;
          });

        const results = await Promise.all(
          visible.map(async (cat) => ({
            category: cat,
            products: await fetchProductsByCategory(String(cat.id)),
          }))
        );

        setNewArrivals(recentProducts);
        setItems(results.filter((r) => (r.products?.length ?? 0) > 0));
      } catch {
        setNewArrivals([]);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasNewArrivals = newArrivals.length > 0;
  const hasCategories = useMemo(() => items.some((x) => x.products.length > 0), [items]);
  const hasContent = hasNewArrivals || hasCategories;

  return (
    <section
      id="products-section"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={t('featuredCategories')}
      className="px-4 py-8 space-y-12"
    >
      {/* Loading */}
      {loading && (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="mx-auto mb-4 h-7 w-48 rounded-md bg-gray-200" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-64 w-[250px] flex-shrink-0 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {!loading && hasContent && (
        <>
          {hasNewArrivals && (
            <div>
              <div className="flex flex-col items-center">
                <h2
                  className="mb-4 border-b-4 pb-2 text-2xl font-bold text-gray-800"
                  style={{ borderColor: main_color }}
                >
                  {t('newArrivals')}
                </h2>
              </div>

              <div
                className={`
                  flex overflow-x-auto pb-4 snap-x snap-mandatory
                  ${isRTL ? 'space-x-reverse' : ''}
                `}
                style={{ gap: '1rem' }}
              >
                {newArrivals.map((product) => (
                  <div key={product.id} className="w-[250px] flex-shrink-0 snap-start">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {items.map(({ category, products }) => (
            <div key={category.id}>
              <div className="flex flex-col items-center">
                <h2
                  className="mb-4 border-b-4 pb-2 text-2xl font-bold text-gray-800"
                  style={{ borderColor: main_color }}
                >
                  {getCategoryName(category, locale)}
                </h2>
              </div>

              <div
                className={`
                  flex overflow-x-auto pb-4 snap-x snap-mandatory
                  ${isRTL ? 'space-x-reverse' : ''}
                `}
                style={{ gap: '1rem' }}
              >
                {products.map((product) => (
                  <div key={product.id} className="w-[250px] flex-shrink-0 snap-start">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Show All Products */}
          <div className="flex justify-center pt-2">
            <Link
              href="/Products"
              prefetch={false}
              aria-label={t('showAllProducts')}
              className="px-4 py-2 text-white rounded-xl flex items-center gap-2 justify-center text-sm transition-transform duration-200 hover:scale-105"
              style={{ backgroundColor: main_color }}
            >
              {t('showAllProducts')}
            </Link>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !hasContent && (
        <div className="text-center text-sm text-gray-500">
          {t('noFeaturedCategories')}
        </div>
      )}
    </section>
  );
}
