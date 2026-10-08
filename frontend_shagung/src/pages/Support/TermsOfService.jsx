import { motion } from 'framer-motion';
import { FileText, ShoppingBag, Truck, CreditCard, AlertCircle, Scale, Mail } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 md:py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                            <FileText className="w-4 h-4" />
                            Legal Agreement
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">Terms of Service</h1>
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
                                    <Scale className="w-6 h-6 text-indigo-500" />
                                    Agreement to Terms
                                </h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Welcome to Shagun Gallery. By accessing or using our website and services, you agree to be
                                    bound by these Terms of Service. If you do not agree to these terms, please do not use
                                    our services. These terms apply to all visitors, users, and customers of our website.
                                </p>
                            </div>

                            {/* Products & Orders */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-6 h-6 text-indigo-500" />
                                    Products & Orders
                                </h2>
                                <div className="space-y-4">
                                    <div className="border-l-4 border-indigo-500 pl-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">Product Information</h3>
                                        <p className="text-gray-600 text-sm">
                                            We strive to display accurate product colors, sizes, and descriptions. However,
                                            actual colors may vary slightly due to monitor settings and photography. All
                                            products are subject to availability.
                                        </p>
                                    </div>
                                    <div className="border-l-4 border-purple-500 pl-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">Order Acceptance</h3>
                                        <p className="text-gray-600 text-sm">
                                            We reserve the right to refuse or cancel any order for any reason, including
                                            availability, errors in pricing or product information, or suspected fraud.
                                        </p>
                                    </div>
                                    <div className="border-l-4 border-pink-500 pl-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">Pricing</h3>
                                        <p className="text-gray-600 text-sm">
                                            All prices are in Indian Rupees (INR) and are inclusive of applicable taxes
                                            unless otherwise stated. Prices are subject to change without notice.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping & Delivery */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Truck className="w-6 h-6 text-indigo-500" />
                                    Shipping & Delivery
                                </h2>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></span>
                                        Orders are typically processed within 2-3 business days
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></span>
                                        Delivery times vary based on location (5-10 business days for most locations)
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></span>
                                        Free shipping on orders above ₹999
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></span>
                                        We are not responsible for delays caused by shipping carriers or customs
                                    </li>
                                </ul>
                            </div>

                            {/* Payment Terms */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-6 h-6 text-indigo-500" />
                                    Payment Terms
                                </h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-indigo-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">Accepted Payments</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• Credit/Debit Cards</li>
                                            <li>• UPI Payments</li>
                                            <li>• Net Banking</li>
                                            <li>• Cash on Delivery (COD)</li>
                                        </ul>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">Payment Security</h4>
                                        <p className="text-sm text-gray-600">
                                            All payments are processed through secure, PCI-compliant payment gateways.
                                            We never store your complete card details.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* User Conduct */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-indigo-500" />
                                    User Conduct
                                </h2>
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                    <p className="text-gray-700 mb-3">You agree NOT to:</p>
                                    <ul className="space-y-2 text-gray-600 text-sm">
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-500">✗</span>
                                            Use the website for any unlawful purpose
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-500">✗</span>
                                            Attempt to gain unauthorized access to our systems
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-500">✗</span>
                                            Interfere with the proper working of the website
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-500">✗</span>
                                            Use automated systems to access the website
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-500">✗</span>
                                            Provide false or misleading information
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Intellectual Property */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    All content on this website, including text, graphics, logos, images, and software,
                                    is the property of Shagun Gallery and is protected by Indian and international
                                    copyright laws. Unauthorized use, reproduction, or distribution is prohibited.
                                </p>
                            </div>

                            {/* Limitation of Liability */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Shagun Gallery shall not be liable for any indirect, incidental, special, or
                                    consequential damages arising from the use of our website or products. Our
                                    liability is limited to the amount paid for the specific product in question.
                                </p>
                            </div>

                            {/* Changes to Terms */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    We reserve the right to modify these Terms of Service at any time. Changes will
                                    be effective immediately upon posting. Your continued use of the website after
                                    any changes indicates your acceptance of the new terms.
                                </p>
                            </div>

                            {/* Contact */}
                            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-indigo-500" />
                                    Questions?
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    If you have any questions about these Terms of Service, please contact us:
                                </p>
                                <div className="space-y-2 text-gray-700">
                                    <p><strong>Email:</strong> shagungallery71@gmail.com</p>
                                    <p><strong>Phone:</strong> +91 85870 98161</p>
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
