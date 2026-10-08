import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail, Globe } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16 md:py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                            <Shield className="w-4 h-4" />
                            Your Privacy Matters
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">Privacy Policy</h1>
                        <p className="text-white/80 text-lg">
                            Last updated: December 2024
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Content */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 space-y-8">

                            {/* Introduction */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Lock className="w-6 h-6 text-purple-500" />
                                    Introduction
                                </h2>
                                <p className="text-gray-600 leading-relaxed">
                                    At Shagun Gallery, we take your privacy seriously. This Privacy Policy explains how we collect,
                                    use, disclose, and safeguard your information when you visit our website or make a purchase
                                    from our online store. Please read this privacy policy carefully.
                                </p>
                            </div>

                            {/* Information We Collect */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Database className="w-6 h-6 text-purple-500" />
                                    Information We Collect
                                </h2>
                                <div className="space-y-4">
                                    <div className="bg-purple-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                                        <ul className="text-gray-600 space-y-1 list-disc list-inside">
                                            <li>Name and contact information (email, phone number)</li>
                                            <li>Shipping and billing address</li>
                                            <li>Payment information (processed securely via payment gateways)</li>
                                            <li>Order history and preferences</li>
                                        </ul>
                                    </div>
                                    <div className="bg-pink-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">Automatically Collected Information</h3>
                                        <ul className="text-gray-600 space-y-1 list-disc list-inside">
                                            <li>IP address and device information</li>
                                            <li>Browser type and version</li>
                                            <li>Pages visited and time spent</li>
                                            <li>Referral sources</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* How We Use Your Information */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Eye className="w-6 h-6 text-purple-500" />
                                    How We Use Your Information
                                </h2>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></span>
                                        Process and fulfill your orders
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></span>
                                        Send you order confirmations and shipping updates
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></span>
                                        Respond to your inquiries and provide customer support
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></span>
                                        Send promotional communications (with your consent)
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></span>
                                        Improve our website and services
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></span>
                                        Prevent fraud and enhance security
                                    </li>
                                </ul>
                            </div>

                            {/* Data Security */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-purple-500" />
                                    Data Security
                                </h2>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    We implement industry-standard security measures to protect your personal information:
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">🔒 SSL Encryption</h4>
                                        <p className="text-sm text-gray-600">All data transmitted is encrypted using SSL technology</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">💳 Secure Payments</h4>
                                        <p className="text-sm text-gray-600">Payment processing through trusted gateways</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">🛡️ Data Protection</h4>
                                        <p className="text-sm text-gray-600">Regular security audits and updates</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">🔐 Access Control</h4>
                                        <p className="text-sm text-gray-600">Limited access to personal information</p>
                                    </div>
                                </div>
                            </div>

                            {/* Your Rights */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Globe className="w-6 h-6 text-purple-500" />
                                    Your Rights
                                </h2>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    You have the right to:
                                </p>
                                <ul className="space-y-2 text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Access the personal data we hold about you
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Request correction of inaccurate data
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Request deletion of your data
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Opt-out of marketing communications
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Withdraw consent at any time
                                    </li>
                                </ul>
                            </div>

                            {/* Contact */}
                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-purple-500" />
                                    Contact Us
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    If you have any questions about this Privacy Policy, please contact us:
                                </p>
                                <div className="space-y-2 text-gray-700">
                                    <p><strong>Email:</strong> shagungallery71@gmail.com</p>
                                    <p><strong>Phone:</strong> +91 85870 98161</p>
                                    <p><strong>Address:</strong> K-316/5, First Floor, Lado Sarai, Near Shiv Mandir, New Delhi - 110030</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
