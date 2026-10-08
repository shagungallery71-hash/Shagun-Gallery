import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle, Package, Truck, MapPin,
    ArrowRight, Download, Share2, Copy, Check
} from 'lucide-react';
import { api } from '../api/client';
import { Button, Card, Badge, AnimatedSection, Skeleton } from '../components/ui';
import confetti from 'canvas-confetti';

export default function OrderSuccessPage() {
    const { orderId } = useParams();
    const location = useLocation();
    const [order, setOrder] = useState(location.state?.order || null);
    const [loading, setLoading] = useState(!location.state?.order);
    const [copied, setCopied] = useState(false);

    // Fetch order if not passed via state
    useEffect(() => {
        const fetchOrder = async () => {
            if (!order) {
                try {
                    const data = await api.getOrder(orderId);
                    setOrder(data.order);
                } catch (error) {
                    console.error('Failed to fetch order:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchOrder();
    }, [orderId, order]);

    // Confetti effect
    useEffect(() => {
        if (order) {
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#ff758c', '#ff7eb3', '#667eea', '#764ba2'],
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#ff758c', '#ff7eb3', '#667eea', '#764ba2'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [order]);

    // Copy order number
    const handleCopy = () => {
        navigator.clipboard.writeText(order?.order_number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto">
                        <Skeleton className="h-64 rounded-xl mb-6" />
                        <Skeleton className="h-48 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
                    <Link to="/orders">
                        <Button variant="primary">View Orders</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    {/* Success Header */}
                    <AnimatedSection className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-lg shadow-green-500/30"
                        >
                            <CheckCircle className="w-12 h-12 text-white" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-bold text-gray-900 mb-2"
                        >
                            Order Placed Successfully! 🎉
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-600"
                        >
                            Thank you for your order. We'll send you a confirmation email shortly.
                        </motion.p>
                    </AnimatedSection>

                    {/* Order Number */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="p-6 mb-6 bg-gradient-to-r from-primary/5 to-secondary/5" hover={false}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Order Number</p>
                                    <p className="text-2xl font-bold text-gray-900">{order.order_number}</p>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                                </button>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Order Timeline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="p-6 mb-6" hover={false}>
                            <h3 className="font-semibold mb-4">What's Next?</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Order Confirmed</p>
                                        <p className="text-sm text-gray-500">Your order has been received</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 opacity-60">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Processing</p>
                                        <p className="text-sm text-gray-500">We're preparing your order</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 opacity-60">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <Truck className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Shipped</p>
                                        <p className="text-sm text-gray-500">On the way to you</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 opacity-60">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Delivered</p>
                                        <p className="text-sm text-gray-500">Expected in 5-7 business days</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Order Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card className="p-6 mb-6" hover={false}>
                            <h3 className="font-semibold mb-4">Order Details</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Payment Method</span>
                                    <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                                        {order.payment_status === 'paid' ? 'Paid Online ✓' : 'Cash on Delivery'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Order Date</span>
                                    <span>{new Date(order.created_at).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{parseFloat(order.discount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Shipping</span>
                                    <span>{order.shipping_cost > 0 ? `₹${order.shipping_cost}` : 'FREE'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tax</span>
                                    <span>₹{parseFloat(order.tax_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-3">
                                    <span>Total</span>
                                    <span className="text-primary">₹{parseFloat(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Shipping Address */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <Card className="p-6 mb-6" hover={false}>
                            <h3 className="font-semibold mb-3">Shipping Address</h3>
                            <div className="text-sm text-gray-600">
                                <p className="font-medium text-gray-900">{order.shipping_address?.full_name}</p>
                                <p>{order.shipping_address?.address_line1}</p>
                                {order.shipping_address?.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                                <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}</p>
                                <p>Phone: {order.shipping_address?.phone}</p>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <Link to={`/orders`} className="flex-1">
                            <Button variant="outline" size="lg" className="w-full">
                                View All Orders
                            </Button>
                        </Link>
                        <Link to="/products" className="flex-1">
                            <Button variant="gradient" size="lg" className="w-full" rightIcon={<ArrowRight className="w-5 h-5" />}>
                                Continue Shopping
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

