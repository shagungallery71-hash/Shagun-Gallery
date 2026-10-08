import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Headphones, Phone, Mail, ChevronRight } from 'lucide-react'

const QUICK_REPLIES = [
  '🛍️ Track my order',
  '📦 Return / Exchange',
  '💳 Payment issue',
  '📏 Size help',
  '📞 Talk to an agent',
]

const BOT_RESPONSES = {
  '🛍️ Track my order': 'Please share your order ID and we\'ll fetch the status right away! You can also check under My Account → Orders.',
  '📦 Return / Exchange': 'We offer hassle-free 7-day returns. Visit /returns for details or share your order ID to start a return.',
  '💳 Payment issue': 'Sorry for the inconvenience! Please send your order ID and payment screenshot to shagungallery71@gmail.com and our team will resolve it within 24 hours.',
  '📏 Size help': 'Check our detailed Size Guide at /size-guide. Still unsure? Share your measurements and we\'ll suggest the best fit!',
  '📞 Talk to an agent': 'Our team is available Mon–Sat, 10 AM – 7 PM IST. Call us at +91 85870 98161 or email shagungallery71@gmail.com.',
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Namaste! 🙏 Welcome to Shagun Gallery. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [unread, setUnread] = useState(1)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages])

  const sendMessage = (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text: msg }])
    setTyping(true)
    setTimeout(() => {
      const reply = BOT_RESPONSES[msg] ||
        'Thanks for reaching out! Our team will get back to you soon. For urgent queries call +91 85870 98161 or email shagungallery71@gmail.com.'
      setMessages(prev => [...prev, { from: 'bot', text: reply }])
      setTyping(false)
    }, 1000)
  }

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-[360px] rounded-2xl overflow-hidden shadow-2xl shadow-rose-900/20 border border-neutral-200 flex flex-col"
            style={{ maxHeight: '520px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-4 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">Shagun Support</p>
                <p className="text-white/70 text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse" />
                  Online • Typically replies in minutes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a href="tel:+918587098161" className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="Call us">
                  <Phone className="w-3.5 h-3.5 text-white" />
                </a>
                <a href="mailto:shagungallery71@gmail.com" className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="Email us">
                  <Mail className="w-3.5 h-3.5 text-white" />
                </a>
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-neutral-50 p-3 space-y-2.5" style={{ minHeight: '220px', maxHeight: '280px' }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.from === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center mr-1.5 mt-0.5 shrink-0">
                      <span className="text-white text-[9px] font-bold">SG</span>
                    </div>
                  )}
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                    m.from === 'user'
                      ? 'bg-rose-600 text-white rounded-br-sm'
                      : 'bg-white text-neutral-700 border border-neutral-100 rounded-bl-sm shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start items-end gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center shrink-0">
                    <span className="text-white text-[9px] font-bold">SG</span>
                  </div>
                  <div className="bg-white border border-neutral-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="bg-white px-3 pt-2.5 pb-1 border-t border-neutral-100">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-2">Quick Replies</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_REPLIES.map(qr => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
                    className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-400 transition-colors whitespace-nowrap font-medium"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="bg-white px-3 py-2.5 border-t border-neutral-100 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message…"
                className="flex-1 text-sm bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all placeholder:text-neutral-400"
              />
              <button
                onClick={() => sendMessage()}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center text-white hover:opacity-90 transition-opacity shrink-0 shadow-md shadow-rose-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB Trigger ────────────────────────────────────────── */}
      <motion.button
        onClick={() => { setOpen(o => !o); setUnread(0) }}
        className="fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center shadow-xl shadow-rose-400/40 hover:shadow-rose-400/60 transition-shadow"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
            >
              {unread}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping bg-rose-400/30 pointer-events-none" />
        )}
      </motion.button>
    </>
  )
}
