import { motion } from 'framer-motion'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { ExternalLink } from 'lucide-react'

export default function Press() {
    const articles = [
        { source: "Vogue India", date: "August 2024", title: "Top 10 Ethnic Brands to Watch This Diwali", summary: "Shagun Gallery is listed as a top contender for modern ethnic wear that doesn't break the bank." },
        { source: "Fashion Week Daily", date: "June 2024", title: "The Rise of Fusion Fashion in Urban India", summary: "How Shagun Gallery is bridging the gap between traditional craftsmanship and modern silhouettes." },
        { source: "The Delhi Times", date: "January 2024", title: "Local Boutique Goes Global", summary: "An interview with the founders on their journey from a small shop in Lado Sarai to shipping worldwide." },
    ]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-background"
        >
            <Header />

            <main>
                <section className="bg-white py-20 px-4 text-center border-b">
                    <span className="text-purple-600 font-bold tracking-widest uppercase text-xs mb-4 block">In the News</span>
                    <h1 className="text-4xl md:text-5xl font-heading font-black mb-6 text-slate-900">
                        Shagun in the Spotlight
                    </h1>
                </section>

                <section className="py-16 container mx-auto px-4 bg-slate-50">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {articles.map((article, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-start"
                            >
                                <div className="text-xs font-bold text-slate-400 mb-4">{article.source} • {article.date}</div>
                                <h3 className="text-xl font-bold mb-4 text-slate-900 leading-tight">{article.title}</h3>
                                <p className="text-slate-600 mb-6 flex-grow">{article.summary}</p>
                                <button className="text-purple-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                                    Read Article <ExternalLink className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="py-20 text-center container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-6">Media Inquiries</h2>
                    <p className="text-slate-600 mb-8 max-w-lg mx-auto">
                        For press kits, high-resolution images, or interview requests, please contact our PR team.
                    </p>
                    <a href="mailto:shagungallery71@gmail.com" className="inline-block px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-slate-800 transition-colors">
                        shagungallery71@gmail.com
                    </a>
                </section>
            </main>

            <Footer />
        </motion.div>
    )
}
