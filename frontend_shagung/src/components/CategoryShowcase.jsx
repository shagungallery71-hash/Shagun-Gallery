import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, FreeMode } from 'swiper/modules'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { api } from '../api/client'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/free-mode'

export default function CategoryShowcase() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const swiperRef = useRef(null)
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" })

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.mainCategories()
        const data = Array.isArray(response) ? response : (response.data || [])
        const mapped = data.map((cat) => ({
          ...cat,
          image: cat.image_url || cat.image || 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062147/Gemini_Generated_Image_c06zguc06zguc06z_2_vo7pcz.jpg',
          count: parseInt(cat.product_count) || 0
        }))
        setCategories(mapped)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-14 flex justify-center bg-white min-h-[300px] items-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </section>
    )
  }

  return (
    <section className="bg-white py-10 md:py-24 overflow-hidden relative border-t border-black/5">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}</style>
      
      {/* Decorative subtle dot */}
      
      <div className="container mx-auto px-4 md:px-8 max-w-[1400px] relative z-10">
        
        {/* Editorial Header */}
        <div ref={headerRef} className="flex flex-col items-center justify-center text-center mb-6 md:mb-16">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-4 mb-4"
            >
                <span className="w-12 h-[1px] bg-rose-300"></span>
                <span className="font-outfit text-[10px] md:text-xs tracking-[0.4em] uppercase text-rose-600 font-semibold">
                    The Categories
                </span>
                <span className="w-12 h-[1px] bg-rose-300"></span>
            </motion.div>
            
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-2xl md:text-5xl lg:text-6xl font-playfair font-medium text-black mb-3 md:mb-6"
            >
                Explore Collections
            </motion.h2>
            
            <motion.p 
                initial={{ opacity: 0 }}
                animate={isHeaderInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-neutral-500 text-sm md:text-base font-outfit font-light max-w-md"
            >
                Tailored for modern elegance. Discover curations that define your personal narrative.
            </motion.p>
        </div>

        {/* Custom Navigation */}
        <div className="absolute right-4 md:right-8 top-16 md:top-32 hidden md:flex items-center gap-6 z-20">
            <Link to="/products" className="font-outfit text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-700 hover:text-rose-900 transition-colors pb-1 border-b border-transparent hover:border-rose-900">
                View All Categories
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                className="w-10 h-10 rounded-full border border-rose-200 flex items-center justify-center text-rose-700 hover:bg-rose-700 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Previous slider"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                className="w-10 h-10 rounded-full border border-rose-200 flex items-center justify-center text-rose-700 hover:bg-rose-700 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Next slider"
              >
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
        </div>

        {/* Categories Swiper */}
        <div className="relative">
            <Swiper
                modules={[Navigation, FreeMode]}
                spaceBetween={16}
                slidesPerView={1.2}
                freeMode={{ enabled: true, sticky: true }}
                breakpoints={{
                    480: { slidesPerView: 2, spaceBetween: 20 },
                    768: { slidesPerView: 3, spaceBetween: 32 },
                    1024: { slidesPerView: 4, spaceBetween: 40 },
                }}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                className="!overflow-visible"
            >
            {categories.map((category, index) => (
                <SwiperSlide key={category.id}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 1, 0.5, 1] }}
                >
                    <Link to={`/products?category=${category.slug || category.id}`} className="group block relative overflow-hidden bg-white hover:bg-neutral-50 pb-6 transition-colors">
                        
                        <div className="w-full aspect-[4/5] overflow-hidden bg-neutral-100 relative mb-5">
                            <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover object-top filter brightness-[0.95] group-hover:brightness-110 group-hover:scale-[1.03] transition-all duration-[1.5s] ease-[0.25,1,0.5,1]"
                            />
                            
                            {/* Artistic Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            
                            {/* Explore Action Button Overlay */}
                            <div className="absolute inset-x-0 bottom-6 flex justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out z-10 pointer-events-none">
                                <span className="bg-white/90 backdrop-blur-sm text-black px-6 py-2.5 rounded-none font-outfit text-[10px] uppercase tracking-[0.2em] font-semibold border border-transparent flex items-center gap-2">
                                    Explore <ArrowRight className="w-3 h-3" strokeWidth={2} />
                                </span>
                            </div>
                        </div>
                        
                        {/* Title and details below image */}
                        <div className="text-center px-4">
                            <h3 className="text-lg md:text-xl font-playfair font-medium tracking-wide text-black group-hover:text-rose-700 transition-colors uppercase">
                                {category.name}
                            </h3>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="w-6 h-[1px] bg-rose-300 scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500" />
                                <span className="text-[10px] font-outfit text-neutral-500 tracking-[0.2em] uppercase">
                                    {category.count} Pieces
                                </span>
                                <span className="w-6 h-[1px] bg-rose-300 scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500" />
                            </div>
                        </div>
                    </Link>
                </motion.div>
                </SwiperSlide>
            ))}
            </Swiper>
        </div>

        {/* Mobile View All */}
        <div className="md:hidden text-center mt-4 flex items-center justify-between px-4 border-t border-black/5 pt-4">
          <div className="flex gap-2">
              <button onClick={() => swiperRef.current?.slidePrev()} className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center">
                 <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button onClick={() => swiperRef.current?.slideNext()} className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center">
                 <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
          </div>
          <Link to="/products" className="font-outfit text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-700 border-b border-rose-700 pb-0.5">
            Discover All
          </Link>
        </div>
      </div>
    </section>
  )
}
