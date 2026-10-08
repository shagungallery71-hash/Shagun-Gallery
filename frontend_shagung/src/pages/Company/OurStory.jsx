import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const timeline = [
  { year: '2014', title: 'The Beginning', desc: 'Shagun Gallery opens its first store in Lado Sarai, New Delhi. A small showroom with a big dream — to bring authentic ethnic wear to modern women.', color: 'bg-amber-500' },
  { year: '2016', title: 'Growing Roots', desc: 'We partner with 50+ artisan families across Rajasthan and UP. Our collection expands to include hand-embroidered lehengas and block-print sarees.', color: 'bg-rose-500' },
  { year: '2018', title: 'Community First', desc: 'Launch of our "Craft Mela" initiative — a quarterly showcase celebrating India\'s regional textiles and the hands that create them.', color: 'bg-emerald-500' },
  { year: '2020', title: 'Going Digital', desc: 'Facing the pandemic, we pivot to e-commerce and reach customers across 500+ cities India-wide. Our community grows to 10,000+ loyal shoppers.', color: 'bg-indigo-500' },
  { year: '2022', title: 'National Recognition', desc: 'Featured in Vogue India and Femina as one of India\'s most loved ethnic wear brands. We cross ₹5 Cr in annual sales.', color: 'bg-violet-500' },
  { year: 'Today', title: 'A Living Legacy', desc: 'Over 50,000 happy customers, 500+ artisan partners, and 5,000+ unique designs. The journey has just begun.', color: 'bg-amber-600' },
]

export default function OurStory() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-amber-950 via-amber-800 to-yellow-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,_white,_transparent_50%)]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-widest mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Our Story</span>
          </div>
          <div className="max-w-2xl">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
              className="text-amber-300 text-xs font-black uppercase tracking-[0.3em] mb-4">Est. 2014 · New Delhi</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
              className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6">Our Story</motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-amber-100 text-xl leading-relaxed">
              A decade of passion, craft, and community. Here's how Shagun Gallery grew from a small Delhi showroom into a beloved nationwide brand.
            </motion.p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <main className="flex-1 pb-20">
        <div className="container mx-auto px-4 max-w-4xl pt-4">

          {/* Founder's Note */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-amber-50 border border-amber-200 rounded-3xl p-8 md:p-12 mb-16 relative overflow-hidden">
            <div className="absolute top-6 left-8 text-8xl font-serif text-amber-200 leading-none select-none">"</div>
            <blockquote className="relative z-10 font-serif text-xl md:text-2xl text-amber-900 leading-loose italic mb-6 pt-4">
              We didn't start a business. We started a conversation between the artisan's hands and the modern woman's heart.
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-serif font-bold text-sm">SG</div>
              <div>
                <p className="font-bold text-amber-900 text-sm">Shagun Founder</p>
                <p className="text-xs text-amber-700">K-316/5, Lado Sarai, New Delhi</p>
              </div>
            </div>
          </motion.div>

          {/* ── TIMELINE ── */}
          <h2 className="font-serif text-3xl font-bold text-neutral-900 mb-12 text-center">A Decade of Growth</h2>
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-neutral-100 md:-translate-x-0.5" />
            <div className="space-y-10">
              {timeline.map((item, i) => (
                <motion.div key={item.year}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.55 }}
                  className={`relative flex flex-col md:flex-row gap-6 md:gap-10 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                  {/* dot */}
                  <div className={`absolute left-4 md:left-1/2 w-4 h-4 rounded-full ${item.color} top-1 -translate-x-[7px] md:-translate-x-1.5 ring-4 ring-white z-10`} />
                  {/* content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${i % 2 !== 0 ? 'md:text-right md:pr-10' : 'md:pl-10'}`}>
                    <span className={`inline-block text-[11px] font-black uppercase tracking-widest text-white ${item.color} px-3 py-1 rounded-full mb-3`}>{item.year}</span>
                    <h3 className="font-serif text-xl font-bold text-neutral-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-20 text-center">
            <p className="font-serif text-2xl text-neutral-700 mb-6 italic">And the story continues, with you.</p>
            <Link to="/products"
              className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-colors">
              Explore Our Collections <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
