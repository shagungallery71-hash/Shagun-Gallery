import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { RotateCcw, ChevronRight, CheckCircle, XCircle, Clock, ArrowLeftRight, Package } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const steps = [
  { num: '01', title: 'Initiate Return', desc: 'Go to My Orders, select the item, and click "Request Return." Choose your reason.', icon: Package },
  { num: '02', title: 'Schedule Pickup', desc: 'Our logistics partner will schedule a pickup from your address within 2–3 business days.', icon: RotateCcw },
  { num: '03', title: 'Quality Check', desc: 'Once received, our team inspects the item within 24–48 hours.', icon: CheckCircle },
  { num: '04', title: 'Refund / Exchange', desc: 'Refund credited in 5–7 days or your exchange item shipped immediately.', icon: ArrowLeftRight },
]

export default function Returns() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-700 to-teal-500 text-white overflow-hidden">
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-white/5 rounded-full" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Returns & Exchanges</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 tracking-wide">Returns & Exchanges</h1>
            <p className="text-emerald-200 text-lg max-w-lg leading-relaxed">
              Shop with confidence. If something isn't right, we make it easy to return or exchange — no questions asked.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <main className="flex-1 pt-4 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Policy highlight */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white text-center mb-14">
            <div className="text-6xl font-black font-serif mb-2">30</div>
            <div className="text-xl font-bold mb-1">Day Return Window</div>
            <p className="text-emerald-200 text-sm">From the date of delivery — hassle-free, no questions asked.</p>
          </motion.div>

          {/* ── STEP-BY-STEP PROCESS ── */}
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-neutral-900 text-center mb-10">How It Works</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={step.num}
                  initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 relative">
                  <div className="absolute top-5 right-5 text-4xl font-black text-emerald-100 leading-none select-none">{step.num}</div>
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-neutral-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{step.desc}</p>
                </motion.div>
              )
            })}
          </div>

          {/* ── CONDITIONS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="bg-white border border-emerald-100 rounded-2xl p-7 shadow-sm">
              <h3 className="font-serif text-lg font-bold text-neutral-900 mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> Eligible for Return
              </h3>
              <ul className="space-y-3">
                {['Item delivered within 30 days', 'Unused, unworn, and unwashed', 'Original tags and packaging intact', 'Not a custom/altered item', 'Not a sale/clearance item (unless defective)'].map(t => (
                  <li key={t} className="flex items-start gap-3 text-sm text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="bg-red-50 border border-red-100 rounded-2xl p-7">
              <h3 className="font-serif text-lg font-bold text-neutral-900 mb-5 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" /> Not Eligible
              </h3>
              <ul className="space-y-3">
                {['Items worn, washed, or altered', 'Items without original tags', 'Intimate wear and accessories', 'Items purchased in final sale', 'Damage caused by customer misuse'].map(t => (
                  <li key={t} className="flex items-start gap-3 text-sm text-neutral-700">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Refund Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-neutral-900 text-white rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-xl font-bold mb-2">Refund Timeline</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Once your return is received and inspected, your refund will be processed within <strong className="text-white">5–7 business days</strong>.
                The amount will be credited to your original payment method — bank transfer for bank payments, or wallet credit for UPI.
              </p>
            </div>
            <Link to="/contact"
              className="shrink-0 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-colors">
              Need Help? <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
