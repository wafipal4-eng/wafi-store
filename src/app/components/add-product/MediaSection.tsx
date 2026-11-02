// components/product-form/MediaSection.tsx
"use client"

import React from "react"
import ImageUploader from "@/components/custom/images-uploader"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"

type Props = {
  images: File[]
  setImages: React.Dispatch<React.SetStateAction<File[]>>
}

export default function MediaSection({ images, setImages }: Props) {
  const t = useTranslations("AddProduct")

  return (
    <div>
      <Label>{t("images")}</Label>
      <ImageUploader images={images} setImages={setImages} />
    </div>
  )
}
