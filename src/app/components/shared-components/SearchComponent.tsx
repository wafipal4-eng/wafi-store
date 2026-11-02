'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { IoIosSearch } from 'react-icons/io';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { fetchProducts } from '@/app/lib/productService'; // ⬅️ fallback fetch
import { cdn } from '@/lib/cdn';

interface Product {
  id: number;
  store_id: string;
  name: string;
  main_image?: string | null;
}

interface SearchComponentProps {
  onClose: () => void;
  products: Product[];
  setResults: (filtered: Product[]) => void;
}

/* Arabic/Latin tolerant normalizer */
function normSearch(s: string) {
  if (!s) return '';
  let out = s.toLowerCase();
  try {
    out = out.normalize('NFKD').replace(/[\u064B-\u0652\u0640]/g, '');
  } catch { }
  return out
    .replace(/[\u0622\u0623\u0625]/g, '\u0627') // آأإ -> ا
    .replace(/\u0649/g, '\u064A')               // ى -> ي
    .replace(/\u0629/g, '\u0647')               // ة -> ه
    .replace(/\u0660/g, '0').replace(/\u0661/g, '1').replace(/\u0662/g, '2')
    .replace(/\u0663/g, '3').replace(/\u0664/g, '4').replace(/\u0665/g, '5')
    .replace(/\u0666/g, '6').replace(/\u0667/g, '7').replace(/\u0668/g, '8')
    .replace(/\u0669/g, '9')
    .replace(/\s+/g, ' ')
    .trim();
}

function useDebounced<T>(value: T, ms = 90) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export default function SearchComponent({
  onClose,
  products,
  setResults,
}: SearchComponentProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // NEW: local cache that falls back to fetching if parent passed nothing
  const [localProducts, setLocalProducts] = useState<Product[]>(products || []);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const fetchedOnce = useRef(false);

  // keep local in sync if parent later provides data
  useEffect(() => {
    if (products && products.length) {
      setLocalProducts(products);
      setLoadingIndex(false);
      fetchedOnce.current = true;
    }
  }, [products]);

  // If we opened with zero products, fetch once here (mobile-safe fallback)
  useEffect(() => {
    if ((products?.length ?? 0) === 0 && !fetchedOnce.current) {
      fetchedOnce.current = true;
      setLoadingIndex(true);
      (async () => {
        try {
          const rows = await fetchProducts(); // this already filters by store_id in your service
          const normalized = (rows || []).map((p: any) => ({
            id: Number(p.id),
            store_id: String(p.store_id),
            name: String(p.name || ''),
            main_image: p.main_image ?? null,
          })) as Product[];
          setLocalProducts(normalized);
        } finally {
          setLoadingIndex(false);
        }
      })();
    }
  }, [products]);

  const debouncedQuery = useDebounced(query, 90);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const t = useTranslations('Search');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  // focus on open
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, []);

  // close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Filter (uses localProducts which may come from parent or fallback)
  const filtered = useMemo(() => {
    const q = normSearch(debouncedQuery);
    if (!q) return [];
    return localProducts.filter(p => normSearch(p.name).includes(q)).slice(0, 8);
  }, [localProducts, debouncedQuery]);

  // lift up if parent wants to show results elsewhere
  useEffect(() => setResults(filtered), [filtered, setResults]);

  const highlight = (name: string) => {
    const q = normSearch(debouncedQuery);
    if (!q) return name;
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const m = name.match(re);
    if (!m || m.index == null) return name;
    const start = m.index, end = start + m[0].length;
    return (
      <>
        {name.slice(0, start)}
        <mark className="bg-yellow-100 rounded px-0.5">{name.slice(start, end)}</mark>
        {name.slice(end)}
      </>
    );
  };

  const goTo = (p?: Product) => {
    const term = (p ? p.name : debouncedQuery).trim();
    if (!term) return;
    router.push(`/Products?search=${encodeURIComponent(term)}`);
    onClose();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filtered[activeIndex]) goTo(filtered[activeIndex]);
    else goTo();
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!filtered.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(activeIndex + 1, filtered.length - 1);
      setActiveIndex(next);
      listRef.current?.querySelectorAll('li')[next]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(activeIndex - 1, 0);
      setActiveIndex(prev);
      listRef.current?.querySelectorAll('li')[prev]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goTo(filtered[activeIndex]);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-black/5 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <form onSubmit={onSubmit} className="p-4 border-b">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-black/10">
            <IoIosSearch className="text-xl opacity-60" />
            <input
              ref={inputRef}
              type="search"
              className="w-full bg-transparent outline-none"
              placeholder={t('placeholder', { default: 'Search products…' })}
              value={query}
              inputMode="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              enterKeyHint="search"
              onInput={(e) => {
                const val = (e.target as HTMLInputElement).value;
                setQuery(val);
                setActiveIndex(0);
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
            />
          </label>
        </form>

        {/* Results */}
        <div className="max-h-[60vh] overflow-auto">
          {/* Loading index (only when we had to fallback-fetch) */}
          {loadingIndex && localProducts.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              {t('loading', { default: 'Loading products…' })}
            </div>
          ) : debouncedQuery.trim() && filtered.length > 0 ? (
            <ul ref={listRef} className="divide-y">
              {filtered.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => goTo(p)}
                    className={clsx(
                      'w-full text-left px-4 py-3 transition flex items-center gap-3',
                      i === activeIndex ? 'bg-gray-50' : 'hover:bg-gray-50'
                    )}
                    aria-selected={i === activeIndex}
                  >
                    {/* thumb */}
                    <div className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-black/5 bg-transparent">
                      {p.main_image ? (
                        <Image
                          src={cdn(p.main_image)}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-cover !bg-transparent"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400">
                          {t('noImage', { default: 'No Image' })}
                        </div>
                      )}
                    </div>


                    {/* text */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {highlight(p.name)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('idLabel', { id: p.id, default: `ID: ${p.id}` })}
                      </div>
                    </div>

                    {/* hint (hide on xs) */}
                    <span className="text-[10px] text-gray-400 hidden sm:inline">
                      {t('pressEnter', { default: 'Enter' })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : debouncedQuery.trim() ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              {t('noResults', { query: debouncedQuery, default: `No products found for “${debouncedQuery}”` })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {t('startTyping', { default: 'Start typing to search your products' })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-xs text-gray-500">
            {t('hints', { default: 'Use ↑/↓ to navigate, Enter to open, Esc to close' })}
          </div>
          <button
            onClick={() => goTo()}
            className="text-sm font-medium text-indigo-600 hover:underline disabled:text-gray-300"
            disabled={!debouncedQuery.trim()}
          >
            {t('searchBtn', { query: debouncedQuery, default: `Search “${debouncedQuery || '…'}”` })}
          </button>
        </div>
      </div>
    </div>
  );
}
