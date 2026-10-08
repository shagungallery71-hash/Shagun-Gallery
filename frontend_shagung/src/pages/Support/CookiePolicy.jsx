import { motion } from 'framer-motion';
import { Cookie, Settings, BarChart3, Shield, ToggleLeft, Mail } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-16 md:py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                            <Cookie className="w-4 h-4" />
                            Cookie Information
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">Cookie Policy</h1>
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

                            {/* What are Cookies */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Cookie className="w-6 h-6 text-amber-500" />
                                    What Are Cookies?
                                </h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Cookies are small text files that are placed on your computer or mobile device when
                                    you visit a website. They are widely used to make websites work more efficiently,
                                    provide a better user experience, and give website owners useful information about
                                    how their site is being used.
                                </p>
                            </div>

                            {/* Types of Cookies */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Settings className="w-6 h-6 text-amber-500" />
                                    Types of Cookies We Use
                                </h2>
                                <div className="space-y-4">
                                    <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">🟢 Essential Cookies</h3>
                                        <p className="text-gray-600 text-sm mb-2">
                                            These cookies are necessary for the website to function properly.
                                        </p>
                                        <ul className="text-sm text-gray-500 space-y-1">
                                            <li>• Session management and user authentication</li>
                                            <li>• Shopping cart functionality</li>
                                            <li>• Security and fraud prevention</li>
                                        </ul>
                                    </div>

                                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">🔵 Preference Cookies</h3>
                                        <p className="text-gray-600 text-sm mb-2">
                                            These cookies remember your preferences and settings.
                                        </p>
                                        <ul className="text-sm text-gray-500 space-y-1">
                                            <li>• Language and region preferences</li>
                                            <li>• Display settings</li>
                                            <li>• Recently viewed products</li>
                                        </ul>
                                    </div>

                                    <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">🟣 Analytics Cookies</h3>
                                        <p className="text-gray-600 text-sm mb-2">
                                            These cookies help us understand how visitors use our website.
                                        </p>
                                        <ul className="text-sm text-gray-500 space-y-1">
                                            <li>• Page views and navigation patterns</li>
                                            <li>• Time spent on pages</li>
                                            <li>• Error tracking and performance</li>
                                        </ul>
                                    </div>

                                    <div className="bg-orange-50 border-l-4 border-orange-500 rounded-r-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">🟠 Marketing Cookies</h3>
                                        <p className="text-gray-600 text-sm mb-2">
                                            These cookies track your activity to deliver personalized ads.
                                        </p>
                                        <ul className="text-sm text-gray-500 space-y-1">
                                            <li>• Personalized product recommendations</li>
                                            <li>• Retargeting advertisements</li>
                                            <li>• Social media sharing features</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* How We Use Cookies */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-6 h-6 text-amber-500" />
                                    How We Use Cookies
                                </h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">🛒 Shopping Experience</h4>
                                        <p className="text-sm text-gray-600">Remember items in your cart and wishlist</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">🔐 Security</h4>
                                        <p className="text-sm text-gray-600">Protect your account and prevent fraud</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">📊 Analytics</h4>
                                        <p className="text-sm text-gray-600">Understand how you use our website</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">🎯 Personalization</h4>
                                        <p className="text-sm text-gray-600">Show relevant products and content</p>
                                    </div>
                                </div>
                            </div>

                            {/* Third Party Cookies */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-amber-500" />
                                    Third-Party Cookies
                                </h2>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    Some cookies are placed by third-party services that appear on our pages:
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="text-left p-3 rounded-tl-lg">Service</th>
                                                <th className="text-left p-3">Purpose</th>
                                                <th className="text-left p-3 rounded-tr-lg">More Info</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="p-3 font-medium">Google Analytics</td>
                                                <td className="p-3 text-gray-600">Website analytics</td>
                                                <td className="p-3">
                                                    <a href="https://policies.google.com/privacy" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                                        Privacy Policy
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-3 font-medium">Facebook Pixel</td>
                                                <td className="p-3 text-gray-600">Marketing & ads</td>
                                                <td className="p-3">
                                                    <a href="https://www.facebook.com/privacy" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                                        Privacy Policy
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-medium">Razorpay</td>
                                                <td className="p-3 text-gray-600">Payment processing</td>
                                                <td className="p-3">
                                                    <a href="https://razorpay.com/privacy/" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                                        Privacy Policy
                                                    </a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Managing Cookies */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ToggleLeft className="w-6 h-6 text-amber-500" />
                                    Managing Cookies
                                </h2>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    You can control and manage cookies in several ways:
                                </p>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                                        <span><strong>Browser Settings:</strong> Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                                        <span><strong>Opt-out Links:</strong> Visit <a href="https://optout.aboutads.info" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">optout.aboutads.info</a> to opt out of targeted advertising.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                                        <span><strong>Google Analytics Opt-out:</strong> Install the <a href="https://tools.google.com/dlpage/gaoptout" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</span>
                                    </li>
                                </ul>
                                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Note:</strong> Disabling essential cookies may affect website functionality,
                                        such as adding items to cart or completing checkout.
                                    </p>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-amber-500" />
                                    Questions About Cookies?
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    If you have any questions about our use of cookies, please contact us:
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
