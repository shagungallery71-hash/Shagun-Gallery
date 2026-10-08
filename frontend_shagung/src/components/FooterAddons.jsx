import { Facebook, Instagram, Twitter, Youtube, Mail, Phone } from 'lucide-react'

// ----- Footer Add-ons -----

export function MiniContactSection() {
  return (
    <div>
      <h4 className="font-semibold mb-3">Contact</h4>
      <div className="space-y-2 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <Mail className="h-4 w-4" /> support@shagung.com
        </p>
        <p className="flex items-center gap-2">
          <Phone className="h-4 w-4" /> +91-00000-00000
        </p>
      </div>
    </div>
  )
}

export function QuickLinks() {
  return (
    <div>
      <h4 className="font-semibold mb-3">Quick links</h4>
      <ul className="space-y-2 text-sm text-gray-600">
        <li><a href="#" className="hover:text-pink-600">Shop all</a></li>
        <li><a href="#" className="hover:text-pink-600">New arrivals</a></li>
        <li><a href="#" className="hover:text-pink-600">Wedding edit</a></li>
        <li><a href="#" className="hover:text-pink-600">Track order</a></li>
      </ul>
    </div>
  )
}

export function SocialIconsRow() {
  const icons = [Facebook, Instagram, Twitter, Youtube]
  return (
    <div className="flex gap-3">
      {icons.map((Icon, idx) => (
        <button
          key={idx}
          className="h-9 w-9 rounded-full bg-pink-100 hover:bg-pink-200 flex items-center justify-center transition-colors"
        >
          <Icon className="h-4 w-4 text-pink-600" />
        </button>
      ))}
    </div>
  )
}

export function PaymentMethodsStrip() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Visa */}
      <svg className="h-5 opacity-70" viewBox="0 0 750 471" xmlns="http://www.w3.org/2000/svg">
        <rect width="750" height="471" rx="40" fill="#1a1f71"/>
        <text x="375" y="310" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="210" fill="white" letterSpacing="-8">VISA</text>
      </svg>
      {/* Mastercard */}
      <svg className="h-5 opacity-70" viewBox="0 0 131.39 86.9" xmlns="http://www.w3.org/2000/svg">
        <circle cx="43.45" cy="43.45" r="43.45" fill="#EB001B"/>
        <circle cx="87.94" cy="43.45" r="43.45" fill="#F79E1B"/>
        <path d="M65.7 16.16a43.4 43.4 0 0 1 0 54.58 43.4 43.4 0 0 1 0-54.58z" fill="#FF5F00"/>
      </svg>
      {/* UPI */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-300 px-2 py-0.5 rounded-sm opacity-70">UPI</span>
    </div>
  )
}

export default {}
