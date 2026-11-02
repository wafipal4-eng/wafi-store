'use client';

import { useEffect, useState } from 'react';
import { fetchProducts } from '@/app/lib/productService';
import { cdn } from '@/lib/cdn';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function ProductShowcase() {
  const [products, setProducts] = useState<any[]>([]);
  const locale = useLocale();

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  if (!products.length) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-white to-green-50/30">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
          منتجاتنا المميزة
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {products.slice(0, 8).map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/ProductInfo/${product.id}`}
              className="flex-shrink-0 w-48 group"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-green-100 hover:shadow-lg hover:border-green-300 transition-all duration-300">
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {product.main_image ? (
                    <img
                      src={cdn(product.main_image)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      لا توجد صورة
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="text-sm font-medium text-gray-800 truncate">
                    {product.name}
                  </h3>
                  <p className="text-green-600 font-semibold mt-1">
                    ₪{product.price}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
