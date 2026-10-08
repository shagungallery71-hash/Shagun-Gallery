import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Sparkles } from 'lucide-react'

const announcements = [
  {
    id: 1,
    text: 'Free Shipping on orders above ₹999',
    highlight: '₹999',
    link: '/products',
  },
  {
    id: 2,
    text: 'New Festive Collection 2025 is Live!',
    highlight: 'Festive Collection',
    link: '/products?filter=new',
    badge: 'NEW',
  },
  {
    id: 3,
    text: 'Use code SHAGUNG10 for extra 10% off',
    highlight: 'SHAGUNG10',
    link: '/products',
  },
]

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  if (!isVisible) return null

  const current = announcements[currentIndex]

  // Format text with highlight
  const formatText = (text, highlight) => {
    if (!highlight) return text
    const parts = text.split(highlight)
    return (
      <>
        {parts[0]}
        <span className="font-bold text-white">{highlight}</span>
        {parts[1]}
      </>
    )
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="relative bg-gradient-to-r from-primary via-pink-500 to-rose-500 text-white overflow-hidden"
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-2.5 relative">
          {/* Announcement Text */}
          <AnimatePresence mode="wait">
            <motion.a
              key={current.id}
              href={current.link}
              className="flex items-center gap-2 text-sm group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Sparkles className="h-4 w-4 hidden sm:block" />

              {current.badge && (
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {current.badge}
                </span>
              )}

              <span className="text-white/90">
                {formatText(current.text, current.highlight)}
              </span>

              <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </motion.a>
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="hidden sm:flex items-center gap-1.5 absolute right-12">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`
                  h-1.5 rounded-full transition-all duration-300
                  ${currentIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}
                `}
              />
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
