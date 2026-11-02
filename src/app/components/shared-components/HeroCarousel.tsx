"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchHeroImages } from "@/app/lib/productService";
import { supabase, store_id } from "@/app/lib/constants";
import { cdn } from "@/lib/cdn";

import { useLocale } from "next-intl";

interface HeroImage {
  path: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  link?: string;
}

export default function HeroCarousel() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [current, setCurrent] = useState(0);
  const [images, setImages] = useState<any[]>([]);
  const [textColor, setTextColor] = useState('#ffffff');
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  // Fallback to placeholder if no images are uploaded
  const fallbackImages = ["/nour99/11.png", "/nour99/12.png", "/nour99/BG.png"];
  const displayImages = images.length > 0 ? images : fallbackImages;

  useEffect(() => {
    // Force play all videos
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [images]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const heroImages = await fetchHeroImages();
        // Fetch text color from store
        const { data: storeData } = await supabase.from('store').select('text_color').eq('id', store_id).single();
        if (storeData?.text_color) setTextColor(storeData.text_color);
        setImages(heroImages);
      } catch (err) {
        console.error("Failed to load hero images:", err);
      } finally {
        setLoading(false);
      }
    };
    loadImages();
  }, []);

  const nextSlide = () => {
    const len = displayImages.length;
    if (len <= 1) return;
    setCurrent((prev) => (prev + 1) % len);
  };

  const prevSlide = () => {
    const len = displayImages.length;
    if (len <= 1) return;
    setCurrent((prev) => (prev - 1 + len) % len);
  };

  useEffect(() => {
    const len = displayImages.length;
    if (len <= 1 || isHovered) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [displayImages, isHovered]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // In RTL, swiping left goes to the previous slide (next in visual order)
      isRTL ? prevSlide() : nextSlide();
    }
    if (isRightSwipe) {
      // In RTL, swiping right goes to the next slide (previous in visual order)
      isRTL ? nextSlide() : prevSlide();
    }
  };

  useEffect(() => {
    if (images.length > 0) {
      console.log("✅ Hero images loaded:", images);
    }
  }, [images]);

  if (loading) {
    return (
      <div className="relative w-full h-[70vh] md:h-[80vh] lg:h-[600px] overflow-hidden rounded-3xl mb-8 bg-gray-100 animate-pulse flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[70vh] md:h-[80vh] lg:h-[600px] overflow-hidden rounded-3xl mb-8 shadow-2xl group mt-3" 
      dir={isRTL ? "rtl" : "ltr"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] "
        style={{
          transform: `translateX(${isRTL ? (current * 100) : (current * -100)}%)`,
        }}
      >
        {displayImages.map((item, index) => {
          // Handle both old string format, new object format, and JSON string format
          let data: HeroImage = typeof item === 'string' ? { path: item } : item;
          
          if (typeof item === 'string' && item.trim().startsWith('{')) {
            try {
              data = JSON.parse(item);
            } catch (e) {
              console.error("Failed to parse hero image JSON:", e);
            }
          }

          const path = data.path || (typeof item === 'string' ? item : '');
          const title = data.title || "";
          const subtitle = data.subtitle || "";
          const buttonText = data.buttonText || "Shop Now";
          let link = data.link || "/Products";
          
          // Auto-fix old category links format
          if (link.startsWith('/Category/')) {
            const catId = link.split('/').pop();
            link = `/Products?category=${catId}`;
          }
          
          const imageUrl = cdn(path);
          
          return (
            <div
              key={`${path}-${index}`}
              className="relative min-w-full h-full"
            >
              {imageUrl.match(/\.(mp4|webm|mov)$/i) ? (
                <video 
                  src={imageUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  preload="auto"
                  className="w-full h-full object-cover"
                  onCanPlay={(e) => e.currentTarget.play()}
                />
              ) : imageUrl.match(/\.gif$/i) ? (
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  priority={index === 0}
                  className="object-cover"
                />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Content */}
              {title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-8 md:p-12">
                  <div className={`max-w-xl ${isRTL ? 'mr-auto text-right' : 'ml-0 text-left'}`}>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-wide" style={{ color: textColor, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="mt-3 text-base md:text-lg font-light opacity-90" style={{ color: textColor, textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
                        {subtitle}
                      </p>
                    )}
                    <Link
                      href={link}
                      className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-black shadow-xl transition-all hover:bg-black hover:text-white hover:scale-105 active:scale-95"
                    >
                      {buttonText}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      {displayImages.length > 1 && (
        <>
          {/* Back Button (Left in LTR, Right in RTL) */}
          <button
            onClick={prevSlide}
            className={`absolute ${isRTL ? 'right-4 md:right-6' : 'left-4 md:left-6'} top-1/2 -translate-y-1/2 rounded-full bg-black/20 hover:bg-black/40 p-2 md:p-3 backdrop-blur-md border border-white/10 transition-all hover:scale-110 z-20`}
            aria-label="Previous Slide"
          >
            {isRTL ? <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white" /> : <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-white" />}
          </button>

          {/* Forward Button (Right in LTR, Left in RTL) */}
          <button
            onClick={nextSlide}
            className={`absolute ${isRTL ? 'left-4 md:left-6' : 'right-4 md:right-6'} top-1/2 -translate-y-1/2 rounded-full bg-black/20 hover:bg-black/40 p-2 md:p-3 backdrop-blur-md border border-white/10 transition-all hover:scale-110 z-20`}
            aria-label="Next Slide"
          >
            {isRTL ? <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-white" /> : <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white" />}
          </button>
        </>
      )}

      {/* Dots */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-3 p-2 rounded-full bg-black/20 backdrop-blur-md">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 transition-all duration-300 rounded-full ${
                current === index
                  ? "w-8 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}