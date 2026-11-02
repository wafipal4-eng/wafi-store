"use client";

import { AnimatePresence, motion, wrap } from "framer-motion";
import { forwardRef, SVGProps, useRef, useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { main_color } from "@/app/lib/constants";
import { cdn } from "@/lib/cdn";

interface ImageSliderProps {
    images: string[];
    currentImageUrl?: string;
}

export default function ImageSlider({ images, currentImageUrl }: ImageSliderProps) {
    const locale = useLocale();
    const isArabic = locale === "ar";
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    const touchStartX = useRef(0);

    function setSlide(newDirection: 1 | -1) {
        const nextIndex = wrap(0, images.length, selectedIndex + newDirection);
        setSelectedIndex(nextIndex);
        setDirection(newDirection);
    }

    function handleTouchStart(e: React.TouchEvent) {
        touchStartX.current = e.touches[0].clientX;
    }

    function handleTouchEnd(e: React.TouchEvent) {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(deltaX) > 40) setSlide(deltaX > 0 ? -1 : 1);
    }

    useEffect(() => {
        if (!currentImageUrl) return;
        const index = images.findIndex((img) => img === currentImageUrl);
        if (index !== -1) setSelectedIndex(index);
    }, [currentImageUrl, images]);

    return (
        <div style={mainContainer}>
            <div style={sliderContainer} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                {/* Left Arrow */}
                <motion.button
                    initial={false}
                    style={isArabic ? rightButton : leftButton}
                    className="hidden sm:flex"
                    onClick={() => setSlide(isArabic ? 1 : -1)}
                >
                    {isArabic ? <ArrowRight /> : <ArrowLeft />}
                </motion.button>

                <AnimatePresence custom={direction} initial={false} mode="popLayout">
                    <Slide key={selectedIndex} src={images[selectedIndex]} direction={direction} />
                </AnimatePresence>

                {/* Right Arrow */}
                <motion.button
                    initial={false}
                    style={isArabic ? leftButton : rightButton}
                    className="hidden sm:flex"
                    onClick={() => setSlide(isArabic ? -1 : 1)}
                >
                    {isArabic ? <ArrowLeft /> : <ArrowRight />}
                </motion.button>
            </div>

            {/* Thumbnails */}
            <div style={thumbnailRow}>
                {images.map((src, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        style={{
                            ...thumbBox,
                            border: selectedIndex === index ? `2px solid ${main_color}` : "1px solid #ccc",
                            opacity: selectedIndex === index ? 1 : 0.7,
                        }}
                    >
                        <Image
                            src={cdn(src)}
                            alt={`Thumbnail ${index}`}
                            width={70}
                            height={70}
                            loading="lazy"
                            quality={40}
                            style={{ objectFit: "cover", borderRadius: 6 }}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

const Slide = forwardRef(function Slide(
    { src, direction }: { src: string; direction: 1 | -1 },
    ref: React.Ref<HTMLDivElement>
) {
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "transparent",
                borderRadius: "12px",
            }}
        >
            <Image
                src={cdn(src)}
                alt="Product slide"
                width={900}              // fixed so Safari doesn’t explode
                height={900}
                priority={false}
                quality={80}
                sizes="(max-width: 768px) 100vw, 600px"
                style={{
                    objectFit: "contain",  // 👈 FULL IMAGE GUARANTEED
                    width: "100%",
                    height: "100%",
                    borderRadius: "12px",
                }}
            />
        </motion.div>
    );
});


// ICONS
const iconsProps: SVGProps<SVGSVGElement> = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

function ArrowLeft() {
    return (
        <svg {...iconsProps} stroke="white">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </svg>
    );
}

function ArrowRight() {
    return (
        <svg {...iconsProps} stroke="white">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}

// STYLES

const mainContainer: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
};

const sliderContainer: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: 600,
    height: 400,
    overflow: "hidden",
    borderRadius: 12,
};

const slideBox: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};

const thumbnailRow: React.CSSProperties = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
};

const thumbBox: React.CSSProperties = {
    width: 70,
    height: 70,
    borderRadius: 6,
    overflow: "hidden",
    cursor: "pointer",
};

const arrowBase: React.CSSProperties = {
    backgroundColor: main_color,
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    cursor: "pointer",
};

const leftButton = { ...arrowBase, left: 10 };
const rightButton = { ...arrowBase, right: 10 };
