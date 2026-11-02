'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

import { Link } from '@/i18n/navigation';
import SearchComponent from '@/app/components/shared-components/SearchComponent';
import { main_color, navbarLogo } from '@/app/lib/constants';

const Navbar: React.FC<{ children?: React.ReactNode }> = () => {
    const t = useTranslations('Navbar');
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const isRtl = ['ar', 'he', 'fa', 'ur'].includes(locale);

    const [isSearchOpen, setIsSearchOpen] = useState(false);



    const switchLocale = () => {
        const newLocale = locale === 'en' ? 'ar' : 'en';
        const segments = pathname.split('/');
        if (segments[1] === 'en' || segments[1] === 'ar') {
            segments[1] = newLocale;
        } else {
            segments.splice(1, 0, newLocale);
        }
        const newPath = segments.join('/');
        router.push(newPath);
    };

    return (
        <div
            className="navbar shadow-sm rounded-b-[2rem] flex justify-between px-4 text-black"
            style={{
                backgroundColor: main_color,
                height: '80px',
                position: 'sticky',
                top: 0,
                zIndex: 20,
                direction: isRtl ? 'rtl' : 'ltr',
            }}
        >
            {/* Left: Burger Icon */}
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
            </div>

            {/* Center: Logo */}
            <div className="flex-1 flex justify-center">
                <Link href="/">
                    <Image
                        src={navbarLogo}
                        alt={t('logoAlt')}
                        height={80}
                        width={120}
                        className="cursor-pointer "
                        />
                </Link>
            </div>

            {/* Right: Locale Switch & Search */}
            <div className="flex items-center gap-2 relative">
                <button
                    className="text-white rounded-full p-2 flex items-center gap-1 hover:opacity-90"
                >
                    <span className="text-lg font-semibold">
                        {locale === 'AR' ? 'AR' : 'AR'}
                    </span>
                </button>

                {isSearchOpen && (
                    <SearchComponent
                        onClose={() => {
                            setIsSearchOpen(false);
                        }}
                        products={[]}
                        setResults={() => { }}
                    />
                )}
            </div>
        </div>
    );
};

export default Navbar;
