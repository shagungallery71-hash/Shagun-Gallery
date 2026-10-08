import Footer from '../components/Footer'
import { StickyNavbar, BreadcrumbNavigator, MobileBottomBar, ChatSupportWidget, CookieConsentBanner } from '../components/UtilityUx'
import { TikTokFeed, ReelsCarousel, UserGeneratedGallery, CommunitySpotlight, CustomerShowcase, LiveReviewsCarousel, ReviewHighlights } from '../components/SocialEngagement'

export default function Community() {
  return (
    <div className="min-h-screen bg-white">
      <StickyNavbar />
      <BreadcrumbNavigator />
      <main>
        <UserGeneratedGallery />
        <LiveReviewsCarousel />
        <ReviewHighlights />
        <CustomerShowcase />
        <CommunitySpotlight />
        <TikTokFeed />
        <ReelsCarousel />
      </main>
      <Footer />
      <MobileBottomBar />
      <ChatSupportWidget />
      <CookieConsentBanner />
    </div>
  )
}
