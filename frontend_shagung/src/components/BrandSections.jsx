// ----- Brand / Visual Story Components -----

const DUMMY_IMAGE = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&auto=format&fit=crop'

export function BrandStorySection({ variant = 'full' }) {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2 items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-pink-500 mb-3">Our Story</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Born from a love for timeless silhouettes and modern Indian elegance.
          </h2>
          <p className="text-sm md:text-base text-gray-700 mb-4">
            Shagung crafts pieces that feel like an extension of you — effortless, flattering, and made for real
            celebrations. Each garment is designed in small batches with attention to fabric, fall and finish.
          </p>
          {variant === 'full' && (
            <p className="text-sm text-gray-600">
              From intimate mehendi ceremonies to destination weddings, our collections are inspired by the women who wear
              them: confident, playful, and unapologetically themselves.
            </p>
          )}
        </div>
        <div className="relative h-64 md:h-80">
          <img
            src={DUMMY_IMAGE}
            alt="Brand story"
            className="absolute inset-0 h-full w-full rounded-3xl object-cover"
          />
        </div>
      </div>
    </section>
  )}

export function MissionVisionSection() {
  const items = [
    {
      title: 'Mission',
      text: 'To make premium Indian wear accessible, versatile, and wearable beyond just one occasion.',
    },
    {
      title: 'Vision',
      text: 'A wardrobe where every piece sparks joy, feels comfortable, and tells a story of thoughtful design.',
    },
  ]

  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(item => (
          <div
            key={item.title}
            className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-700">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )}

export function FounderMessage() {
  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50/80 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="h-24 w-24 rounded-full bg-pink-200" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-500 mb-2">From the founder</p>
          <p className="text-sm md:text-base text-gray-800 mb-3">
            "I wanted to create pieces that you reach for again and again — outfits that photograph beautifully but feel
            even better in person. Shagung is my love letter to slow fashion and joyful dressing."
          </p>
          <p className="text-sm font-semibold text-gray-900">— Founder, Shagung</p>
        </div>
      </div>
    </section>
  )}

export function BehindTheScenes() {
  return (
    <section className="container mx-auto px-4 pb-12">
      <h3 className="text-xl font-semibold mb-4">Behind the scenes</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <img
            key={i}
            src={DUMMY_IMAGE}
            alt="Behind the scenes"
            className="rounded-3xl h-40 w-full object-cover"
          />
        ))}
      </div>
    </section>
  )}

export function ProcessTimeline() {
  const steps = ['Sketch', 'Fabric sourcing', 'Sampling', 'Fitting', 'Final detailing']

  return (
    <section className="container mx-auto px-4 pb-12">
      <h3 className="text-xl font-semibold mb-4">How each piece comes to life</h3>
      <ol className="relative border-l border-pink-100 pl-4 space-y-4">
        {steps.map((step, idx) => (
          <li key={step} className="ml-2">
            <div className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-pink-500" />
            <p className="text-sm font-medium text-gray-900">Step {idx + 1}</p>
            <p className="text-sm text-gray-700">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  )}

export function SustainabilitySection({ variant = 'full' }) {
  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 mb-2">Sustainability</p>
        <h3 className="text-xl md:text-2xl font-semibold mb-3">Conscious in design, considerate in production.</h3>
        <p className="text-sm text-emerald-800 mb-3">
          We produce in small batches, prioritize responsible sourcing, and partner with artisanal units to reduce waste
          and ensure fair working conditions.
        </p>
        {variant === 'full' && (
          <ul className="list-disc list-inside text-sm text-emerald-800/90 space-y-1">
            <li>Limited runs to avoid overproduction</li>
            <li>Fabric offcut reuse for accessories and trims</li>
            <li>Plastic-free, reusable packaging wherever possible</li>
          </ul>
        )}
      </div>
    </section>
  )}

export function AwardsAndRecognition() {
  const awards = ['Top Emerging Label 2024', 'Best Wedding Edit 2023', 'Design Excellence Award']

  return (
    <section className="container mx-auto px-4 pb-10">
      <h3 className="text-xl font-semibold mb-4">Awards & Recognition</h3>
      <div className="flex flex-wrap gap-3">
        {awards.map(a => (
          <span
            key={a}
            className="rounded-full border border-pink-100 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm"
          >
            {a}
          </span>
        ))}
      </div>
    </section>
  )}

export function PressMentions() {
  const press = ['Vogue India', 'Brides Today', 'Elle', 'Local fashion blogs']

  return (
    <section className="container mx-auto px-4 pb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-[0.25em]">As seen in</h3>
      <div className="flex flex-wrap gap-4 items-center">
        {press.map(p => (
          <span key={p} className="text-xs md:text-sm font-medium text-gray-700 bg-pink-50 px-3 py-1 rounded-full">
            {p}
          </span>
        ))}
      </div>
    </section>
  )}

export function MagazineFeatures() {
  return (
    <section className="container mx-auto px-4 pb-12">
      <h3 className="text-xl font-semibold mb-4">Magazine features</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <article key={i} className="rounded-3xl border border-pink-100 bg-white p-4">
            <p className="text-xs text-gray-500 mb-1">Feature {i}</p>
            <p className="text-sm font-semibold text-gray-800">"Shagung redefines contemporary occasionwear"</p>
          </article>
        ))}
      </div>
    </section>
  )}

export default {}
