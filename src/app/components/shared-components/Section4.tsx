'use client';

import React, { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { store_id } from '@/app/lib/constants';
import { cdn } from '@/lib/cdn';
import type { Category } from '@/app/lib/interfaces';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── CategoryButton ──────────────────────────────────────────────────────────
interface CategoryButtonProps {
  src: string;
  title: string;
  onClick?: () => void;
}

export function CategoryButton({ src, title, onClick }: CategoryButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className="relative flex flex-col items-center justify-end transition-all duration-150"
      style={{
        gap: '8px',
        width: '100%',
        aspectRatio: '1/1',
        padding: '8px 4px 10px',
        background: '#F5F0EB',
        border: 'none',
        borderRadius: '32px',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        boxShadow: pressed
          ? '0 2px 8px rgba(45,138,78,0.15)'
          : '0 4px 16px rgba(45,138,78,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Image */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        {src ? (
          <img
            src={src}
            alt={title}
            className="w-full h-full object-contain flex-shrink-0 max-h-[95%]"
          />
        ) : (
          <div className="w-full h-full max-h-[95%] rounded-lg bg-gray-200" />
        )}
      </div>

      {/* Label */}
      <span
        className="text-xs sm:text-sm md:text-base font-bold text-gray-900 text-center leading-tight"
        style={{ letterSpacing: '-0.3px' }}
      >
        {title}
      </span>
    </button>
  );
}

const Section4: React.FC = () => {
  const t = useTranslations('HomePage');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store_id)
        .eq('is_visible', true)
        .neq('orderby', -1)
        .order('orderby', { ascending: true });

      if (error || !data) return;
      setCategories(data as Category[]);
    };
    load();
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-6 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('categoriesTitle')}
          </h2>
          <p className="mt-2 text-gray-600 text-sm md:text-base">
            {t('categoriesSubtitle')}
          </p>
        </div>

      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
          {categories.map((cat) => {
            const extrasRaw = cat.extras;
            const extras = typeof extrasRaw === 'string' ? JSON.parse(extrasRaw) : extrasRaw;
            const imagePath = extras?.image_path;
            const imgSrc = imagePath ? cdn(imagePath) : '';
            const displayName =
              locale === 'ar' ? cat.name : cat.secondary_name || cat.name;

            return (
              <CategoryButton
                key={cat.id}
                src={imgSrc}
                title={displayName}
                onClick={() =>
                  router.push(`/Products?category=${cat.id}` as any)
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Section4;
