'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
    getBestSellingProducts,
    getLeastSellingProducts,
    getMostVisitedProducts,
    getLeastVisitedProducts,
    SalesProduct,
    PopularProduct
} from '@/app/lib/analyticsService';
import { nis } from '@/app/lib/constants';
import { cdn } from '@/lib/cdn';

export default function ProductStatsPage() {
    const t = useTranslations('ProductStats');

    const [bestSelling, setBestSelling] = useState<SalesProduct[]>([]);
    const [leastSelling, setLeastSelling] = useState<SalesProduct[]>([]);
    const [bestViewed, setBestViewed] = useState<PopularProduct[]>([]);
    const [leastViewed, setLeastViewed] = useState<PopularProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [selling, leastSell, viewed, leastView] = await Promise.all([
                    getBestSellingProducts(10),
                    getLeastSellingProducts(10),
                    getMostVisitedProducts(10),
                    getLeastVisitedProducts(10),
                ]);

                setBestSelling(selling);
                setLeastSelling(leastSell);
                setBestViewed(viewed);
                setLeastViewed(leastView);
            } catch (error) {
                console.error('Failed to fetch product stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('title')}</h1>
                <p className="mt-2 text-sm text-gray-600">{t('subtitle')}</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Best Selling */}
                <StatsCard title={t('bestSelling')} loading={loading}>
                    {bestSelling.length > 0 ? (
                        bestSelling.map((item) => (
                            <SalesProductCard key={item.product_id} item={item} t={t} />
                        ))
                    ) : (
                        <EmptyState message={t('noData')} />
                    )}
                </StatsCard>

                {/* Best Viewed */}
                <StatsCard title={t('bestViewed')} loading={loading}>
                    {bestViewed.length > 0 ? (
                        bestViewed.map((item) => (
                            <ViewProductCard key={item.product_id} item={item} t={t} />
                        ))
                    ) : (
                        <EmptyState message={t('noData')} />
                    )}
                </StatsCard>

                {/* Least Viewed */}
                <StatsCard title={t('leastViewed')} loading={loading}>
                    {leastViewed.length > 0 ? (
                        leastViewed.map((item) => (
                            <ViewProductCard key={item.product_id} item={item} t={t} />
                        ))
                    ) : (
                        <EmptyState message={t('noData')} />
                    )}
                </StatsCard>

                {/* Least Sold */}
                <StatsCard title={t('leastSold')} loading={loading}>
                    {leastSelling.length > 0 ? (
                        leastSelling.map((item) => (
                            <SalesProductCard key={item.product_id} item={item} t={t} />
                        ))
                    ) : (
                        <EmptyState message={t('noData')} />
                    )}
                </StatsCard>
            </div>
        </main>
    );
}

// Stats Card Wrapper
function StatsCard({ title, children, loading }: { title: string; children: React.ReactNode; loading: boolean }) {
    return (
        <section className="rounded-xl p-6 bg-white shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {children}
                </div>
            )}
        </section>
    );
}

// Sales Product Card
function SalesProductCard({ item, t }: { item: SalesProduct; t: any }) {
    const product = item.product;
    const imageUrl = cdn(product?.main_image || '') ?? '/placeholder.png';
    const productName = product?.name || t('noProducts');

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                <Image
                    src={imageUrl}
                    alt={productName}
                    fill
                    className="object-cover"
                    sizes="64px"
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{productName}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    <span>{t('totalSales')}: {item.total_sold}</span>
                </div>
            </div>
        </div>
    );
}

// View Product Card
function ViewProductCard({ item, t }: { item: PopularProduct; t: any }) {
    const product = item.product;
    const imageUrl = cdn(product?.main_image || '') ?? '/placeholder.png';
    const productName = product?.name || t('noProducts');

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                <Image
                    src={imageUrl}
                    alt={productName}
                    fill
                    className="object-cover"
                    sizes="64px"
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{productName}</p>
                <p className="text-sm text-gray-600 mt-1">
                    {t('views')}: {item.views}
                </p>
            </div>
        </div>
    );
}

// Empty State
function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-8 text-gray-500">
            <p>{message}</p>
        </div>
    );
}
