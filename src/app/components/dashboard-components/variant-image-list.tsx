'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchAllProductImages, fetchVariants, updateVariantImagePath } from '@/app/lib/productService';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cdn } from '@/lib/cdn';
interface Variant {
    id: string;
    attributes: { attribute: string; attribute_item: string }[];
    in_stock: boolean;
    price_modifier: number;
    images: {
        id: string;
        url: string;
        alt: string;
        label?: string;
    }[];
}

interface VariantImageListProps {
    productId: number | string;
}

export default function VariantImageList({ productId }: VariantImageListProps) {
    const PRODUCT_ID = String(productId);
    console.log('Product ID:', PRODUCT_ID);
    const t = useTranslations('Variants');
    const [variants, setVariants] = useState<Variant[]>([]);
    const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});

    useEffect(() => {
        const load = async () => {
            const [variantList, imageList] = await Promise.all([
                fetchVariants(PRODUCT_ID),
                fetchAllProductImages(PRODUCT_ID),
            ]);

            const enriched = variantList.map((variant, index) => {
                const images = imageList.map((url, idx) => ({
                    id: `img-${index}-${idx}`,
                    url,
                    alt: `${variant.attributes.map((a) => a.attribute_item).join(', ')} image ${idx + 1}`,
                    label: `View ${idx + 1}`,
                }));

                return { ...variant, images };
            });

            setVariants(enriched);
        };

        load();
    }, []);

    const handleImageSelect = async (variantId: string, imageId: string) => {
        const variant = variants.find((v) => v.id === variantId);
        const selectedImage = variant?.images.find((img) => img.id === imageId);
        if (!selectedImage) return;

        setSelectedImages((prev) => ({
            ...prev,
            [variantId]: imageId,
        }));

        const success = await updateVariantImagePath(variantId, selectedImage.url);

        if (success) {
            toast.success(`${t('updatedImage')} ${variantId}`);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{t('title')}</h2>
                <p className="text-muted-foreground">{t('description')}</p>
            </div>

            <div className="space-y-4">
                {variants.length === 0 ? (
                    <div className="text-center text-muted-foreground border border-dashed rounded-md p-6">
                        {t('noVariantsFound', { default: 'No variants found. You can skip.' })}
                    </div>
                ) : (
                    <>
                        {variants.map((variant) => (

                            <Card key={variant.id} className="w-full">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* Variant Info */}
                                        <div className="lg:w-64 flex-shrink-0">
                                            <h3 className="font-semibold text-lg mb-2">
                                                {variant.attributes.map((a) => a.attribute_item).join(' / ')}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {variant.attributes.map((a, idx) => (
                                                    <Badge key={idx}>{a.attribute_item}</Badge>
                                                ))}
                                            </div>
                                            {selectedImages[variant.id] && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {t('selected')}: {variant.images.find((img) => img.id === selectedImages[variant.id])?.label}
                                                </p>
                                            )}
                                        </div>

                                        {/* Image List */}
                                        <div className="flex-1">
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {variant.images.map((image) => (
                                                    <button
                                                        type="button"
                                                        key={image.id}
                                                        onClick={() => handleImageSelect(variant.id, image.id)}
                                                        className={`
                          relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105
                          ${selectedImages[variant.id] === image.id
                                                                ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
                                                                : 'ring-1 ring-border hover:ring-2 hover:ring-primary/50'}
                        `}
                                                    >
                                                        <Image
                                                            src={cdn(image.url)}
                                                            alt={image.alt || "Variant image"}
                                                            width={100}
                                                            height={100}
                                                            className="w-24 h-24 lg:w-28 lg:h-28 object-contain rounded-md bg-white"
                                                            quality={70}
                                                        />


                                                        {selectedImages[variant.id] === image.id && (
                                                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                                                    <svg
                                                                        className="w-5 h-5 text-primary-foreground"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {image.label && (
                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                                                                {image.label}
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </>
                )}
                <Button type="submit">{t('next')}</Button>
            </div>
        </div>
    );
}
