import { Play, Star } from 'lucide-react'

// ----- Social & Engagement Components -----

const DUMMY_IMAGE = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&auto=format&fit=crop'

export function TikTokFeed() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="relative min-w-[160px] h-72 rounded-3xl overflow-hidden flex items-center justify-center"
          >
            <img
              src={DUMMY_IMAGE}
              alt="TikTok video placeholder"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <button className="relative h-10 w-10 rounded-full bg-white/90 flex items-center justify-center text-pink-600 shadow-lg">
              <Play className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ReelsCarousel() {
  return (
    <section className="container mx-auto px-4 pb-10">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="relative min-w-[180px] h-72 rounded-3xl overflow-hidden flex items-center justify-center"
          >
            <img
              src={DUMMY_IMAGE}
              alt="Reel placeholder"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <button className="relative h-10 w-10 rounded-full bg-white/90 flex items-center justify-center text-pink-600 shadow-lg">
              <Play className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export function UserGeneratedGallery({ context = 'homepage' }) {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          {context === 'product' ? 'How others styled this' : 'From our community'}
        </h3>
        <button className="text-xs font-medium text-pink-600 hover:text-pink-700">Share your look</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <img
            key={i}
            src={DUMMY_IMAGE}
            alt="Customer look"
            className="h-36 w-full rounded-3xl object-cover"
          />
        ))}
      </div>
    </section>
  )
}

export function CommunitySpotlight() {
  return (
    <section className="container mx-auto px-4 pb-10">
      <h3 className="text-xl font-semibold mb-4">Community spotlight</h3>
      <div className="rounded-3xl border border-pink-100 bg-white p-5 flex flex-col md:flex-row gap-4 items-center">
        <img
          src={DUMMY_IMAGE}
          alt="Community spotlight"
          className="h-20 w-20 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-1">Real bride feature</p>
          <p className="text-sm text-gray-700">
            "Shagung made my sangeet outfit feel like a dream. I danced all night and still felt comfortable."
          </p>
        </div>
      </div>
    </section>
  )
}

export function CustomerShowcase() {
  return (
    <section className="container mx-auto px-4 pb-10">
      <h3 className="text-xl font-semibold mb-4">Customer showcase</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="min-w-[220px] rounded-3xl border border-pink-100 bg-white p-4">
            <img
              src={DUMMY_IMAGE}
              alt="Customer showcase"
              className="mb-3 h-32 w-full rounded-2xl object-cover"
            />
            <p className="text-sm font-semibold text-gray-800 mb-1">Styling story {i}</p>
            <p className="text-xs text-gray-600">Tap to read how they styled Shagung for their event.</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function LiveReviewsCarousel() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Live reviews</h3>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-500" /> 4.9 overall rating
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="min-w-[260px] rounded-3xl border border-pink-100 bg-white p-4">
            <p className="text-xs text-gray-500 mb-1">Verified purchase</p>
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`h-3 w-3 ${idx < 5 ? 'text-yellow-500' : 'text-gray-300'}`}
                  fill="currentColor"
                />
              ))}
            </div>
            <p className="text-sm text-gray-800">
              "Gorgeous fit and the fabric feels luxe. Wore it for 6 hours straight and it stayed comfortable!"
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ReviewHighlights() {
  const highlights = ['Fit & comfort', 'Fabric quality', 'On-time delivery']

  return (
    <section className="container mx-auto px-4 pb-10">
      <h4 className="text-lg font-semibold mb-3">Review highlights</h4>
      <div className="flex flex-wrap gap-2">
        {highlights.map(h => (
          <span
            key={h}
            className="rounded-full bg-pink-50 px-3 py-1 text-[11px] font-semibold text-pink-700 border border-pink-100"
          >
            {h}
          </span>
        ))}
      </div>
    </section>
  )
}

export default {}
