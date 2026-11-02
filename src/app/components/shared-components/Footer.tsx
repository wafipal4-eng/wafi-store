"use client";
import React from 'react';
import Image from 'next/image';
import { FaWhatsapp } from 'react-icons/fa';
import { useLocale, useTranslations } from 'next-intl';
import StickyMobileFooter from '@/app/components/shared-components/StickyMobileFooter';
import { main_color, footerLogo, footer_text, copyright_text, whatsapp } from "@/app/lib/constants";
import { Link } from '@/i18n/navigation';

const Footer = () => {
  const locale = useLocale();
  const details = footer_text[locale === "ar" ? "ar" : "en"];
  const isRtl = locale === 'ar';
  const copyText = copyright_text[isRtl ? "ar" : "en"];
  const t = useTranslations('Footer');

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 450);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <footer dir={isRtl ? 'rtl' : 'ltr'} className="text-black">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex justify-center mb-6">
              <Image
                src={footerLogo}
                alt={t('logoAlt')}
                width={400}
                height={400}
                className="max-h-[130px] h-auto w-auto object-contain"
              />
            </div>

            <div className="px-4 text-center space-y-4">
              <p><strong>{details.brand}</strong></p>
              <p className="text-sm text-gray-600">{details.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[#eceecd] p-6 pb-20 md:pb-6 space-y-3" style={{ backgroundColor: main_color }}>
        <p className="text-sm">
          © {new Date().getFullYear()} {copyText}
        </p>

        <Link
          href="/privacy-policy"
          className="inline-block text-sm underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          {t('privacyPolicy')}
        </Link>

        <Link href="/login" className="flex flex-col items-center gap-1 mt-3 opacity-70 hover:opacity-100 transition-opacity">
          <Image
            src="/logo.svg"
            alt="شعار المتجر"
            width={52}
            height={52}
            className="object-contain"
          />
        </Link>
      </div>

      {isMobile && <StickyMobileFooter />}
    </footer>
  );
};

export default Footer;
