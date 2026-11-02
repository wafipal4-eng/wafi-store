"use client"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { store_id } from "@/app/lib/constants"
import { cdn } from "@/lib/cdn"
import * as exifr from "exifr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SingleImageUploaderProps {
  imageUrl: string | null
  setImageUrl: (url: string | null) => void
}

/* ==========================================
   IMAGE COMPRESSION (WEBP + EXIF ROTATION)
========================================== */

async function compressToWebP(file: File, options: any = {}) {
  const {
    maxWidth = 1600,
    quality = 0.80,
  } = options

  const orientation = await exifr.orientation(file).catch(() => 1)

  return new Promise<File>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string

      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        let width = img.width
        let height = img.height
        const ratio = width / height

        // Resize logic
        if (width > height) {
          width = maxWidth
          height = maxWidth / ratio
        } else {
          height = maxWidth
          width = maxWidth * ratio
        }

        // EXIF rotation logic
        const rot90 = orientation === 6
        const rot180 = orientation === 3
        const rot270 = orientation === 8

        if (rot90 || rot270) {
          canvas.width = height
          canvas.height = width
        } else {
          canvas.width = width
          canvas.height = height
        }

        if (ctx) {
          if (rot90) {
            ctx.rotate(90 * Math.PI / 180)
            ctx.translate(0, -canvas.width)
          } else if (rot180) {
            ctx.rotate(180 * Math.PI / 180)
            ctx.translate(-canvas.width, -canvas.height)
          } else if (rot270) {
            ctx.rotate(270 * Math.PI / 180)
            ctx.translate(-canvas.height, 0)
          }

          ctx.drawImage(img, 0, 0, width, height)
        }

        // Convert to webp blob
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Compression failed")

            const webpFile = new File(
              [blob],
              file.name.replace(/\.\w+$/, ".webp"),
              { type: "image/webp" }
            )

            resolve(webpFile)
          },
          "image/webp",
          quality
        )
      }
    }
  })
}

/* ==========================================
   SINGLE IMAGE UPLOADER COMPONENT
========================================== */

export default function SingleImageUploader({ imageUrl, setImageUrl }: SingleImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localImage, setLocalImage] = useState<File | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed")
      return
    }

    setUploading(true)

    // Compress before upload
    const compressed = await compressToWebP(file, {
      maxWidth: 1600,
      quality: 0.80
    })

    const filePath = `${store_id}/${Date.now()}_${compressed.name}`

    const { error: uploadError } = await supabase.storage
      .from("products-images")
      .upload(filePath, compressed, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload failed:", uploadError.message)
      alert("فشل رفع الصورة: " + uploadError.message)
      setUploading(false)
      return
    }

    // Use public URL since bucket is public
    const { data: publicData } = supabase.storage
      .from("products-images")
      .getPublicUrl(filePath)

    setImageUrl(publicData.publicUrl)
    setLocalImage(compressed)
    setUploading(false)
  }

  const removeImage = () => {
    setImageUrl(null)
    setLocalImage(null)
  }

  const getFileName = () => {
    if (localImage) return localImage.name
    if (imageUrl) return imageUrl.split("/").pop()?.split("?")[0]
    return null
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-1">Drag & drop an image or click to browse</p>
        <p className="text-xs text-muted-foreground">Supported: JPG, PNG, GIF, WEBP, HEIC, MP4, MOV</p>
        <input
          id="file-upload"
          type="file"
          accept="image/*,video/*,.heic,.heif,.webp,.mp4,.mov,.avi"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}

      {(imageUrl || localImage) && (
        <div className="relative group w-fit mx-auto">
          <img
            src={localImage ? URL.createObjectURL(localImage) : cdn(imageUrl!)}
            alt="Uploaded"
            className="h-24 w-24 object-cover rounded-md"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 group-opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              removeImage()
            }}
          >
            <X className="h-3 w-3" />
          </Button>
          {getFileName() && (
            <p className="text-xs mt-1 truncate max-w-[96px] text-center">{getFileName()}</p>
          )}
        </div>
      )}
    </div>
  )
}
