import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, MessageCircle, Globe2, IndianRupee, X } from 'lucide-react'
import Header from './Header'

// ----- Utility / UX Components -----

export function BreadcrumbNavigator() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  const crumbs = [
    { label: 'Home', path: '/' },
    ...segments.map((seg, idx) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1),
      path: '/' + segments.slice(0, idx + 1).join('/'),
    })),
  ]

  return (
    <nav className="px-4 lg:px-8 pt-3 pb-1 text-xs text-gray-500">
      <ol className="flex flex-wrap items-center gap-1 justify-start">
        {crumbs.map((crumb, idx) => (
          <li key={crumb.path} className="flex items-center gap-1">
            {idx > 0 && <span className="opacity-60">/</span>}
            {idx === crumbs.length - 1 ? (
              <span className="font-medium text-gray-700">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-pink-600">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function StickyNavbar() {
  return <Header />
}

export function MobileBottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-pink-100 bg-white/95 backdrop-blur md:hidden">
      <div className="flex justify-around py-2 text-[11px] text-gray-600">
        <Link to="/" className="flex flex-col items-center gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
          <span>Home</span>
        </Link>
        <Link to="/products" className="flex flex-col items-center gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          <span>Shop</span>
        </Link>
        <button className="flex flex-col items-center gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          <span>Search</span>
        </button>
        <Link to="/cart" className="flex flex-col items-center gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          <span>Cart</span>
        </Link>
      </div>
    </div>
  )
}

export function SearchOverlay() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-30 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs text-gray-600 shadow md:hidden"
      >
        <Search className="h-3 w-3" />
        Search
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-20">
          <div className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-xl mx-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                autoFocus
                type="search"
                placeholder="Search for products, occasions, fabrics..."
                className="flex-1 border-none text-sm focus:outline-none"
              />
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-gray-500">Try: sangeet, pastel, silk, co-ord</p>
          </div>
        </div>
      )}
    </>
  )
}

export function QuickViewModal() {
  // Placeholder - hook this up to product cards later
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Quick view</h3>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600">Connect this modal to your product cards for a quick preview.</p>
          </div>
        </div>
      )}
    </>
  )
}

export function FilterSidebar() {
  // Placeholder static sidebar; hook to product listing filters
  return null
}

export function MultiStepForm() {
  return (
    <section className="container mx-auto px-4 py-10">
      <h3 className="text-xl font-semibold mb-4">Need help? Tell us your query.</h3>
      <div className="rounded-3xl border border-pink-100 bg-white p-5">
        <p className="text-sm text-gray-700 mb-2">This can become a multi-step form for custom orders or styling help.</p>
        <p className="text-xs text-gray-500">(Placeholder — integrate form library or your API here.)</p>
      </div>
    </section>
  )
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-6 max-w-md md:ml-auto rounded-2xl border border-gray-200 bg-white/95 p-3 text-xs text-gray-600 shadow-lg">
      <p className="mb-2">
        We use cookies to personalize your experience and analyze site traffic.
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={() => setVisible(false)} className="rounded-full px-3 py-1 text-xs text-gray-600 hover:bg-gray-100">
          Manage
        </button>
        <button onClick={() => setVisible(false)} className="rounded-full bg-pink-600 px-4 py-1 text-xs font-semibold text-white hover:bg-pink-700">
          Accept
        </button>
      </div>
    </div>
  )
}

export function LanguageSwitcher() {
  return (
    <div className="hidden md:flex items-center gap-1 text-xs text-gray-600">
      <Globe2 className="h-3 w-3" />
      <select className="bg-transparent text-xs focus:outline-none">
        <option>EN</option>
        <option>HI</option>
      </select>
    </div>
  )
}

export function CurrencySwitcher() {
  return (
    <div className="hidden md:flex items-center gap-1 text-xs text-gray-600">
      <IndianRupee className="h-3 w-3" />
      <select className="bg-transparent text-xs focus:outline-none">
        <option>INR</option>
        <option>USD</option>
      </select>
    </div>
  )
}

export function ChatSupportWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg hover:bg-pink-700"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed bottom-20 right-4 z-40 w-72 rounded-3xl border border-pink-100 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Chat with us</p>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-gray-100">
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mb-2">Ask a styling or order-related question.</p>
          <input
            type="text"
            placeholder="Type your message..."
            className="w-full rounded-full border border-pink-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-300"
          />
        </div>
      )}
    </>
  )
}

export default {}
