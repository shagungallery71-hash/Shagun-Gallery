import Footer from '../components/Footer'
import { StickyNavbar, BreadcrumbNavigator, MobileBottomBar, ChatSupportWidget, CookieConsentBanner } from '../components/UtilityUx'
import { BrandStorySection, MissionVisionSection, FounderMessage, BehindTheScenes, ProcessTimeline, SustainabilitySection, AwardsAndRecognition, PressMentions, MagazineFeatures } from '../components/BrandSections'

export default function Brand() {
  return (
    <div className="min-h-screen bg-white">
      <StickyNavbar />
      <BreadcrumbNavigator />
      <main>
        <BrandStorySection />
        <MissionVisionSection />
        <FounderMessage />
        <BehindTheScenes />
        <ProcessTimeline />
        <SustainabilitySection />
        <AwardsAndRecognition />
        <PressMentions />
        <MagazineFeatures />
      </main>
      <Footer />
      <MobileBottomBar />
      <ChatSupportWidget />
      <CookieConsentBanner />
    </div>
  )
}
