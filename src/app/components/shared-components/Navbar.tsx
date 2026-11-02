'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { TbShoppingBagHeart } from 'react-icons/tb';
import { IoIosSearch } from 'react-icons/io';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import NavMobile from '@/app/components/shared-components/NavMobile';
import SearchComponent from '@/app/components/shared-components/SearchComponent';
import { main_color, navbarLogo, SUPPORTED_LANGUAGES } from '@/app/lib/constants';
import { useCart } from '@/app/context/CartContext';
import { fetchProducts } from '@/app/lib/productService';

const Navbar: React.FC = () => {
  const locale = useLocale();
  const t = useTranslations('Navbar');
  const isRtl = ['ar', 'he', 'fa', 'ur'].includes(locale);
  const pathname = usePathname();
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const { cartCount, cartTotal } = useCart();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 450);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const products = await fetchProducts();
      setAllProducts(products || []);
    };
    loadProducts();
  }, []);

  const toggleSearch = () => setIsSearchOpen((prev) => !prev);

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsLangMenuOpen(false);
  };

  if (isMobile) return <NavMobile />;

  return (
    <div
      className="navbar shadow-sm md:rounded-b-[2rem] flex justify-between px-2 md:px-4 text-black w-full"
      style={{
        backgroundColor: main_color,
        height: '80px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <label htmlFor="my-drawer" className="cursor-pointer">
          <Image
            src="/icons/burger.svg"
            alt={t('openDrawer')}
            width={48}
            height={48}
            style={{ filter: 'invert(100%) brightness(200%)' }}
          />
        </label>

        {/* Language Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="cursor-pointer font-semibold text-white uppercase px-3 py-1 rounded-lg hover:bg-white/20 transition"
          >
            {locale.toUpperCase()}
          </button>

          {isLangMenuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsLangMenuOpen(false)}
              />

              {/* Dropdown Menu */}
              <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg py-1 min-w-[80px] z-20">
                {SUPPORTED_LANGUAGES.all.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLocaleChange(lang)}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition ${locale === lang ? 'bg-gray-50 font-semibold' : ''
                      }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {isSearchOpen && (
          <SearchComponent
            onClose={toggleSearch}
            products={allProducts}
            setResults={setSearchResults}
          />
        )}
      </div>

      {/* Center Logo */}
      <div className="flex-1 flex justify-center items-center">
        <Link href="/" prefetch={false}>
          <Image
            src={navbarLogo}
            alt={t('logoAlt')}
            height={100}
            width={220}
            className="cursor-pointer "
          />

        </Link>
      </div>

      {/* Right */}
      <div className="flex gap-4 items-center">
        <button
          className="bg-white rounded-4xl p-2"
          onClick={toggleSearch}
          aria-label="Search"
        >
          <IoIosSearch size={25} />
        </button>

        <Link
          href="/Cart"
          prefetch={false}
          className="bg-white rounded-4xl p-2 flex items-center justify-center relative gap-1"
        >
          <TbShoppingBagHeart size={25} />
          {t('currency')} {cartTotal.toFixed(2)}
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
