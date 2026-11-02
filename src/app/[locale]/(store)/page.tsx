'use client'; // Mark as Client Component since we're using client-side auth

import { useTranslations } from 'next-intl';
import Marquee from 'react-fast-marquee';
import HeroCarousel from '@/app/components/shared-components/HeroCarousel';
import { useLocale } from 'next-intl';
import { main_color, secondary_color, supabase, marquee_text } from '@/app/lib/constants';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
// import Section2 from '@/app/components/shared-components/Section2';
import Section3 from '@/app/components/shared-components/Section3';
import Section4 from '@/app/components/shared-components/Section4';
import ProductShowcase from '@/app/components/shared-components/ProductShowcase';
import { SubscriptionGuard } from '@/app/components/guards/SubscriptionGuard';

async function checkAndPrintSession() {
  try {
    const { data: { }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error fetching session:', error.message);
      return;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

export default function HomePage() {
  const [isAtProducts, setIsAtProducts] = useState(false);

  // Run session check on component mount
  useEffect(() => {
    checkAndPrintSession();
  }, []); // Empty dependency array to run once on mount

  useEffect(() => {
    const updateButtonDirection = () => {
      const productsSection = document.getElementById('products-section');
      if (!productsSection) return;

      const triggerPoint = productsSection.offsetTop - window.innerHeight * 0.35;
      setIsAtProducts(window.scrollY >= triggerPoint);
    };

    updateButtonDirection();
    window.addEventListener('scroll', updateButtonDirection, { passive: true });
    window.addEventListener('resize', updateButtonDirection);

    return () => {
      window.removeEventListener('scroll', updateButtonDirection);
      window.removeEventListener('resize', updateButtonDirection);
    };
  }, []);

  const t = useTranslations('HomePage');
  const locale = useLocale();
  const isRTLmarquee = locale === 'en';
  const direction = isRTLmarquee ? 'left' : 'right';

  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <SubscriptionGuard>
      <div className="relative">
        <button
          type="button"
          onClick={isAtProducts ? scrollToTop : scrollToProducts}
          className="fixed bottom-16 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white opacity-80 shadow-md transition-transform duration-200 hover:scale-105 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: main_color, borderColor: main_color }}
        >
          {isAtProducts ? t('goToTop') : t('goToProducts')}
          {isAtProducts ? (
            <ArrowUp size={14} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <ArrowDown size={14} strokeWidth={2.5} aria-hidden="true" />
          )}
        </button>

        <HeroCarousel />
        <ProductShowcase />
        {/* <Hero /> */}

        {/* {false && } */}

        {/* <Section2 /> */}
        <Section4 />
        <Section3 />


      </div>
    </SubscriptionGuard>
  );
}
