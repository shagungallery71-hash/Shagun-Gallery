import { lazy, Suspense, useEffect } from 'react'
import { Skeleton } from '../components/ui/Skeleton'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts, selectProductStatus } from '../store/slices/productSlice'
import { HomePageSEO } from '../components/SEO'

// Eagerly load critical above-the-fold components
import HeroSection from '../components/HeroSection'
import TrustBadges from '../components/TrustBadges'
import FeaturedProducts from '../components/FeaturedProducts'
import CategoryShowcase from '../components/CategoryShowcase'

// Lazy load below-the-fold components for better performance
const Testimonials = lazy(() => import('../components/Testimonials'))
const FeaturedVideo = lazy(() => import('../components/FeaturedVideo'))
const HomeSaleSection = lazy(() => import('../components/HomeSaleSection'))
const Newsletter = lazy(() => import('../components/Newsletter'))
const Footer = lazy(() => import('../components/Footer'))
const ScrollToTop = lazy(() => import('../components/ScrollToTop'))

// Loading fallback for lazy components
const SectionLoader = () => (
  <div className="py-16 container mx-auto px-4">
    <div className="space-y-4 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-1/3 mx-auto" />
      <Skeleton className="h-4 w-2/3 mx-auto" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
)

export default function Home() {
  const dispatch = useDispatch()
  const productStatus = useSelector(selectProductStatus)

  // Prefetch products for caching
  useEffect(() => {
    if (productStatus === 'idle') {
      // Prefetch initial batch matching Products page defaults
      dispatch(fetchProducts({ limit: 12, sort: 'newest' }))
    }
  }, [dispatch, productStatus])

  return (
    <>
      <HomePageSEO />
      {/* Negative margin to offset body padding-top on home page */}
      <div className="min-h-screen bg-background -mt-[10px] md:-mt-[20px]">
        {/* Hero Section - Above the fold, critical */}
        <HeroSection />

        {/* Trust Badges - Build confidence immediately */}
        <TrustBadges />

        {/* Featured Products - Main product showcase */}
        <FeaturedProducts />

        {/* Category Showcase - Easy navigation */}
        <CategoryShowcase />

        {/* Sale Section - Show active sale on homepage */}
        <Suspense fallback={<SectionLoader />}>
          <HomeSaleSection />
        </Suspense>

        {/* Testimonials - Social proof */}
        <Suspense fallback={<SectionLoader />}>
          <Testimonials />
        </Suspense>

        {/* Video Showcase */}
        <Suspense fallback={<SectionLoader />}>
          <FeaturedVideo />
        </Suspense>

        {/* Newsletter - Email capture */}
        <Suspense fallback={<SectionLoader />}>
          <Newsletter />
        </Suspense>

        {/* Footer */}
        <Suspense fallback={<div className="h-96 bg-foreground" />}>
          <Footer />
        </Suspense>

        {/* Scroll to top button */}
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
      </div>
    </>
  )
}

