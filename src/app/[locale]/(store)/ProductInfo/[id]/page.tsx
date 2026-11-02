"use client";
import React, { useState, useEffect } from 'react';
import ProductImageSlider from '@/app/components/shared-components/ProdutImageSlider';
import ProductDetails from '@/app/components/shared-components/ProductDetails';
import { usePathname } from 'next/navigation';
import { Product } from "@/app/lib/interfaces";
import { fetchProduct, fetchProductImages } from "@/app/lib/productService"; // Import the service

const Page = () => {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [product, setProduct] = useState<Product | null>(null);
    const [imagePath, setImagePath] = useState<string>(' ');

    const pathname = usePathname();
    const lastSegment = pathname?.split("/").filter(Boolean).pop();

    const handleVariantChange = (variantId: number, imagePath: string) => {
        setImagePath(imagePath);
      };
      
      
    useEffect(() => {
        const fetchProductData = async () => {
            if (!lastSegment) return;

            setLoading(true);
            try {
                const imagesData = await fetchProductImages(lastSegment); // Fetch images
                if (imagesData.length === 0) {
                } else {
                    setImages(imagesData);
                }

                const productData = await fetchProduct(lastSegment); // Fetch product
                if (productData) {
                    setProduct(productData);
                    if (productData.main_image && !images.includes(productData.main_image)) {
                        setImages((prevImages) => [productData.main_image, ...prevImages].filter((image): image is string => image !== null));
                    }
                }

            } catch (error) {
                console.error("Error fetching product data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [lastSegment]);

    if (loading) {
        return (
            <section className="grid grid-cols-1 md:grid-cols-8 gap-4 m-4 sm:m-6 animate-pulse">
                {/* Image skeleton */}
                <div className="grid md:col-span-5 h-[400px] bg-gray-200 rounded-2xl" />

                {/* Details skeleton */}
                <div className="md:col-span-3 space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />

                    <div className="space-y-2">
                        <div className="h-4 w-1/2 bg-gray-200 rounded" />
                        <div className="flex gap-2">
                            <div className="h-8 w-16 bg-gray-200 rounded-full" />
                            <div className="h-8 w-16 bg-gray-200 rounded-full" />
                        </div>
                    </div>

                    <div className="h-10 bg-gray-200 rounded-2xl" />

                    <div className="flex gap-4 mt-6">
                        <div className="h-10 w-full bg-gray-200 rounded-4xl" />
                        <div className="h-10 w-full bg-gray-200 rounded-4xl" />
                    </div>
                </div>
            </section>
        );
    }


    return (
        <section className="grid grid-cols-1 md:grid-cols-8 gap-4 m-4 sm:m-6" aria-label="Product Overview">
            <div className="grid md:col-span-5 h-full w-full">
                
            <ProductImageSlider key={imagePath} images={images} currentImageUrl={imagePath} />
            </div>
            <div className="h-full md:col-span-3">
                {product?.id && (
                    <ProductDetails productId={product.id} onVariantChange={handleVariantChange} />
                )}
            </div>
        </section>
    );
};

export default Page;
