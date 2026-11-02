'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackVisit } from '@/app/lib/analyticsService';

export default function StoreVisitorTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname) return;

        const timeoutId = setTimeout(() => {
            trackVisit(pathname);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    return null; // This component doesn't render anything
}
