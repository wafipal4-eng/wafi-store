"use client"

import { useEffect, useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { fetchProductImages } from "@/app/lib/productService"
import type { Product } from "@/app/lib/interfaces"
import { useTranslations } from "next-intl"
import { nis } from "@/app/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, ImageIcon, InfoIcon, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { cdn } from "@/lib/cdn"

interface ViewProductModalProps {
  viewProduct: Product | null
  setViewProduct: (product: Product | null) => void
}

export function ViewProductModal({ viewProduct, setViewProduct }: ViewProductModalProps) {
  const t = useTranslations("AdminTable")
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("gallery")

  useEffect(() => {
    const load = async () => {
      if (!viewProduct?.id) return
      setLoading(true)
      try {
        const imgs = await fetchProductImages(viewProduct.id)
        setImages(imgs)
      } catch (error) {
        console.error("Failed to load images:", error)
      } finally {
        setLoading(false)
      }
    }

    if (viewProduct) {
      setActiveImageIndex(0)
      setActiveTab("gallery")
      load()
    }
  }, [viewProduct?.id])

  if (!viewProduct) return null

  const allImages = viewProduct.main_image ? [viewProduct.main_image, ...images] : images

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <Dialog open={!!viewProduct} onOpenChange={() => setViewProduct(null)}>
      {/* Custom dialog content to bypass the shadcn/ui size constraints */}
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setViewProduct(null)}>
        <div
          className="w-[95vw] h-[95vh] max-w-[1920px] max-h-[1200px] bg-white rounded-lg shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
            onClick={() => setViewProduct(null)}
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>

          <div className="flex flex-col md:flex-row h-full">
            {/* Left side - Images */}
            <div className="w-full md:w-2/3 h-full md:border-r relative bg-gray-50">
              {/* Main image display */}
              <div className="relative h-full flex items-center justify-center p-4">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="w-4/5 h-4/5 rounded-lg" />
                  </div>
                ) : allImages.length > 0 ? (
                  <>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={cdn(allImages[activeImageIndex]) || "/placeholder.svg"}
                        alt={viewProduct.name}
                        className="max-w-full max-h-full object-contain transition-opacity duration-300"
                      />
                    </div>

                    {/* Navigation arrows */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-700" />
                        </button>
                      </>
                    )}

                    {/* Image counter */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {activeImageIndex + 1} / {allImages.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="h-16 w-16 mb-2" />
                    <p>{t("noImages", { default: "No images available" })}</p>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-sm border-t flex items-center px-4 overflow-x-auto">
                  <div className="flex space-x-2 py-2">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={cn(
                          "h-20 w-20 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all",
                          activeImageIndex === idx
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-gray-200 hover:border-gray-300",
                        )}
                      >
                        <img
                          src={cdn(img) || "/placeholder.svg"}
                          alt={`Thumbnail ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Product details */}
            <div className="w-full md:w-1/3 h-full overflow-y-auto">
              <div className="p-8">
                {/* Header with status badge */}
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 leading-tight">{viewProduct.name}</h2>
                  <Badge variant="default" className={viewProduct.in_stock ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                    {viewProduct.in_stock ? t("inStock") : t("outOfStock")}
                  </Badge>
                </div>

                {/* Price */}
                <div className="mb-6 flex items-center gap-3">
                  {viewProduct.new_price ? (
                    <>
                      <p className="text-2xl font-semibold text-gray-900">
                        {viewProduct.new_price} {nis}
                      </p>
                      <p className="text-lg font-medium text-red-500 line-through">
                        {viewProduct.price} {nis}
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">
                      {viewProduct.price} {nis}
                    </p>
                  )}
                </div>


                {/* Tabs for different sections */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="gallery" className="flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4" />
                      <span>{t("gallery", { default: "Gallery" })}</span>
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center gap-1.5">
                      <InfoIcon className="h-4 w-4" />
                      <span>{t("details", { default: "Details" })}</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="gallery" className="mt-0">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-700">{t("galleryImages", { default: "Gallery Images" })}</h3>

                      {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                          {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="aspect-square rounded-md" />
                          ))}
                        </div>
                      ) : images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {images.map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveImageIndex(viewProduct.main_image ? idx + 1 : idx)}
                              className="aspect-square overflow-hidden rounded-md border shadow-sm hover:shadow-md transition-all"
                            >
                              <img
                                src={cdn(url) || "/placeholder.svg"}
                                alt={`Product image ${idx + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>{t("noAdditionalImages", { default: "No additional images" })}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-0 space-y-6">
                    {/* Description */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">{t("description")}</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {viewProduct.description ? (
                          <p className="text-gray-700 whitespace-pre-line">{viewProduct.description}</p>
                        ) : (
                          <p className="text-gray-400 italic">
                            {t("noDescription", { default: "No description provided" })}
                          </p>
                        )}
                      </div>
                    </div>



                    {/* Product ID */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">{t("productId")}</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-600 font-mono text-sm break-all">{viewProduct.id}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add a backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" />
    </Dialog>
  )
}
