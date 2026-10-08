import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, ChevronRight } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 4000)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-rose-950 via-rose-800 to-rose-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/30"
              style={{ width: `${(i+1)*120}px`, height: `${(i+1)*120}px`, top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)', animation: `ping ${3+i}s cubic-bezier(0,0,0.2,1) infinite` }} />
          ))}
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Contact Us</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 tracking-wide">Get In Touch</h1>
            <p className="text-rose-200 text-lg max-w-lg leading-relaxed">
              We'd love to hear from you. Our team is always here to help with any queries about your orders, products, or anything else.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <main className="flex-1 pt-4 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* ── CONTACT CARDS ── */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16"
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}>
            {[
              { icon: Phone, label: 'Call Us', value: '+91 85870 98161', sub: 'Mon–Sat, 10am–7pm IST', color: 'rose', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
              { icon: Mail, label: 'Email Us', value: 'shagungallery71@gmail.com', sub: 'We reply within 24 hours', color: 'rose', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
              { icon: MapPin, label: 'Visit Us', value: 'K-316/5, First Floor, Lado Sarai', sub: 'Near Shiv Mandir, New Delhi - 110030', color: 'rose', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
            ].map(({ icon: Icon, label, value, sub, bg, border, text }) => (
              <motion.div key={label} variants={fadeUp}
                className={`${bg} ${border} border rounded-2xl p-6 flex gap-4 items-start`}>
                <div className={`w-10 h-10 rounded-xl ${text} bg-white shadow-sm flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-neutral-900 leading-snug break-all">{value}</p>
                  <p className="text-xs text-neutral-500 mt-1">{sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── FORM + HOURS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Form */}
            <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="bg-white border border-neutral-100 rounded-3xl shadow-sm p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-neutral-900">Send a Message</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">We'll get back to you as soon as possible</p>
                  </div>
                </div>

                {sent && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 font-semibold flex items-center gap-2">
                    ✅ Message sent! We'll reply within 24 hours.
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Your Name</label>
                      <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                        placeholder="Anita Sharma" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Email Address</label>
                      <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                        placeholder="anita@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Subject</label>
                    <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                      className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all bg-white">
                      <option value="">Select a topic…</option>
                      <option>Order Query</option>
                      <option>Return / Exchange</option>
                      <option>Product Question</option>
                      <option>Bulk / Wholesale</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Message</label>
                    <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                      className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all resize-none"
                      placeholder="Tell us how we can help you…" />
                  </div>
                  <button type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all active:scale-[0.98]">
                    <Send className="w-4 h-4" /> Send Message
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Business Hours */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-5">
              <div className="bg-gradient-to-br from-rose-700 to-rose-900 text-white rounded-3xl p-7">
                <div className="flex items-center gap-3 mb-5">
                  <Clock className="w-5 h-5 text-rose-300" />
                  <h3 className="font-serif text-lg font-bold">Business Hours</h3>
                </div>
                {[
                  { day: 'Monday – Friday', time: '10:00 AM – 7:00 PM' },
                  { day: 'Saturday', time: '10:00 AM – 6:00 PM' },
                  { day: 'Sunday', time: 'Closed' },
                ].map(({ day, time }) => (
                  <div key={day} className="flex justify-between items-center py-2.5 border-b border-rose-600/50 last:border-none">
                    <span className="text-rose-200 text-sm">{day}</span>
                    <span className={`text-sm font-semibold ${time === 'Closed' ? 'text-rose-400' : 'text-white'}`}>{time}</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-7">
                <h3 className="font-serif text-lg font-bold text-amber-900 mb-3">Quick Links</h3>
                {[
                  { label: 'Track Your Order', to: '/orders' },
                  { label: 'Returns & Exchanges', to: '/returns' },
                  { label: 'FAQs', to: '/faqs' },
                  { label: 'Size Guide', to: '/size-guide' },
                ].map(({ label, to }) => (
                  <Link key={label} to={to}
                    className="flex items-center justify-between py-2.5 border-b border-amber-200 last:border-none text-sm font-semibold text-amber-800 hover:text-amber-900 group transition-colors">
                    {label}
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
