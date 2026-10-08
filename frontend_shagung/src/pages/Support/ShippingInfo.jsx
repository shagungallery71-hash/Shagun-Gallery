import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Truck, Zap, Globe, Package, Clock, MapPin, ChevronRight, CheckCircle } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const fadeUp = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } }

export default function ShippingInfo() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-indigo-700 to-blue-500 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Shipping Info</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 tracking-wide">Shipping Information</h1>
            <p className="text-indigo-200 text-lg max-w-lg leading-relaxed">
              Fast, reliable delivery across India. Here's everything you need to know about how we get your order to you.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <main className="flex-1 pt-4 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* ── SHIPPING TIERS ── */}
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16"
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}>
            {[
              {
                icon: Package, label: 'Free Shipping', price: '₹0', condition: 'Orders above ₹999',
                time: '4–7 Business Days', features: ['Pan-India coverage', 'SMS + email tracking', 'Safe packaging'],
                color: 'bg-emerald-500', bg: 'from-emerald-50 to-white', border: 'border-emerald-200'
              },
              {
                icon: Truck, label: 'Standard', price: '₹49', condition: 'Orders below ₹999',
                time: '3–5 Business Days', features: ['Pan-India coverage', 'Email tracking', 'Scheduled delivery'],
                color: 'bg-indigo-500', bg: 'from-indigo-50 to-white', border: 'border-indigo-200', featured: true
              },
              {
                icon: Zap, label: 'Express', price: '₹149', condition: 'Select pin codes',
                time: '1–2 Business Days', features: ['Major cities', 'Real-time GPS tracking', 'Priority packaging'],
                color: 'bg-amber-500', bg: 'from-amber-50 to-white', border: 'border-amber-200'
              },
            ].map(({ icon: Icon, label, price, condition, time, features, color, bg, border, featured }) => (
              <motion.div key={label} variants={fadeUp}
                className={`bg-gradient-to-b ${bg} ${border} border rounded-3xl p-7 relative overflow-hidden ${featured ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-100' : ''}`}>
                {featured && <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">Popular</div>}
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-neutral-900 mb-1">{label}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black text-neutral-900">{price}</span>
                </div>
                <p className="text-xs text-neutral-500 mb-2">{condition}</p>
                <div className="flex items-center gap-2 mb-5 bg-white/70 rounded-xl px-3 py-2">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-700">{time}</span>
                </div>
                <ul className="space-y-2">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-neutral-600">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          {/* ── INFO CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-indigo-50 border border-indigo-100 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="font-serif text-lg font-bold text-indigo-900">Coverage</h3>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                We ship to <strong>29,000+ pin codes</strong> across all states and union territories in India.
                Remote areas may experience slightly longer delivery times.
              </p>
              <ul className="space-y-2 text-sm text-neutral-700">
                {['Tier 1 Cities: 1–3 days', 'Tier 2 Cities: 2–5 days', 'Remote Areas: 5–10 days'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="bg-blue-50 border border-blue-100 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-serif text-lg font-bold text-blue-900">Tracking Your Order</h3>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                Once your order is shipped, you'll receive a tracking number via SMS and email.
                You can also track your order anytime from your account dashboard.
              </p>
              <Link to="/orders" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-700 hover:text-blue-900 transition-colors">
                View My Orders <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>

          {/* Important notes */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-neutral-900 rounded-3xl p-8 text-white">
            <h3 className="font-serif text-xl font-bold mb-5">Important Notes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-neutral-300">
              {[
                'Orders are processed Monday–Saturday, 10am–6pm IST.',
                'Orders placed on Sundays or public holidays are processed the next business day.',
                'Delivery timelines are estimates and may vary during peak seasons.',
                'Cash on Delivery (COD) is available for orders up to ₹5,000.',
                'We use trusted couriers — Delhivery, Blue Dart, and India Post.',
                'Undelivered packages are returned to us after 3 delivery attempts.',
              ].map(note => (
                <div key={note} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
