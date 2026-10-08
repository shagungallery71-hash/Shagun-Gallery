import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'
import Button from './ui/Button'

import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

const fallbackSlides = [
    {
        id: 1,
        title: 'FESTIVE GLAMOUR',
        subtitle: 'THE NEW COLLECTION 2025',
        description: 'Exquisite designs blending timeless tradition with contemporary elegance.',
        image_url: 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062147/Gemini_Generated_Image_c06zguc06zguc06z_2_vo7pcz.jpg',
        button_text: 'Discover the Collection',
        button_link: '/products',
    },
    {
        id: 2,
        title: 'BRIDAL DREAMS',
        subtitle: 'PREMIUM COUTURE',
        description: 'Make your special day unforgettable with our handcrafted bridal masterpieces.',
        image_url: 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062401/Gemini_Generated_Image_ajivycajivycajiv_2_hq3kg2.jpg',
        button_text: 'Shop Bridal',
        button_link: '/products',
    },
    {
        id: 3,
        title: 'ETHNIC ROYALE',
        subtitle: 'LIMITED EDITION HERITAGE',
        description: 'Celebrate your heritage with modern sophistication and premium craftsmanship.',
        image_url: 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062766/fontlogo3_nj8da9.webp',
        button_text: 'Explore Heritage',
        button_link: '/products?category=heritage',
    },
]

// Framer Motion Variants for Staggered Animation
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.6 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.8 } 
    }
}

export default function HeroSection() {
    const [slides, setSlides] = useState(fallbackSlides)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const slidesRes = await api.getHeroSlides().catch(() => null)
                if (slidesRes?.success && slidesRes.data?.length > 0) setSlides(slidesRes.data)
            } catch (e) { console.warn('Hero fetch failed:', e) }
        }
        fetchData()
    }, [])

    return (
        <section className="relative w-full h-[70vh] lg:h-screen bg-black overflow-hidden font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap');
                
                .font-playfair { font-family: 'Playfair Display', serif; }
                .font-outfit { font-family: 'Outfit', sans-serif; }
                
                .hero-pagination .swiper-pagination-bullet {
                    background: rgba(255,255,255,0.4);
                    width: 30px;
                    height: 2px;
                    border-radius: 0;
                    margin: 0 4px !important;
                    transition: all 0.4s ease;
                }
                .hero-pagination .swiper-pagination-bullet-active {
                    background: #fff;
                    width: 45px;
                }
            `}</style>

            <Swiper
                modules={[Autoplay, EffectFade, Pagination]}
                effect="fade"
                speed={1600}
                autoplay={{ delay: 6000, disableOnInteraction: false }}
                pagination={{ clickable: true, el: '.custom-hero-pagination' }}
                loop={true}
                className="w-full h-full"
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={slide.id || index}>
                        {({ isActive }) => (
                            <div className="relative w-full h-full flex items-center justify-center text-center">
                                
                                {/* Background Image with subtle continuous scale */}
                                <motion.div 
                                    className="absolute inset-0 w-full h-full"
                                    initial={{ scale: 1 }}
                                    animate={{ scale: isActive ? 1.05 : 1 }}
                                    transition={{ duration: 10, ease: "linear" }}
                                >
                                    <img 
                                        src={slide.image_url} 
                                        alt={slide.title} 
                                        className="w-full h-full object-cover object-[center_top]" 
                                    />
                                    {/* Cinematic Gradients for text readability */}
                                    <div className="absolute inset-0 bg-black/20" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                                </motion.div>
                                
                                {/* Editorial Content Center Aligned */}
                                <div className="relative z-20 w-full max-w-4xl px-4 md:px-8 mt-12 flex flex-col items-center">
                                    <AnimatePresence mode="wait">
                                        {isActive && (
                                            <motion.div
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                className="flex flex-col items-center"
                                            >
                                                <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6 md:mb-8">
                                                    <span className="w-8 md:w-16 h-[1px] bg-white/60"></span>
                                                    <span className="font-outfit text-[10px] md:text-xs tracking-[0.4em] uppercase text-white font-medium">
                                                        {slide.subtitle || 'SHAGUN GALLERY'}
                                                    </span>
                                                    <span className="w-8 md:w-16 h-[1px] bg-white/60"></span>
                                                </motion.div>
                                                
                                                <motion.h1 
                                                    variants={itemVariants} 
                                                    className="font-playfair text-5xl md:text-7xl lg:text-8xl text-white font-medium leading-[1.1] tracking-wide mb-6 md:mb-8"
                                                    style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                                                >
                                                    {slide.title}
                                                </motion.h1>
                                                
                                                <motion.p 
                                                    variants={itemVariants}
                                                    className="font-outfit text-white/90 text-sm md:text-base max-w-lg font-light leading-relaxed mb-10 md:mb-12"
                                                >
                                                    {slide.description}
                                                </motion.p>

                                                <motion.div variants={itemVariants}>
                                                    <Link to={slide.button_link || '/products'}>
                                                        <Button 
                                                            variant="outline" 
                                                            className="group border-rose-500 text-white hover:bg-rose-700 hover:border-rose-700 rounded-none px-10 md:px-12 py-6 font-outfit uppercase tracking-[0.2em] text-xs transition-all duration-500 backdrop-blur-sm bg-rose-600/90 shadow-lg shadow-rose-900/30"
                                                        >
                                                            <span className="text-white transition-colors">{slide.button_text || 'Explore'}</span>
                                                        </Button>
                                                    </Link>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </SwiperSlide>
                ))}
                
                {/* Custom Minimal Pagination */}
                <div className="custom-hero-pagination hero-pagination absolute bottom-8 md:bottom-12 z-30 flex justify-center w-full gap-1" />
            </Swiper>

            {/* ── Bottom Curve ── */}
            <div
                className="absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-neutral-50 z-20 pointer-events-none"
                style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
            />
        </section>
    )
}
