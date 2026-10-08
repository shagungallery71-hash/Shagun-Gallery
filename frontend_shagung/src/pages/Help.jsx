import Footer from '../components/Footer'
import { StickyNavbar, BreadcrumbNavigator, MobileBottomBar, ChatSupportWidget, CookieConsentBanner, MultiStepForm } from '../components/UtilityUx'
import { FAQAccordion, ShippingInfoStrip, ReturnPolicySection, StoreLocatorMap, NewsletterSignupCTA, BlogPreviewGrid, ArticleHighlights } from '../components/ContentInfo'

export default function Help() {
  return (
    <div className="min-h-screen bg-white">
      <StickyNavbar />
      <ShippingInfoStrip variant="detailed" />
      <BreadcrumbNavigator />
      <main>
        <FAQAccordion />
        <ReturnPolicySection variant="full" />
        <StoreLocatorMap />
        <MultiStepForm />
        <NewsletterSignupCTA />
        <BlogPreviewGrid />
        <ArticleHighlights />
      </main>
      <Footer />
      <MobileBottomBar />
      <ChatSupportWidget />
      <CookieConsentBanner />
    </div>
  )
}
