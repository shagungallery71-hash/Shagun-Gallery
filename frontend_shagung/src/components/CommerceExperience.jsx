import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Star, Package, Bell, ShoppingBag } from 'lucide-react'

// Normalize HTML coming from API: strip doctype/html/body wrappers, remove scripts/links,
// keep inline <style> blocks, and return safe inner markup.
function normalizeRuntimeHtml(input) {
  try {
    if (!input) return ''
    let s = String(input).trim()

    // strip accidental wrapping quotes
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1)
    }

    // Best-effort fix of double-double-quotes in attributes (e.g., lang=""en"")
    s = s.replace(/\s(\w+)=\\?""/g, ' $1="') // open
      .replace(/""/g, '"')

    // Remove DOCTYPE if present
    s = s.replace(/<!DOCTYPE[\s\S]*?>/gi, '')

    const parser = new DOMParser()
    const doc = parser.parseFromString(s, 'text/html')

    // Remove <script> and <link> tags for safety and to avoid runtime execution
    doc.querySelectorAll('script, link').forEach((el) => el.remove())

    // Collect inline styles (custom classes used inside content)
    const inlineStyles = Array.from(doc.head?.querySelectorAll('style') || [])
      .map((el) => el.outerHTML)
      .join('')

    const bodyHtml = doc.body ? doc.body.innerHTML : s

    return inlineStyles + bodyHtml
  } catch (e) {
    return String(input || '')
  }
}

// ----- Commerce / Product Experience Components -----

const DUMMY_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&auto=format&fit=crop'

export function LimitedTimeDeals() {
  const deals = [
    { id: 1, label: 'Flash Sale', text: 'Extra 20% off bestsellers', endsIn: '02:15:23' },
    { id: 2, label: 'New In', text: 'Free shipping on new collection', endsIn: 'Today' },
  ]

  return (
    <section className="border-b border-pink-100 bg-gradient-to-r from-pink-50/60 via-rose-50 to-pink-50 text-sm">
      <div className="container mx-auto px-4 py-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {deals.map(deal => (
          <div
            key={deal.id}
            className="flex items-center gap-2 text-pink-700 animate-[pulse_3s_ease-in-out_infinite]"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
              <Clock className="h-3 w-3" />
              {deal.label}
            </span>
            <span className="font-medium">{deal.text}</span>
            <span className="text-xs text-pink-500">Ends in {deal.endsIn}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function SeasonalCollectionBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-white">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#fff,_transparent_55%)]" />
      <div className="relative container mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-3">New Season · Limited Edition</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Shagung Signature
            <span className="block text-pink-100">Festive Collection 2025</span>
          </h2>
          <p className="text-sm md:text-base text-pink-50/90 mb-6 max-w-md">
            Curated silhouettes, handpicked fabrics, and intricate detailing designed to make every moment unforgettable.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-pink-600 shadow-md shadow-pink-900/10 hover:bg-pink-50 transition"
            >
              Shop the drop
            </Link>
            <button className="inline-flex items-center justify-center rounded-full border border-pink-200/60 bg-pink-500/20 px-5 py-2 text-sm font-medium text-white hover:bg-pink-500/30">
              View lookbook
            </button>
          </div>
        </div>
        <div className="relative h-64 md:h-80">
          <img
            src={DUMMY_IMAGE}
            alt="Seasonal collection visual"
            className="h-full w-full rounded-3xl object-cover shadow-xl"
          />
        </div>
      </div>
    </section>
  )
}

