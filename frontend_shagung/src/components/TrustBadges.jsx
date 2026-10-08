import { Truck, Shield, CreditCard, RefreshCw } from 'lucide-react'

const trustFeatures = [
  {
    icon: Truck,
    title: 'COMPLIMENTARY SHIPPING',
    description: 'Free express delivery on all orders above ₹999.',
    colors: { bg: 'bg-emerald-50', border: 'border-emerald-200', hoverBg: 'group-hover:bg-emerald-600', hoverText: 'group-hover:text-white', icon: 'text-emerald-600', title: 'text-emerald-900', desc: 'text-emerald-700/80' },
  },
  {
    icon: Shield,
    title: '100% AUTHENTICITY',
    description: 'Guaranteed genuine premium quality craftsmanship.',
    colors: { bg: 'bg-indigo-50', border: 'border-indigo-200', hoverBg: 'group-hover:bg-indigo-600', hoverText: 'group-hover:text-white', icon: 'text-indigo-600', title: 'text-indigo-900', desc: 'text-indigo-700/80' },
  },
  {
    icon: CreditCard,
    title: 'SECURE CHECKOUT',
    description: 'Encrypted global payment gateways.',
    colors: { bg: 'bg-amber-50', border: 'border-amber-200', hoverBg: 'group-hover:bg-amber-500', hoverText: 'group-hover:text-white', icon: 'text-amber-600', title: 'text-amber-900', desc: 'text-amber-700/80' },
  },
  {
    icon: RefreshCw,
    title: 'HASSLE-FREE RETURNS',
    description: '7-day easy return policy for peace of mind.',
    colors: { bg: 'bg-rose-50', border: 'border-rose-200', hoverBg: 'group-hover:bg-rose-600', hoverText: 'group-hover:text-white', icon: 'text-rose-600', title: 'text-rose-900', desc: 'text-rose-700/80' },
  },
]

export default function TrustBadges() {
  return (
    <section className="bg-neutral-50 border-y border-neutral-200 py-5 md:py-14">
      <div className="container mx-auto px-4">
        {/* Mobile: compact 2×2 horizontal rows | Desktop: 4-col centered */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-x-8 md:gap-y-12 max-w-7xl mx-auto">
          {trustFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              /* Mobile: horizontal icon+text row | Desktop: centered column */
              <div key={index} className="flex items-center gap-3 md:flex-col md:items-center md:text-center md:gap-0 group cursor-default">
                {/* Icon */}
                <div className={`
                  w-8 h-8 md:w-12 md:h-12 md:mb-5
                  shrink-0 flex items-center justify-center
                  ${feature.colors.bg} border ${feature.colors.border} rounded-full
                  ${feature.colors.icon} ${feature.colors.hoverBg} ${feature.colors.hoverText}
                  transition-colors duration-500
                `}>
                  <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" strokeWidth={1.5} />
                </div>
                {/* Text */}
                <div className="min-w-0 md:text-center">
                  <h3 className={`text-[9px] md:text-xs font-semibold tracking-[0.1em] md:tracking-[0.15em] md:mb-2 uppercase leading-tight ${feature.colors.title}`}>
                    {feature.title}
                  </h3>
                  <p className={`hidden md:block text-sm font-light leading-relaxed max-w-[250px] ${feature.colors.desc}`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
