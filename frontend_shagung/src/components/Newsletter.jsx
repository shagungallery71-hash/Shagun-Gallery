import { useState } from 'react'
import { ArrowRight, Star, Globe, ShieldCheck, Instagram, Facebook } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://shagun-backend-kbbh.onrender.com';

export default function Newsletter() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState('idle') // idle, loading, success, error
    const [message, setMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) return

        setStatus('loading')
        setMessage('')

        try {
            const res = await fetch(`${API_BASE}/api/newsletter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (res.ok) {
                setStatus('success')
                setMessage(data.message || 'Successfully subscribed!')
                setEmail('')
            } else {
                setStatus('error')
                setMessage(data.message || 'Failed to subscribe. Please try again.')
            }
        } catch (error) {
            setStatus('error')
            setMessage('Network error. Please try again later.')
        }
    }

    const brandFeatures = [
        {
            icon: <Star className="w-5 h-5 text-rose-600" strokeWidth={1.5} />,
            title: "Premium Curation",
            desc: "Handpicked styles for the discerning trendsetter."
        },
        {
            icon: <Globe className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />,
            title: "Global Trends",
            desc: "Bringing international fashion directly to your doorstep."
        },
        {
            icon: <ShieldCheck className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />,
            title: "Trusted Quality",
            desc: "Authenticity and excellence in every single product."
        }
    ]

    return (
        <section className="bg-neutral-100 py-10 md:py-20 border-y border-neutral-200">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-20">
                    
                    {/* Brand Story */}
                    <div className="w-full lg:w-1/2">
                        <span className="text-xs uppercase tracking-[0.2em] font-medium text-neutral-500 mb-4 block">The Shagun Gallery Experience</span>
                        <h2 className="text-3xl md:text-4xl font-light font-heading text-neutral-900 mb-6 leading-tight uppercase">
                            Elevate Your <br /> Wardrobe
                        </h2>
                        <p className="text-neutral-500 font-light leading-relaxed mb-10">
                            Join a community of style icons and thoughtful gifters. Shagun Gallery is a celebration of elegance, tradition, and modernity interwoven into every piece we offer.
                        </p>

                        <div className="space-y-6">
                            {brandFeatures.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-sm uppercase tracking-widest font-medium text-neutral-900 mb-1">{feature.title}</h3>
                                        <p className="text-sm text-neutral-500 font-light">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subscription Form */}
                    <div className="w-full lg:w-1/2">
                        <div className="bg-white p-8 md:p-12 border border-neutral-200 shadow-sm">
                            <h3 className="text-xl uppercase tracking-widest font-heading font-light text-neutral-900 mb-3 text-center">Be Part of the Legacy</h3>
                            <p className="text-neutral-500 font-light text-sm text-center mb-10">
                                Subscribe to receive exclusive access to new collections and VIP-only events.
                            </p>

                            {status === 'success' ? (
                                <div className="bg-neutral-50 border border-neutral-200 p-8 text-center">
                                    <h4 className="text-neutral-900 font-medium uppercase tracking-widest text-sm mb-3">Welcome to the Family</h4>
                                    <p className="text-neutral-500 font-light text-sm mb-6">{message || 'Keep an eye on your inbox for something special.'}</p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="text-xs uppercase tracking-[0.2em] text-neutral-900 border-b border-black pb-1 hover:text-neutral-500 transition-colors"
                                    >
                                        Subscribe another email
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {status === 'error' && (
                                        <div className="bg-red-50 text-red-800 text-sm font-light p-4 text-center border border-red-100 mb-6">
                                            {message}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <input
                                            type="email"
                                            placeholder="EMAIL ADDRESS"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                                            className="w-full px-4 py-4 bg-transparent border-b border-rose-200 text-neutral-900 text-sm font-light placeholder:text-neutral-400 placeholder:tracking-widest focus:border-rose-600 focus:outline-none transition-colors rounded-none"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full py-4 mt-6 bg-rose-700 text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-rose-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {status === 'loading' ? (
                                            'SUBSCRIBING...'
                                        ) : (
                                            <>
                                                JOIN THE LIST <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                                            </>
                                        )}
                                    </button>
                                    
                                    <p className="text-[10px] uppercase tracking-widest text-center text-neutral-400 font-light mt-4">
                                        No spam, ever. Unsubscribe anytime.
                                    </p>
                                </form>
                            )}

                            <div className="mt-12 pt-8 border-t border-neutral-100 flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-widest text-neutral-500">Follow our journey</span>
                                <div className="flex gap-4">
                                    <a
                                        href="https://www.instagram.com/shagungallery"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-rose-400 hover:text-rose-700 transition-colors"
                                        aria-label="Instagram"
                                    >
                                        <Instagram className="w-4 h-4" strokeWidth={1.5} />
                                    </a>
                                    <a
                                        href="https://www.facebook.com/shagungallery"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-rose-400 hover:text-rose-700 transition-colors"
                                        aria-label="Facebook"
                                    >
                                        <Facebook className="w-4 h-4" strokeWidth={1.5} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
