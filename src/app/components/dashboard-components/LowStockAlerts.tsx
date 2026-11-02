'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { fetchLowStockProducts } from '@/app/lib/productService';
import { cdn } from '@/lib/cdn';
import { getProductName } from '@/app/lib/nameHelpers';
import { useLocale } from 'next-intl';
import { AlertTriangle, Package } from 'lucide-react';

interface LowStockProduct {
    id: number;
    name: string;
    main_image: string;
    quantity: number;
}

export default function LowStockAlerts() {
    const t = useTranslations('dashboard');
    const locale = useLocale();
    const [products, setProducts] = useState<LowStockProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const data = await fetchLowStockProducts();
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch low stock products:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="rounded-xl p-6 bg-white shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('lowStock')}</h2>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl p-6 bg-white shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('lowStock')}</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t('lowStockSubtitle')}</p>

            {products.length === 0 ? (
                <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">{t('allStocked')}</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className={`flex items-center gap-4 p-3 rounded-lg border-2 transition ${product.quantity === 0
                                ? 'bg-red-50 border-red-200'
                                : 'bg-amber-50 border-amber-200'
                                }`}
                        >
                            <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                                <Image
                                    src={cdn(product.main_image || '') ?? '/placeholder.png'}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{getProductName(product as any, locale)}</p>
                                <p className={`text-sm font-semibold ${product.quantity === 0 ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                    {product.quantity === 0
                                        ? t('outOfStock')
                                        : t('unitsLeft', { count: product.quantity })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
