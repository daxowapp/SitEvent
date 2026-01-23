"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCarouselProps {
    images: string[];
    alt: string;
}

export function ImageCarousel({ images, alt }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-advance
    useEffect(() => {
        if (!isHovered) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % images.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [isHovered, images.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    if (!images || images.length === 0) return null;

    return (
        <div
            className="relative group w-full h-full overflow-hidden bg-gray-100 rounded-2xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Slides container */}
            <div
                className="flex h-full transition-transform duration-700 ease-out will-change-transform"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((src, index) => (
                    <div key={index} className="w-full h-full flex-shrink-0 relative">
                        {/* Gradient Overlay for better text readibility if needed, keeping it subtle here */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt={`${alt} - Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows - Only show if more than 1 image */}
            {images.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                        onClick={prevSlide}
                    >
                        <ChevronLeft className="h-6 w-6" />
                        <span className="sr-only">Previous slide</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                        onClick={nextSlide}
                    >
                        <ChevronRight className="h-6 w-6" />
                        <span className="sr-only">Next slide</span>
                    </Button>
                </>
            )}

            {/* Dots Indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? "bg-white w-8"
                                    : "bg-white/50 hover:bg-white/80"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
