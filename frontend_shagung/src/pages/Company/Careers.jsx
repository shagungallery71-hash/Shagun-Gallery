import { motion } from 'framer-motion'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { ArrowRight, Briefcase } from 'lucide-react'

export default function Careers() {
    const openings = [
        { title: "Senior Fashion Designer", type: "Full-time", location: "New Delhi", dept: "Design" },
        { title: "E-commerce Manager", type: "Full-time", location: "New Delhi/Remote", dept: "Operations" },
        { title: "Social Media Strategist", type: "Part-time", location: "Remote", dept: "Marketing" },
    ]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-background"
        >
            <Header />

            <main>
                <section className="bg-slate-900 text-white py-24 px-4 text-center">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-6xl font-heading font-bold mb-6"
                    >
                        Join the Team
                    </motion.h1>
                    <p className="max-w-xl mx-auto text-gray-400 text-lg">
                        Build the future of fashion with us. We are always looking for creative minds and passionate individuals.
                    </p>
                </section>

                <section className="py-20 container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">Open Positions</h2>
                            <span className="text-sm text-slate-500">{openings.length} roles available</span>
                        </div>

                        <div className="space-y-4">
                            {openings.map((job, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white border boundary-slate-200 p-6 rounded-xl hover:shadow-lg transition-shadow flex flex-col md:flex-row md:items-center justify-between group"
                                >
                                    <div className="mb-4 md:mb-0">
                                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-purple-700 transition-colors">{job.title}</h3>
                                        <div className="flex gap-3 text-sm text-slate-500 mt-1">
                                            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.dept}</span>
                                            <span>•</span>
                                            <span>{job.type}</span>
                                            <span>•</span>
                                            <span>{job.location}</span>
                                        </div>
                                    </div>
                                    <button className="px-6 py-2 rounded-full bg-slate-100 text-slate-900 font-medium group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center gap-2">
                                        Apply Now <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-16 bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-2xl text-center">
                            <h3 className="text-2xl font-bold mb-4">Don't see your perfect role?</h3>
                            <p className="text-slate-700 mb-6">
                                We are always open to meeting talented people. Send your resume and portfolio to careers@shagungallery.com
                            </p>
                            <a href="mailto:careers@shagungallery.com" className="inline-block px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                                Contact Us
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </motion.div>
    )
}
