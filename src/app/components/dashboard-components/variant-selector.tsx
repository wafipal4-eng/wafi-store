"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cdn } from "@/lib/cdn"

interface VariantImage {
  id: string
  url: string
  alt: string
  label?: string
}

interface Variant {
  id: string
  name: string
  type: string
  images: VariantImage[]
}

const variants: Variant[] = [
  {
    id: "color",
    name: "Color",
    type: "color",
    images: [
      { id: "red", url: "/placeholder.svg?height=80&width=80", alt: "Red variant", label: "Red" },
      { id: "blue", url: "/placeholder.svg?height=80&width=80", alt: "Blue variant", label: "Blue" },
      { id: "green", url: "/placeholder.svg?height=80&width=80", alt: "Green variant", label: "Green" },
      { id: "black", url: "/placeholder.svg?height=80&width=80", alt: "Black variant", label: "Black" },
    ],
  },
  {
    id: "material",
    name: "Material",
    type: "material",
    images: [
      { id: "leather", url: "/placeholder.svg?height=80&width=80", alt: "Leather material", label: "Leather" },
      { id: "fabric", url: "/placeholder.svg?height=80&width=80", alt: "Fabric material", label: "Fabric" },
      { id: "metal", url: "/placeholder.svg?height=80&width=80", alt: "Metal material", label: "Metal" },
    ],
  },
  {
    id: "pattern",
    name: "Pattern",
    type: "pattern",
    images: [
      { id: "solid", url: "/placeholder.svg?height=80&width=80", alt: "Solid pattern", label: "Solid" },
      { id: "striped", url: "/placeholder.svg?height=80&width=80", alt: "Striped pattern", label: "Striped" },
      { id: "dotted", url: "/placeholder.svg?height=80&width=80", alt: "Dotted pattern", label: "Dotted" },
      { id: "checkered", url: "/placeholder.svg?height=80&width=80", alt: "Checkered pattern", label: "Checkered" },
      { id: "floral", url: "/placeholder.svg?height=80&width=80", alt: "Floral pattern", label: "Floral" },
    ],
  },
]

export default function VariantSelector() {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    color: "red",
    material: "leather",
    pattern: "solid",
  })

  const handleImageSelect = (variantId: string, imageId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantId]: imageId,
    }))
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Product Variants</h2>
        <p className="text-muted-foreground">Select your preferred options for each variant</p>
      </div>

      <div className="space-y-6">
        {variants.map((variant) => (
          <Card key={variant.id} className="w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{variant.name}</CardTitle>
                {selectedVariants[variant.id] && (
                  <Badge variant="secondary">
                    {variant.images.find((img) => img.id === selectedVariants[variant.id])?.label || "Selected"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {variant.images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => handleImageSelect(variant.id, image.id)}
                    className={`
                      relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105
                      ${
                        selectedVariants[variant.id] === image.id
                          ? "ring-2 ring-primary ring-offset-2 shadow-lg"
                          : "ring-1 ring-border hover:ring-2 hover:ring-primary/50"
                      }
                    `}
                  >
                    <Image
                      src={cdn(image.url) || "/placeholder.svg"}
                      alt={image.alt}
                      width={80}
                      height={80}
                      className="object-cover w-20 h-20"
                    />
                    {selectedVariants[variant.id] === image.id && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Current Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {variants.map((variant) => {
              const selectedImage = variant.images.find((img) => img.id === selectedVariants[variant.id])
              return (
                <div key={variant.id} className="flex items-center gap-3">
                  <div className="relative">
                    <Image
                      src={cdn(selectedImage?.url) || "/placeholder.svg?height=40&width=40"}
                      alt={selectedImage?.alt || "Selected variant"}
                      width={40}
                      height={40}
                      className="object-cover w-10 h-10 rounded"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{variant.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedImage?.label || "None selected"}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
