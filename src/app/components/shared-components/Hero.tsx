'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  heroMobileImage,
  heroImage2,
  hero_text,
  main_color,
  store_id,
} from '@/app/lib/constants';
import { createBrowserClient } from '@supabase/ssr';
import { cdn } from '@/lib/cdn';

type StoreRow = {
  hero_mobile: string | null; // can be "products-images/8/file.webp" OR "8/file.webp"
  hero_laptop: string | null;
};

const BUCKET = 'products-images';
const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 days

const normalizeDbToStoragePath = (dbValue: string | null): string | null => {
  if (!dbValue) return null;

  // Accept:
  // "products-images/8/file.webp"
  // "/products-images/8/file.webp"
  // "8/file.webp"
  const cleaned = dbValue.replace(/^\//, '');
  const prefix = `${BUCKET}/`;
  return cleaned.startsWith(prefix) ? cleaned.slice(prefix.length) : cleaned;
};

const Hero = () => {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const content = hero_text[isRTL ? 'ar' : 'en'];

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // ✅ Keep fallbacks from constants (in case DB is empty or fetch fails)
  // These constants may be full CDN URLs or local asset paths - cdn() should handle them in your app.
  const [mobileUrl, setMobileUrl] = useState<string>();
  const [laptopUrl, setLaptopUrl] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    const fetchHeroImages = async () => {
      try {
        const { data, error } = await supabase
          .from('store')
          .select('hero_mobile, hero_laptop')
          .eq('id', store_id)
          .single<StoreRow>();

        if (error) throw error;
        if (!data || cancelled) return;

        // Convert DB values into storage paths and create signed URLs
        const mobilePath = normalizeDbToStoragePath(data.hero_mobile);
        const laptopPath = normalizeDbToStoragePath(data.hero_laptop);

        const [mobileSigned, laptopSigned] = await Promise.all([
          mobilePath
            ? supabase.storage.from(BUCKET).createSignedUrl(mobilePath, SIGNED_TTL)
            : Promise.resolve({ data: null, error: null }),
          laptopPath
            ? supabase.storage.from(BUCKET).createSignedUrl(laptopPath, SIGNED_TTL)
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (cancelled) return;

        // Only overwrite fallbacks if we actually got signed URLs
        const nextMobile = mobileSigned?.data?.signedUrl;
        const nextLaptop = laptopSigned?.data?.signedUrl;

        if (nextMobile) setMobileUrl(nextMobile);
        if (nextLaptop) setLaptopUrl(nextLaptop);
      } catch (err) {
        console.error('Error fetching hero images:', err);
        // Keep constants as fallback
      }
    };

    fetchHeroImages();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <section className="relative w-full md:h-[84vh] overflow-hidden">
      {/* ✅ Mobile Image */}
      <div className="block md:hidden relative h-[80vh] mt-2">
        <img
          src={cdn(mobileUrl)}
          alt="Hero mobile background"
          className="absolute inset-0 w-full h-full object-cover object-center brightness-90 rounded-t-3xl"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
          <h1 className="text-black text-3xl font-extrabold leading-tight mb-3 drop-shadow-sm">
            {content.title}
          </h1>
          <p className="text-black text-base font-bold leading-relaxed mb-5 max-w-sm drop-shadow-sm">
            {content.description}
          </p>

          <Link
            href="/Products"
            prefetch={false}
            className="text-white font-medium px-6 py-2 rounded-md transition-all duration-300 hover:opacity-100 opacity-90 border"
            style={{ backgroundColor: main_color, borderColor: main_color }}
          >
            {content.cta}
          </Link>
        </div>
      </div>

      {/* ✅ Desktop Image */}
      <div className="hidden md:block absolute inset-0 mt-2">
        <img
          src={cdn(laptopUrl)}
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover object-[30%_center] brightness-[1] rounded-t-4xl"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-black text-6xl md:text-5xl font-extrabold tracking-tight">
            {content.title}
          </h1>
          <p className="text-black font-light md:text-3xl mb-6">
            {content.description}
          </p>

          <Link
            href="/Products"
            prefetch={false}
            className="text-white font-medium px-8 py-2 tracking-wide rounded-md transition-all duration-300 hover:opacity-100 opacity-90 border"
            style={{ backgroundColor: main_color, borderColor: main_color }}
          >
            {content.cta}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
