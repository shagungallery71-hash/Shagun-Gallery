import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight, Leaf, Package, Users, Recycle, Sun, Droplets, CheckCircle } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const pillars = [
  {
    icon: Users, title: 'Ethical Sourcing', color: 'bg-emerald-600',
    desc: 'We work directly with artisan families across India, cutting out middlemen and ensuring fair compensation for skilled craftspeople.',
    points: ['Direct artisan partnerships', 'Fair trade certified suppliers', 'Monthly wage audits', 'Safe working conditions']
  },
  {
    icon: Package, title: 'Eco Packaging', color: 'bg-teal-600',
    desc: 'Our packaging is 100% recyclable and biodegradable. We eliminated single-use plastics from all our packaging in 2022.',
    points: ['Recycled kraft paper boxes', 'Soy-based inks', 'Biodegradable mailers', 'Zero plastic in 2022']
  },
  {
    icon: Leaf, title: 'Natural Textiles', color: 'bg-green-600',
    desc: 'We prioritize natural, sustainable fabrics: organic cotton, Ahimsa silk, hand-woven linen, and plant-dyed textiles.',
    points: ['Organic cotton sourcing', 'Ahimsa (cruelty-free) silk', 'Azo-free dyes', 'Minimal chemical processing']
  },
]

const goals2025 = [
  { label: 'Carbon Neutral Shipping', progress: 65 },
  { label: 'Zero Plastic Packaging', progress: 100 },
  { label: 'Solar-Powered Warehouse', progress: 40 },
  { label: 'Artisan Welfare Fund ₹50L', progress: 72 },
]

export default function Sustainability() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-800 to-green-600 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Sustainability</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="w-8 h-8 text-emerald-300" />
              <p className="text-emerald-300 text-xs font-black uppercase tracking-[0.3em]">Our Commitment</p>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6">Fashion with<br /><span className="text-emerald-300">a Conscience</span></h1>
            <p className="text-emerald-100 text-xl leading-relaxed">
              We believe beautiful fashion shouldn't cost the earth. Here's how Shagun Gallery is building a more sustainable future.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <main className="flex-1 pb-20">
        <div className="container mx-auto px-4 max-w-5xl pt-4">

          {/* Pledge Bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="grid grid-cols-3 gap-4 mb-16 text-center">
            {[
              { icon: Recycle, label: '100% Recyclable Packaging', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { icon: Sun, label: 'Renewable Energy Goals by 2025', color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { icon: Droplets, label: 'Water-Conscious Manufacturing', color: 'text-blue-700 bg-blue-50 border-blue-200' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className={`${color} border rounded-2xl p-5`}>
                <Icon className="w-7 h-7 mx-auto mb-3" />
                <p className="text-xs font-bold leading-tight">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* ── THREE PILLARS ── */}
          <h2 className="font-serif text-3xl font-bold text-neutral-900 text-center mb-10">Our Three Pillars</h2>
          <div className="space-y-6 mb-16">
            {pillars.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div key={p.title}
                  initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
                  <div className={`w-14 h-14 ${p.color} rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-2xl font-bold text-neutral-900 mb-3">{p.title}</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-5">{p.desc}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {p.points.map(pt => (
                        <div key={pt} className="flex items-center gap-2 text-xs text-neutral-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {pt}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* ── 2025 GOALS ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-950 to-emerald-800 rounded-3xl p-8 md:p-10 text-white mb-10">
            <h3 className="font-serif text-2xl font-bold mb-8 flex items-center gap-3">
              <Leaf className="w-6 h-6 text-emerald-400" /> Our 2025 Pledge
            </h3>
            <div className="space-y-6">
              {goals2025.map(g => (
                <div key={g.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-emerald-100">{g.label}</span>
                    <span className="text-xs font-black text-emerald-400">{g.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-900 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${g.progress}%` }}
                      viewport={{ once: true }} transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center">
            <p className="font-serif text-xl text-neutral-600 italic mb-6">
              "The most sustainable garment is the one you love and wear for years."
            </p>
            <Link to="/products"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-colors">
              Shop Consciously <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
