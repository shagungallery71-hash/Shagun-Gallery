import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, HelpCircle, ShoppingBag, RotateCcw, Ruler, CreditCard } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const faqs = [
  {
    category: 'Orders & Shipping',
    icon: ShoppingBag,
    color: 'amber',
    items: [
      { q: 'How long does delivery take?', a: 'Standard delivery takes 3–7 business days across India. Express delivery (1–2 days) is available for select pin codes. You will receive a tracking link via email once your order is shipped.' },
      { q: 'Do you offer free shipping?', a: 'Yes! We offer free standard shipping on all orders above ₹999. Orders below ₹999 attract a flat shipping fee of ₹49.' },
      { q: 'Can I change my delivery address after placing an order?', a: 'You can change your delivery address within 2 hours of placing the order by contacting us at shagungallery71@gmail.com or calling +91 85870 98161.' },
      { q: 'Do you ship internationally?', a: 'Currently, we ship only within India. International shipping is coming soon — stay tuned!' },
    ]
  },
  {
    category: 'Returns & Exchanges',
    icon: RotateCcw,
    color: 'emerald',
    items: [
      { q: 'What is your return policy?', a: 'We offer a hassle-free 30-day return window on most products. Items must be unworn, unwashed, and in original packaging with all tags intact.' },
      { q: 'How do I initiate a return?', a: 'Visit your account orders page, select the item, and click "Request Return." Our team will arrange pickup within 2–3 business days.' },
      { q: 'When will I receive my refund?', a: 'Refunds are processed within 5–7 business days after we receive and inspect the returned item. The amount is credited back to your original payment method.' },
      { q: 'Can I exchange for a different size or color?', a: 'Absolutely! Exchanges are free for size or color changes, subject to availability. Click "Exchange" on your order page to get started.' },
    ]
  },
  {
    category: 'Products & Sizing',
    icon: Ruler,
    color: 'violet',
    items: [
      { q: 'How do I find my correct size?', a: 'Visit our Size Guide page for detailed measurement charts. We recommend measuring your bust, waist, and hip and comparing with our size chart for the best fit.' },
      { q: 'Are the colors accurate in photos?', a: 'We make every effort to capture the true colors. However, slight variations may occur due to monitor settings. If you\'re unsure, feel free to contact us for fabric swatches.' },
      { q: 'Are your fabrics authentic?', a: 'Yes, all our fabrics are sourced directly from trusted weavers and artisans across India. We use genuine silk, cotton, georgette, and other premium textiles.' },
      { q: 'Do you do custom stitching?', a: 'We currently sell ready-to-wear and semi-stitched outfits. Custom stitching services are available for select products — contact us for details.' },
    ]
  },
  {
    category: 'Payments',
    icon: CreditCard,
    color: 'blue',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, UPI (Google Pay, PhonePe, Paytm), net banking, and Cash on Delivery for eligible pin codes.' },
      { q: 'Is it safe to pay online?', a: 'Yes, our payment gateway is secured with 256-bit SSL encryption. We do not store any card details on our servers.' },
      { q: 'Can I use a coupon code?', a: 'Yes! Enter your coupon code at checkout. Subscribe to our newsletter to receive exclusive discount codes.' },
      { q: 'What if my payment fails?', a: 'If your payment fails, the amount will be refunded automatically within 3–5 business days. You can retry the payment or choose a different payment method.' },
    ]
  }
]

const colorMap = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
}

function FAQItem({ q, a, dotColor }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-neutral-100 last:border-none">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group">
        <div className="flex items-start gap-3">
          <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${dotColor}`} />
          <span className="text-sm font-semibold text-neutral-800 group-hover:text-neutral-900 leading-snug">{q}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 mt-0.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
            <div className="pb-5 pl-5 pr-4">
              <p className="text-sm text-neutral-600 leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQs() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-amber-900 via-amber-700 to-yellow-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">FAQs</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-wide">FAQs</h1>
            </div>
            <p className="text-amber-200 text-lg max-w-lg leading-relaxed">
              Find quick answers to the most commonly asked questions about shopping with Shagun Gallery.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <main className="flex-1 pt-4 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-6">
            {faqs.map((section, i) => {
              const c = colorMap[section.color]
              const Icon = section.icon
              return (
                <motion.div key={section.category}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`${c.bg} ${c.border} border rounded-2xl overflow-hidden`}>
                  <div className="px-6 py-5 flex items-center gap-3 border-b border-neutral-100">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="font-serif text-lg font-bold text-neutral-900">{section.category}</h2>
                  </div>
                  <div className="px-6 bg-white">
                    {section.items.map(item => (
                      <FAQItem key={item.q} q={item.q} a={item.a} dotColor={c.dot} />
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Still have questions */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mt-12 bg-gradient-to-r from-amber-700 to-amber-900 rounded-3xl p-8 text-center text-white">
            <h3 className="font-serif text-2xl font-bold mb-2">Still have questions?</h3>
            <p className="text-amber-200 text-sm mb-6">Our support team is happy to assist you personally.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-amber-900 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-amber-50 transition-colors">
              Contact Support <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
