// ProductDetails/ImageGallery.jsx - Product image gallery with zoom and color sync
import { useState, useEffect, useRef } from 'react'
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react'

import Magnifier from 'react-magnifier'
import { FALLBACK_GALLERY } from './shared'

export const ImageGallery = ({ images, productName, isDesktop, isOnSale, selectedColor, onImageChange }) => {
    const [activeIndex, setActiveIndex] = useState(0)
    const touchStartRef = useRef({ x: 0, y: 0 })
    const touchEndRef = useRef({ x: 0, y: 0 })

    // Normalize images: if object (backend format) extract all relevant data
    const processedImages = Array.isArray(images) && images.length > 0
        ? images.map(img => typeof img === 'object' && img?.image_url
            ? { url: img.image_url, color: img.color, color_code: img.color_code }
            : { url: img, color: null, color_code: null }
        )
        : []

    // Filter images based on selected color
    const getFilteredImages = () => {
        if (!selectedColor || processedImages.length === 0) {
            return processedImages;
        }

        // Find images matching the selected color
        const colorImages = processedImages.filter(img =>
            img.color && img.color.toLowerCase() === selectedColor.toLowerCase()
        );

        // If we have images for this color, show them first, then others
        if (colorImages.length > 0) {
            const otherImages = processedImages.filter(img =>
                !img.color || img.color.toLowerCase() !== selectedColor.toLowerCase()
            );
            return [...colorImages, ...otherImages];
        }

        // If no color-specific images, show all
        return processedImages;
    };

    const filteredImages = getFilteredImages();
    const galleryImages = filteredImages.length > 0 ? filteredImages.map(i => i.url) : FALLBACK_GALLERY;
    const galleryImageData = filteredImages.length > 0 ? filteredImages : [];

    // Reset active index when color changes to show first image of that color
    useEffect(() => {
        if (selectedColor && filteredImages.length > 0) {
            setActiveIndex(0);
        }
    }, [selectedColor]);

    // Notify parent when image changes (for color sync)
    useEffect(() => {
        if (onImageChange && galleryImageData[activeIndex]) {
            const currentImage = galleryImageData[activeIndex];
            if (currentImage.color) {
                onImageChange(currentImage.color, currentImage.color_code);
            }
        }
    }, [activeIndex]);

    const handleImageSelect = (idx) => {
        setActiveIndex(idx);
        // If the selected image has a color and onImageChange is provided
        // notify parent (for color auto-selection when user clicks image)
        if (onImageChange && galleryImageData[idx]?.color) {
            onImageChange(galleryImageData[idx].color, galleryImageData[idx].color_code);
        }
    };

    // Navigate to next/prev image
    const goToNext = () => {
        setActiveIndex(prev => (prev + 1) % galleryImages.length);
    };

    const goToPrev = () => {
        setActiveIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    // Touch handlers for swipe
    const handleTouchStart = (e) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchEndRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; // Reset end on touch start
    };

    const handleTouchMove = (e) => {
        touchEndRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = () => {
        const diffX = touchStartRef.current.x - touchEndRef.current.x;
        const diffY = touchStartRef.current.y - touchEndRef.current.y;
        const minSwipeDistance = 50;

        // Ensure horizontal swipe is intentional, not just a slightly diagonal vertical scroll
        if (Math.abs(diffY) > Math.abs(diffX)) return;

        if (Math.abs(diffX) > minSwipeDistance) {
            if (diffX > 0) {
                // Swipe left -> next image
                goToNext();
            } else {
                // Swipe right -> prev image
                goToPrev();
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 font-outfit w-full min-w-0">
            {/* Main Image with Magnify (Rendered first on Mobile to push thumbs down) */}
            <div className="flex-1 order-1 md:order-2 relative z-20 bg-[#faf9f8] p-0 md:p-1 overflow-visible">
                <div
                    className="relative w-full aspect-[4/5] md:aspect-[3/4] flex items-center justify-center bg-neutral-100 overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {isDesktop ? (
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                            <Magnifier
                                src={galleryImages[activeIndex] || galleryImages[0]}
                                mgShape="square"
                                width="100%"
                                height="100%"
                                zoomFactor={2}
                                className="w-full h-full"
                                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                                mgStyles={{ objectFit: 'cover', objectPosition: 'top' }}
                            />
                        </div>
                    ) : (
                        <img
                            src={galleryImages[activeIndex] || galleryImages[0]}
                            alt={productName || 'Product Image'}
                            className="object-cover object-top w-full h-full transition-transform duration-500"
                        />
                    )}

                    {/* Mobile Navigation Arrows */}
                    {galleryImages.length > 1 && (
                        <>
                            <button
                                onClick={goToPrev}
                                className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/50 backdrop-blur-md text-black rounded-full flex items-center justify-center transition-colors z-30"
                            >
                                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                            <button
                                onClick={goToNext}
                                className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/50 backdrop-blur-md text-black rounded-full flex items-center justify-center transition-colors z-30"
                            >
                                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                        </>
                    )}
                </div>

                {/* Sale Badge Overlay */}
                {isOnSale && (
                    <div className="absolute top-4 left-4 z-20">
                        <div className="bg-white/90 backdrop-blur-sm text-black px-3 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase shadow-sm">
                            Limited Edition
                        </div>
                    </div>
                )}

                {/* Current Color Indicator */}
                {galleryImageData[activeIndex]?.color && (
                    <div className="absolute top-4 right-4 z-20">
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm text-black">
                            <div
                                className="w-2.5 h-2.5 rounded-full outline outline-1 outline-offset-1 outline-neutral-200"
                                style={{ backgroundColor: galleryImageData[activeIndex]?.color_code || '#ccc' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest font-semibold">{galleryImageData[activeIndex]?.color}</span>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Thumbnails */}
            <div className="order-2 md:order-1 w-full max-w-[calc(100vw-2rem)] md:max-w-none md:w-24 relative z-20">
                <div className="flex flex-row md:flex-col gap-3 overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto w-full pb-2 md:pb-0 scrollbar-hide snap-x md:snap-none" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {galleryImages.map((img, idx) => {
                    const imgData = galleryImageData[idx];
                    const hasColor = imgData?.color;
                    const isColorMatch = hasColor && selectedColor &&
                        imgData.color.toLowerCase() === selectedColor.toLowerCase();

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleImageSelect(idx)}
                            onMouseEnter={() => isDesktop && setActiveIndex(idx)}
                            className={`relative overflow-hidden aspect-[4/5] object-cover bg-neutral-100 flex-none w-[72px] md:w-full transition-all duration-300 snap-center
                                ${idx === activeIndex
                                    ? 'opacity-100 outline outline-1 outline-offset-2 outline-black/80'
                                    : 'opacity-50 hover:opacity-100 border-none'
                                }`}
                        >
                            <img
                                src={img}
                                alt={`${productName} thumbnail ${idx + 1}`}
                                className="h-full w-full object-cover object-top"
                            />
                            {/* Color indicator dot */}
                            {hasColor && (
                                <div
                                    className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                                    style={{ backgroundColor: imgData.color_code || '#ccc' }}
                                    title={imgData.color}
                                />
                            )}
                        </button>
                    );
                })}
                </div>
            </div>
        </div>
    )
}

export default ImageGallery
