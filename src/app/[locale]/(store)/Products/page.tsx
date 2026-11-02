'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ProductCard from '@/app/components/shared-components/ProductCard';
import {
  fetchProducts,
  fetchCategoryLinks,
  fetchAllCategories,
} from '@/app/lib/productService';
import { main_color } from '@/app/lib/constants';
import { SubscriptionGuard } from '@/app/components/guards/SubscriptionGuard';
import { getCategoryName } from '@/app/lib/nameHelpers';
import { useLocale } from 'next-intl';

interface Product {
  id: number;
  name: string;
  main_image?: string;
  created_at?: string;
  [key: string]: string | number | boolean | undefined;
}

interface Category {
  id: number;
  name: string;
  secondary_name?: string;
}

type ProductsByCategory = Record<string, Product[]>;

const sortNewestFirst = (products: Product[]) =>
  [...products].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

    if (aTime !== bTime) return bTime - aTime;
    return Number(b.id) - Number(a.id);
  });

// Skeleton loader for ProductCard
const ProductCardSkeleton: React.FC = () => (
  <div className="p-2 rounded-xl shadow-3xl h-full flex flex-col animate-pulse">
    <div className="relative aspect-square bg-gray-200 rounded-2xl" />
    <div className="mt-4 h-5 bg-gray-200 rounded w-3/4 mx-auto" />
    <div className="mt-2 h-4 bg-gray-200 rounded w-1/2 mx-auto" />
    <div className="mt-auto flex gap-2 p-1">
      <div className="h-8 w-full bg-gray-200 rounded" />
      <div className="h-8 w-full bg-gray-200 rounded" />
    </div>
  </div>
);

const Page = () => {
  const t = useTranslations('product');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get('category') || null;
  const searchQuery = searchParams.get('search') || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory>({});
  const [uncategorizedProducts, setUncategorizedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  const hasActiveFilters = useMemo(
    () => Boolean(searchQuery || selectedCategory !== null),
    [searchQuery, selectedCategory]
  );

  const pushParams = (params: URLSearchParams) => {
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearSearchOnly = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    pushParams(params);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('category');
    pushParams(params);
  };

  const handleCategorySelect = (catId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catId === null) params.delete('category');
    else params.set('category', catId);
    pushParams(params);
    setVisibleCount(12); // reset visible count on category change
  };

  const pillClass = useCallback(
    (isActive: boolean) =>
      `px-4 py-1 rounded-full text-sm font-medium border shadow-sm transition duration-200 ${isActive ? 'text-white' : 'text-gray-800 hover:bg-gray-100'
      }`,
    []
  );

  const CategoryPill = ({ id, label }: { id: string | null; label: string }) => {
    const isActive = selectedCategory === id;
    return (
      <button
        onClick={() => handleCategorySelect(id)}
        className={pillClass(isActive)}
        style={isActive ? { backgroundColor: main_color } : {}}
      >
        {label}
      </button>
    );
  };

  const getFilteredProducts = () => {
    let products: Product[] = [];

    if (selectedCategory === null) products = allProducts;
    else if (selectedCategory === 'uncategorized') products = uncategorizedProducts;
    else products = productsByCategory[selectedCategory] || [];

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(lower));
    }

    return sortNewestFirst(products).slice(0, visibleCount);
  };

  const renderProductGrid = (products: Product[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {products.map((product) => (
        <div key={product.id} className="relative shadow-sm rounded-2xl overflow-hidden">
          <ProductCard
            product={{
              ...product,
              id: String(product.id),
              main_image: product.main_image || 'fallback.jpg',
              description: String(product.description || ''),
              price: Number(product.price) ?? 0,
              new_price: Number(product.new_price),
              in_stock: Boolean(product.in_stock),
            }}
          />
        </div>
      ))}
    </div>
  );

  const getCurrentLabel = () => {
    if (selectedCategory === null) return t('all');
    if (selectedCategory === 'uncategorized') return t('uncategorized');
    const category = categories.find((c) => c.id.toString() === selectedCategory);
    return category ? getCategoryName(category, locale) : '';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [categoryList, categoryLinks, allProductList] = await Promise.all([
        fetchAllCategories(),
        fetchCategoryLinks(),
        fetchProducts(),
      ]);

      // Simple synchronous map - NO async needed
      const AllProducts = sortNewestFirst(allProductList.map((product) => ({
        ...product,
        id: Number(product.id),
        main_image: product.main_image ?? undefined,
      })));

      const productMap = new Map(AllProducts.map((p) => [String(p.id), p]));
      const grouped: ProductsByCategory = {};
      const categorizedProductIds = new Set<number>();

      for (const { category_id, product_id } of categoryLinks) {
        if (!grouped[category_id]) grouped[category_id] = [];

        const product = productMap.get(String(product_id));
        if (product) {
          grouped[category_id].push({
            ...product,
            id: Number(product.id),
            main_image: product.main_image ?? undefined,
          });
          categorizedProductIds.add(Number(product.id));
        }
      }

      Object.keys(grouped).forEach((categoryId) => {
        grouped[categoryId] = sortNewestFirst(grouped[categoryId]);
      });

      const uncategorized = sortNewestFirst(
        AllProducts.filter((product) => !categorizedProductIds.has(product.id))
      );

      setCategories(categoryList);
      setProductsByCategory(grouped);
      setUncategorizedProducts(uncategorized);
      setAllProducts(AllProducts);
      setLoading(false);
    };

    fetchData();
  }, []); // Run only once on mount, not on category change

  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();

    if (node) {
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setVisibleCount((prev) => prev + 12);
          }
        },
        { rootMargin: '200px' }
      );

      observer.current.observe(node);
    }
  }, []);

  // Show skeleton loaders while loading
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();
  const fullProductList =
    selectedCategory === null
      ? allProducts
      : selectedCategory === 'uncategorized'
        ? uncategorizedProducts
        : productsByCategory[selectedCategory] || [];

  return (
    <SubscriptionGuard>
      <section className="px-4 py-8 max-w-7xl mx-auto">
        {/* Top bar: Category pills + Clear-all when active */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto p-2 scrollbar-hide whitespace-nowrap">
          <CategoryPill id={null} label={t('all')} />
          {categories.map((cat) => (
            <CategoryPill key={cat.id} id={cat.id.toString()} label={getCategoryName(cat, locale)} />
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              title={t('clearAll') ?? 'Clear filters'}
            >
              ✕ {t('clearAll') ?? 'Clear'}
            </button>
          )}
        </div>

        {/* Search term chip (clear only search) */}
        {searchQuery && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {t('searchResultsFor')}: <strong>{searchQuery}</strong>
              <button
                onClick={clearSearchOnly}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-200"
                aria-label={t('clearSearch') ?? 'Clear search'}
                title={t('clearSearch') ?? 'Clear search'}
              >
                ✕
              </button>
            </span>
          </div>
        )}

        {/* Product Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">{getCurrentLabel()}</h2>
          {renderProductGrid(filteredProducts)}

          {filteredProducts.length < fullProductList.length && (
            <div ref={lastElementRef} className="h-10 flex justify-center items-center text-sm text-gray-400">
              {t('loading')}...
            </div>
          )}
        </div>
      </section>
    </SubscriptionGuard>
  );
};

export default Page;
