"use client"

import { useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { store_id } from "@/app/lib/constants"
import * as exifr from "exifr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ImageUploaderProps {
  images: File[]
  setImages: (images: File[]) => void
  productId?: string | null
  maxImages?: number
}

/* =============================
   IMAGE COMPRESSION (WEBP + EXIF)
============================= */

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

        // resize logic
        if (width > height) {
          width = maxWidth
          height = maxWidth / ratio
        } else {
          height = maxWidth
          width = maxWidth * ratio
        }

        // handle exif rotation
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

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Conversion failed")

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

/* =============================
   MAIN COMPONENT
============================= */

export default function ImagesUploader({
  images,
  setImages,
  maxImages = 10,
  productId
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length && !uploading) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files?.length && !uploading) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    )

    const remaining = maxImages - images.length
    if (validFiles.length > remaining) {
      alert(`You can upload only ${remaining} more image(s).`)
      return
    }

    setUploading(true)
    setUploadCount(validFiles.length)

    const uploadedFiles: File[] = []

    for (const file of validFiles) {
      // ** Compress to WebP before upload **
      const compressed = await compressToWebP(file, {
        maxWidth: 1600,
        quality: 0.80
      })

      const filePath = `${store_id}/${Date.now()}_${compressed.name}`

      const { error: uploadError } = await supabase.storage
        .from("products-images")
        .upload(filePath, compressed, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error(`❌ Failed to upload ${file.name}:`, uploadError.message)
        continue
      }

      const { data: signedData, error: urlError } = await supabase.storage
        .from("products-images")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7)

      if (urlError || !signedData) {
        console.error("❌ Failed to create signed URL:", urlError?.message)
        continue
      }

      const signedUrl = signedData.signedUrl

      const { error: dbError } = await supabase.from("images").insert({
        image_path: signedUrl,
        product_id: productId ?? null,
      })

      if (dbError) {
        console.error("❌ Failed DB insert:", dbError.message)
      } else {
        uploadedFiles.push(compressed)
      }
    }

    setImages([...images, ...uploadedFiles])
    setUploading(false)
    setUploadCount(0)
  }

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors relative",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          uploading && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-1">
          Drag & drop images or click to upload
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF — {images.length}/{maxImages} uploaded
        </p>

        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*,video/*,.heic,.heif,.webp,.mp4,.mov"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
            <span className="ml-2 text-sm text-primary">
              Uploading {uploadCount} image{uploadCount > 1 ? "s" : ""}...
            </span>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={URL.createObjectURL(img)}
                alt=""
                className="h-24 w-full object-cover rounded-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(idx)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              <p className="text-xs truncate mt-1 text-center">
                {img.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
