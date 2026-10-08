import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart, Star, Users, Award, ChevronRight, ShoppingBag } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const values = [
  { icon: Heart, title: 'Rooted in Heritage', desc: 'Every piece we create honors centuries of Indian textile tradition — from handloom sarees to hand-embroidered lehengas.', color: 'bg-rose-100 text-rose-700' },
  { icon: Star, title: 'Uncompromising Quality', desc: 'We source directly from skilled artisans and weavers across Rajasthan, Varanasi, and Lucknow to ensure authenticity.', color: 'bg-amber-100 text-amber-700' },
  { icon: Users, title: 'Customer First', desc: 'From easy returns to personalized styling advice, every decision we make starts and ends with our customer\'s happiness.', color: 'bg-emerald-100 text-emerald-700' },
]

const stats = [
  { value: '10+', label: 'Years of Heritage' },
  { value: '5,000+', label: 'Unique Designs' },
  { value: '50,000+', label: 'Happy Customers' },
  { value: '500+', label: 'Artisan Partners' },
]

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
      <Header />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-rose-800 to-rose-600" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-24 md:py-36 relative z-10 text-white">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-widest mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">About Us</span>
          </div>
          <div className="max-w-3xl">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="text-rose-300 text-xs font-black uppercase tracking-[0.3em] mb-4">Our Brand</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
              className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6">
              About<br /><span className="text-rose-300">Shagun Gallery</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-rose-100 text-xl leading-relaxed max-w-xl">
              A legacy of craftsmanship. A celebration of Indian fashion. A promise of quality in every thread.
            </motion.p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <main className="flex-1 pb-20">
        {/* ── INTRO ── */}
        <div className="container mx-auto px-4 max-w-5xl pt-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-12 border-b border-neutral-100">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-neutral-900 mb-5 leading-snug">
                Born from a love of<br /><span className="text-rose-700">Indian craftsmanship</span>
              </h2>
              <p className="text-neutral-600 text-sm leading-loose mb-4">
                Shagun Gallery was founded in New Delhi with one simple belief — that every woman deserves to wear something truly beautiful.
                We set out to bring the finest ethnic wear, directly from India's best artisans, to your doorstep.
              </p>
              <p className="text-neutral-600 text-sm leading-loose">
                From the narrow lanes of Varanasi to the royal workshops of Jaipur, we curate pieces that carry stories — of hands that weaved,
                dyes that painted, and traditions passed down through generations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
                  <div className="font-serif text-3xl font-black text-rose-700 mb-1">{s.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── VALUES ── */}
          <div className="py-14">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-serif text-3xl font-bold text-neutral-900 text-center mb-10">Our Core Values</motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {values.map((v, i) => {
                const Icon = v.icon
                return (
                  <motion.div key={v.title}
                    initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="bg-white border border-neutral-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${v.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-neutral-900 mb-3">{v.title}</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">{v.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* ── CTA ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-r from-rose-700 to-rose-900 rounded-3xl p-10 text-center text-white">
            <Award className="w-10 h-10 mx-auto mb-4 text-rose-300" />
            <h3 className="font-serif text-3xl font-bold mb-3">Experience the Shagun Difference</h3>
            <p className="text-rose-200 text-sm mb-7 max-w-md mx-auto">
              Every piece is curated with love, crafted with skill, and delivered with care. Discover your next heirloom today.
            </p>
            <Link to="/products"
              className="inline-flex items-center gap-2 bg-white text-rose-900 font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl hover:bg-rose-50 transition-colors">
              <ShoppingBag className="w-4 h-4" /> Shop the Collection
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
