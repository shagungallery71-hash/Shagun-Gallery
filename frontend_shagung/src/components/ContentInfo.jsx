// ----- Content / Info Components -----

export function FAQAccordion() {
  const faqs = [
    { q: 'What is the delivery time?', a: 'Orders usually ship in 3–7 business days depending on your location.' },
    { q: 'Do you offer returns?', a: 'Yes, we offer easy returns within 7 days of delivery.' },
  ]

  return (
    <section className="container mx-auto px-4 py-10">
      <h3 className="text-xl font-semibold mb-4">Frequently asked questions</h3>
      <div className="space-y-3">
        {faqs.map((item, idx) => (
          <details key={idx} className="group rounded-3xl border border-pink-100 bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-800">
              <span>{item.q}</span>
              <span className="text-xs text-pink-500 group-open:hidden">+ More</span>
              <span className="hidden text-xs text-pink-500 group-open:inline">− Less</span>
            </summary>
            <p className="mt-2 text-sm text-gray-700">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function ShippingInfoStrip({ variant = 'compact' }) {
  return (
    <section className="w-full bg-gray-900 text-gray-100 text-xs">
      <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-4 md:justify-between">
        <span>Free shipping above ₹3,000</span>
        {variant === 'detailed' && <span>Express delivery options available at checkout</span>}
        <span>COD & hassle-free returns</span>
      </div>
    </section>
  )
}

export function ReturnPolicySection({ variant = 'compact' }) {
  return (
    <section className={variant === 'compact' ? 'text-xs text-gray-500' : 'container mx-auto px-4 py-10'}>
      {variant === 'compact' ? (
        <p>Easy 7-day returns. Read full policy for details.</p>
      ) : (
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold mb-3">Return & exchange policy</h3>
          <p className="text-sm text-gray-700 mb-2">
            We accept returns within 7 days of delivery, provided the product is unused, unwashed and has all tags
            attached.
          </p>
          <p className="text-sm text-gray-700">
            For detailed terms, exclusions for customized outfits, and exchange procedures, please integrate your actual
            policy text here.
          </p>
        </div>
      )}
    </section>
  )
}

export function StoreLocatorMap() {
  return (
    <section className="container mx-auto px-4 py-10">
      <h3 className="text-xl font-semibold mb-3">Find a store near you</h3>
      <img
        src="https://images.unsplash.com/photo-1523473827532-086111b22038?w=1200&q=80&auto=format&fit=crop"
        alt="Store locator map placeholder"
        className="h-64 w-full rounded-3xl border border-pink-100 object-cover"
      />
    </section>
  )
}

export function NewsletterSignupCTA() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50 p-6 md:p-8 text-center">
        <h3 className="text-2xl font-semibold mb-2">Stay in the Shagung loop</h3>
        <p className="text-sm text-gray-700 mb-4">Sign up for launches, styling tips and exclusive access.</p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 rounded-full border border-pink-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <button className="rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-700">
            Join now
          </button>
        </div>
      </div>
    </section>
  )
}

export function BlogPreviewGrid() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">From the blog</h3>
        <button className="text-xs font-medium text-pink-600 hover:text-pink-700">View all</button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <article key={i} className="rounded-3xl border border-pink-100 bg-white p-4">
            <p className="text-xs text-gray-500 mb-1">Styling guide</p>
            <p className="text-sm font-semibold text-gray-800 mb-2">5 ways to re-wear your festive outfit</p>
            <p className="text-xs text-gray-600">Read quick tips on making the most of your wardrobe.</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ArticleHighlights() {
  return (
    <section className="container mx-auto px-4 pb-10">
      <h4 className="text-lg font-semibold mb-3">Editor’s picks</h4>
      <div className="flex flex-wrap gap-3">
        {['Wedding styling', 'Fabric care', 'Behind the brand'].map(item => (
          <span
            key={item}
            className="rounded-full bg-pink-50 px-3 py-1 text-[11px] font-semibold text-pink-700 border border-pink-100"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}

export default {}