export function InteractiveLookbook() {
  const looks = [
    { id: 1, label: 'Brunch Glam', pieces: 3 },
    { id: 2, label: 'Sangeet Night', pieces: 4 },
    { id: 3, label: 'Reception Elegance', pieces: 3 },
  ]

  return (
    <section className="container mx-auto px-4 py-10 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl md:text-2xl font-semibold">Interactive Lookbook</h3>
        <button className="text-xs font-medium text-pink-600 hover:text-pink-700">View all looks</button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {looks.map(look => (
          <button
            key={look.id}
            className="group relative overflow-hidden rounded-3xl border border-pink-100 bg-white p-4 text-left shadow-sm hover:shadow-xl transition-all"
          >
            <img
              src={DUMMY_IMAGE}
              alt={look.label}
              className="mb-16 h-40 w-full rounded-2xl object-cover group-hover:opacity-90 transition"
            />
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-pink-500/80">Look {look.id}</p>
                <p className="text-base md:text-lg font-semibold text-pink-950">{look.label}</p>
                <p className="text-xs text-pink-500/80">{look.pieces} pieces · Tap to explore</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-pink-600 shadow-md">
                <ShoppingBag className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export function ProductTabs({ detailDescription, fabric, shipping }) {
  const tabs = ['Description', 'Fabric', 'Shipping']
  const [activeTab, setActiveTab] = useState('Description')

  const renderContent = () => {
    switch (activeTab) {
      case 'Description':
        return (
          detailDescription ||
          'Detailed description of the product, fabric composition, and delivery timelines will appear here.'
        )
      case 'Fabric':
        return fabric || 'Fabric composition and feel information will appear here.'
      case 'Shipping':
        return shipping || 'Shipping timelines and delivery details will appear here.'
      default:
        return ''
    }
  }

  const html = normalizeRuntimeHtml(renderContent() || '')

  return (
    <section className="mt-8">
      <div className="flex gap-2 border-b border-pink-100">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-t-lg border border-b-0 px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab
              ? 'border-pink-300 bg-pink-50 text-pink-700'
              : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-200'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="border border-pink-100 rounded-b-xl rounded-tr-xl p-4 text-sm text-gray-700 bg-pink-50/40">
        <div
          className="prose prose-sm max-w-none prose-p:mb-2 prose-headings:mt-3 prose-headings:mb-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  )
}

export function ProductFAQs({ faq }) {
  let faqs

  if (Array.isArray(faq) && faq.length > 0) {
    faqs = faq.map((item) => ({
      q: item.question,
      a: item.answer,
      id: item.id,
    }))
  } else if (typeof faq === 'string' && faq.trim().length > 0) {
    // Fallback if backend still sends a single string sometimes
    faqs = [{ q: 'FAQ', a: faq }]
  } else {
    faqs = [
      {
        q: 'Is customization available?',
        a: 'Yes, limited customization is available on select pieces.',
      },
      {
        q: 'How do I care for this fabric?',
        a: 'Most garments are dry-clean only. Refer to care instructions.',
      },
    ]
  }

  return (
    <section className="mt-10 border border-pink-100 rounded-3xl p-5 bg-white">
      <h4 className="text-lg font-semibold mb-4">Product FAQs</h4>
      <div className="space-y-3">
        {faqs.map((item, idx) => (
          <details key={item.id ?? idx} className="group rounded-2xl border border-pink-50 bg-pink-50/40 p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-800">
              <span>{item.q}</span>
              <span className="text-xs text-pink-500 group-open:hidden">+ More</span>
              <span className="hidden text-xs text-pink-500 group-open:inline">− Less</span>
            </summary>
            <p className="mt-2 text-sm text-gray-600">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function ProductSizeGuide() {
  const sizes = ['XS', 'S', 'M', 'L', 'XL']

  return (
    <section className="mt-10 rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold">Size Guide</h4>
          <p className="text-xs text-gray-600">Find your perfect fit based on body measurements.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-pink-600">True to size</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {sizes.map(size => (
          <button
            key={size}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-pink-200 bg-white text-xs font-semibold text-gray-800 hover:border-pink-400 hover:text-pink-600"
          >
            {size}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-600">
        For detailed measurements per size, connect this section to your size chart data.
      </p>
    </section>
  )
}

export function FabricInfoSection({ fabric }) {
  const fabricHtmlRaw = fabric || 'Premium blend of breathable, skin-friendly fabrics designed for long-wear comfort.'
  const fabricHtml = normalizeRuntimeHtml(fabricHtmlRaw)

  return (
    <section className="mt-10 rounded-3xl border border-pink-100 bg-white p-5">
      <h4 className="text-lg font-semibold mb-3">Fabric & Craftsmanship</h4>
      <div
        className="text-sm text-gray-700 mb-2 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: fabricHtml }}
      />
      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
        <li>Wrinkle-resistant and travel friendly</li>
        <li>Inner lining for added structure and comfort</li>
        <li>Hand-finished detailing on trims and hems</li>
      </ul>
    </section>
  )
}

export function CareInstructions() {
  const items = ['Dry clean recommended', 'Steam iron on low heat', 'Store in breathable garment bag']

  return (
    <section className="mt-6 rounded-3xl border border-amber-100 bg-amber-50/60 p-5">
      <h4 className="text-lg font-semibold mb-3">Care Instructions</h4>
      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ol>
    </section>
  )
}


export function RecentlyViewedProducts() {
  const products = [
    { id: 1, name: 'Soft Pastel Co-ord', price: '$79' },
    { id: 2, name: 'Mirror Work Lehenga', price: '$149' },
  ]

  return (
    <section className="mt-12">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map(p => (
          <div
            key={p.id}
            className="min-w-[200px] rounded-2xl border border-pink-100 bg-white p-3 shadow-sm hover:shadow-lg transition"
          >
            <img
              src={DUMMY_IMAGE}
              alt={p.name}
              className="mb-3 h-32 w-full rounded-xl object-cover"
            />
            <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.name}</p>
            <p className="text-sm font-bold text-pink-600">{p.price}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RecommendedForYou({ products = [] }) {
  if (!products || products.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Recommended for you</h3>
        <button className="text-xs font-medium text-pink-600 hover:text-pink-700">Refresh</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {products.map(p => (
          <div
            key={p.id}
            className="group rounded-3xl border border-pink-100 bg-white p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Link to={`/products/${p.id}`}>
              <img
                src={p.image || DUMMY_IMAGE}
                alt={p.name}
                className="mb-3 h-40 w-full rounded-2xl object-cover group-hover:scale-[1.02] transition-transform"
              />
            </Link>
            <Link to={`/products/${p.id}`}>
              <p className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1">{p.name}</p>
            </Link>
            <p className="text-xs text-pink-500 mb-2">{p.category_name}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">${p.price}</span>
              <Link to={`/products/${p.id}`} className="text-xs font-semibold text-pink-600 hover:text-pink-700">View</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}



export function PriceDropAlertBox() {
  return (
    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
          <Bell className="h-4 w-4" />
          Get a price drop alert
        </p>
        <p className="text-[11px] text-emerald-700/80">We will notify you if this product goes on sale.</p>
      </div>
      <button className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700">
        Notify me
      </button>
    </div>
  )
}

export default {}
