import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Ruler, ChevronRight, Info } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const sizeCharts = [
  {
    label: 'Tops & Kurtis',
    headers: ['Size', 'Bust (in)', 'Waist (in)', 'Hip (in)', 'Length (in)'],
    rows: [
      ['XS', '32–33', '26–27', '34–35', '44'],
      ['S', '34–35', '28–29', '36–37', '44'],
      ['M', '36–37', '30–31', '38–39', '45'],
      ['L', '38–40', '32–34', '40–42', '46'],
      ['XL', '41–43', '35–37', '43–45', '46'],
      ['XXL', '44–46', '38–40', '46–48', '47'],
    ]
  },
  {
    label: 'Bottoms & Palazzos',
    headers: ['Size', 'Waist (in)', 'Hip (in)', 'Length (in)'],
    rows: [
      ['XS', '26–27', '34–35', '38'],
      ['S', '28–29', '36–37', '39'],
      ['M', '30–31', '38–39', '39'],
      ['L', '32–34', '40–42', '40'],
      ['XL', '35–37', '43–45', '40'],
      ['XXL', '38–40', '46–48', '41'],
    ]
  }
]

const tips = [
  { label: 'Bust', desc: 'Measure around the fullest part of your chest, keeping the tape parallel to the ground.' },
  { label: 'Waist', desc: 'Measure around the narrowest part of your torso, usually just above the belly button.' },
  { label: 'Hip', desc: 'Measure around the fullest part of your hips and buttocks.' },
  { label: 'Length', desc: 'Measure from the top of your shoulder straight down to your desired hemline.' },
]

export default function SizeGuide() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-violet-950 via-violet-700 to-purple-500 text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/3" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Size Guide</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center">
                <Ruler className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-wide">Size Guide</h1>
            </div>
            <p className="text-violet-200 text-lg max-w-lg leading-relaxed">
              Find your perfect fit with our comprehensive size charts. All measurements are in inches.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-neutral-50" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <main className="flex-1 pt-4 pb-20 bg-neutral-50">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Measuring Tips */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-violet-50 border border-violet-200 rounded-2xl p-7 mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Info className="w-5 h-5 text-violet-600" />
              <h2 className="font-serif text-xl font-bold text-violet-900">How to Measure</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {tips.map((tip, i) => (
                <motion.div key={tip.label}
                  initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-xl p-4 border border-violet-100">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full mb-2">{tip.label}</span>
                  <p className="text-xs text-neutral-600 leading-relaxed">{tip.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Size Tables */}
          <div className="space-y-8">
            {sizeCharts.map((chart, ci) => (
              <motion.div key={chart.label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: ci * 0.1 }}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                  <h3 className="font-serif text-lg font-bold">{chart.label}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-violet-50 border-b border-violet-100">
                        {chart.headers.map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-violet-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chart.rows.map((row, ri) => (
                        <tr key={ri} className={`border-b border-neutral-100 last:border-none ${ri % 2 === 0 ? 'bg-white' : 'bg-neutral-50/60'}`}>
                          {row.map((cell, ci2) => (
                            <td key={ci2} className={`px-4 py-3 ${ci2 === 0 ? 'font-bold text-violet-700 text-xs uppercase tracking-widest' : 'text-neutral-700'}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Note */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-10 bg-neutral-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Info className="w-6 h-6 text-violet-400 shrink-0" />
            <div>
              <p className="text-sm leading-relaxed text-neutral-300">
                Sizes may vary slightly between styles and fabrics. When in doubt, size up. If you need help choosing,
                our team is happy to assist — just <Link to="/contact" className="text-violet-400 underline underline-offset-2 hover:text-violet-300">contact us</Link>.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
