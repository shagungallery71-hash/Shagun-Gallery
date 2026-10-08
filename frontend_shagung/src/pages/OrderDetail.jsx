import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Package, MapPin, Clock, CheckCircle,
    Truck, RefreshCw, XCircle, AlertTriangle, Download,
    ExternalLink, HelpCircle, Phone, Mail
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button, Skeleton } from '../components/ui';

const getColorCode = (item) => item?.color_code || '#9ca3af';

// ============================================================================
// STATUS CONFIG
// ============================================================================
const statusConfig = {
    pending:    { label: 'Pending',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed:  { label: 'Confirmed',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
    processing: { label: 'Processing', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    shipped:    { label: 'Shipped',    color: 'bg-violet-50 text-violet-700 border-violet-200' },
    delivered:  { label: 'Delivered',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-700 border-red-200' },
};

// ============================================================================
// ORDER STATUS STEPPER — mobile-friendly vertical on small screens
// ============================================================================
const OrderStatusStepper = ({ status, dates }) => {
    const steps = [
        { id: 'pending',    label: 'Placed',     icon: Clock },
        { id: 'processing', label: 'Processing', icon: RefreshCw },
        { id: 'shipped',    label: 'Shipped',    icon: Truck },
        { id: 'delivered',  label: 'Delivered',  icon: CheckCircle },
    ];

    if (status === 'cancelled') {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <p className="font-semibold text-neutral-900 text-sm">Order Cancelled</p>
                    <p className="text-xs text-neutral-500 mt-1">This order will not be processed.</p>
                </div>
            </div>
        );
    }

    const statusMap = { pending: 0, confirmed: 0, processing: 1, shipped: 2, delivered: 3 };
    const activeIndex = statusMap[status] ?? 0;

    const formatDate = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        return `${dt.getDate().toString().padStart(2,'0')}.${(dt.getMonth()+1).toString().padStart(2,'0')}.${dt.getFullYear()}`;
    };

    return (
        <div className="w-full pt-4 pb-2">
            {/* Desktop: horizontal */}
            <div className="hidden sm:flex items-center justify-between">
                {steps.map((step, idx) => {
                    const isCompleted = idx <= activeIndex;
                    const isCurrent   = idx === activeIndex;
                    const Icon = step.icon;
                    const stepDate = dates?.[step.id];

                    return (
                        <div key={step.id} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center relative z-10">
                                <motion.div
                                    initial={{ scale: 0.7, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: idx * 0.12, type: 'spring', stiffness: 220 }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                                        isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                                            : 'bg-white border-neutral-200 text-neutral-300'
                                    } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                                >
                                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                </motion.div>
                                <p className={`mt-2 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${isCompleted ? 'text-emerald-600' : 'text-neutral-400'}`}>
                                    {step.label}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${isCompleted ? 'text-emerald-500' : 'text-neutral-300'}`}>
                                    {isCompleted && stepDate ? formatDate(stepDate) : '—'}
                                </p>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2 relative">
                                    <div className="absolute inset-0 bg-neutral-100 rounded-full" />
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: idx < activeIndex ? '100%' : '0%' }}
                                        transition={{ duration: 0.7, delay: idx * 0.18, ease: 'easeOut' }}
                                        className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile: vertical timeline */}
            <div className="sm:hidden flex flex-col gap-0">
                {steps.map((step, idx) => {
                    const isCompleted = idx <= activeIndex;
                    const isCurrent   = idx === activeIndex;
                    const Icon = step.icon;
                    const stepDate = dates?.[step.id];
                    const isLast = idx === steps.length - 1;

                    return (
                        <div key={step.id} className="flex items-start gap-3 relative">
                            {/* Vertical line */}
                            {!isLast && (
                                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-neutral-100">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: idx < activeIndex ? '100%' : '0%' }}
                                        transition={{ duration: 0.6, delay: idx * 0.18 }}
                                        className="w-full bg-emerald-400"
                                    />
                                </div>
                            )}
                            {/* Circle */}
                            <motion.div
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1, type: 'spring' }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${
                                    isCompleted
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                        : 'bg-white border-neutral-200 text-neutral-300'
                                }`}
                            >
                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                            </motion.div>
                            {/* Label + date */}
                            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                                <p className={`text-xs font-bold uppercase tracking-wide leading-tight ${isCompleted ? 'text-emerald-600' : 'text-neutral-400'}`}>
                                    {step.label}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${isCompleted && stepDate ? 'text-neutral-500' : 'text-neutral-300'}`}>
                                    {isCompleted && stepDate ? formatDate(stepDate) : '—'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function OrderDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => { fetchOrder(); }, [orderId]);

    const fetchOrder = async () => {
        try {
            const res = await api.getOrder(orderId);
            setOrder(res.order);
        } catch (error) {
            showToast(error.message || 'Failed to load order', 'error');
            navigate('/account');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason) { showToast('Please provide a reason for cancellation', 'error'); return; }
        setCancelling(true);
        try {
            await api.cancelOrder(orderId, cancelReason);
            showToast('Order cancelled successfully', 'success');
            setShowCancelModal(false);
            fetchOrder();
        } catch (error) {
            showToast(error.message || 'Failed to cancel order', 'error');
        } finally {
            setCancelling(false);
        }
    };

    const handleDownloadInvoice = () => {
        if (!order) return;
        const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice - ${order.order_number}</title>
        <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#333;padding:40px}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #111}
        .invoice-title h1{font-size:28px;color:#111;font-weight:300;letter-spacing:4px}.invoice-title p{color:#888;margin-top:5px}
        table{width:100%;border-collapse:collapse;margin:30px 0}th{background:#f8f8f8;padding:12px 16px;text-align:left;font-size:11px;text-transform:uppercase;color:#888;border-bottom:2px solid #eee}
        td{padding:14px 16px;border-bottom:1px solid #eee}.item-name{font-weight:600;color:#111}.item-variant{font-size:12px;color:#aaa;margin-top:3px}
        .text-right{text-align:right}.summary{margin-left:auto;width:280px;margin-top:20px}
        .summary-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:14px}
        .summary-row.total{border-top:2px solid #111;border-bottom:none;padding-top:14px;font-size:17px;font-weight:700}
        .footer{margin-top:60px;padding-top:20px;border-top:1px solid #eee;text-align:center;color:#aaa;font-size:12px}
        </style></head><body>
        <div class="header"><img src="https://res.cloudinary.com/dsgktwwae/image/upload/v1773397047/WhatsApp_Image_2026-03-13_at_11.39.26_wepbgx.jpg" style="height:40px" />
        <div class="invoice-title"><h1>INVOICE</h1><p>${order.order_number}</p><p style="margin-top:8px;color:#aaa;font-size:13px">Date: ${fmt(order.created_at)}</p></div></div>
        <table><thead><tr><th style="width:50%">Item</th><th class="text-right">Price</th><th class="text-right">Qty</th><th class="text-right">Total</th></tr></thead>
        <tbody>${order.items?.map(i=>`<tr><td><div class="item-name">${i.product_name||'Product'}</div><div class="item-variant">${i.size?'Size: '+i.size:''}${i.size&&i.color?' | ':''}${i.color?'Color: '+i.color:''}</div></td>
        <td class="text-right">₹${parseFloat(i.price).toFixed(2)}</td><td class="text-right">${i.quantity}</td><td class="text-right">₹${(parseFloat(i.price)*i.quantity).toFixed(2)}</td></tr>`).join('')}</tbody></table>
        <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>₹${parseFloat(order.subtotal).toFixed(2)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${parseFloat(order.shipping_cost)>0?'₹'+parseFloat(order.shipping_cost).toFixed(2):'FREE'}</span></div>
        <div class="summary-row"><span>Tax (GST)</span><span>₹${parseFloat(order.tax_amount).toFixed(2)}</span></div>
        ${parseFloat(order.discount)>0?`<div class="summary-row" style="color:#22c55e"><span>Discount</span><span>-₹${parseFloat(order.discount).toFixed(2)}</span></div>`:''}
        <div class="summary-row total"><span>Grand Total</span><span>₹${parseFloat(order.total).toFixed(2)}</span></div></div>
        <div class="footer"><p>Thank you for shopping with Shagun Gallery!</p><p>shagungallery71@gmail.com | +91 85870 98161</p><p style=\"margin-top:4px\">K-316/5, First Floor, Lado Sarai, Near Shiv Mandir, New Delhi - 110030</p></div>
        </body></html>`;
        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 500);
    };

    // ── LOADING ──
    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
                    <Skeleton className="h-6 w-36 mb-8 rounded" />
                    <div className="space-y-4">
                        <Skeleton className="h-48 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!order) return null;

    const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
    const cfg = statusConfig[order.status] || statusConfig.pending;
    const shortOrderNum = order.order_number?.length > 20
        ? order.order_number.slice(0, 10) + '…' + order.order_number.slice(-6)
        : order.order_number;

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-outfit">
            <Header />

            <main className="flex-1 pb-12">
                <div className="container mx-auto px-4 max-w-4xl">

                    {/* ── BACK + TOP CTA ── */}
                    <div className="flex items-center justify-between py-5">
                        <Link
                            to="/account"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Orders
                        </Link>
                        <button
                            onClick={handleDownloadInvoice}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-600 border border-neutral-300 hover:border-black hover:text-black px-3 py-1.5 rounded-lg transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Invoice
                        </button>
                    </div>

                    {/* ── ORDER HEADER CARD ── */}
                    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-4">
                        <div className="p-5 pb-4">
                            {/* Order ID row */}
                            <div className="flex items-start justify-between gap-3 mb-1">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Order</p>
                                    <p className="text-sm font-mono font-bold text-neutral-900 break-all leading-snug">
                                        #{order.order_number}
                                    </p>
                                </div>
                                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.color}`}>
                                    {cfg.label}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-2">
                                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-neutral-100 px-5 py-5">
                            <OrderStatusStepper status={order.status} dates={{
                                pending:    order.created_at,
                                processing: order.updated_at,
                                shipped:    order.shipped_at || order.updated_at,
                                delivered:  order.delivered_at || order.updated_at
                            }} />
                        </div>

                        {/* Tracking */}
                        {order.tracking_number && (
                            <div className="border-t border-neutral-100 px-5 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                                        <Truck className="w-4 h-4 text-neutral-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Tracking</p>
                                        <p className="text-sm font-mono font-semibold text-neutral-900">{order.tracking_number}</p>
                                    </div>
                                </div>
                                {order.tracking_url && (
                                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                                        className="text-[11px] font-bold uppercase tracking-widest text-neutral-600 hover:text-black flex items-center gap-1 transition-colors">
                                        Track <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── ITEMS CARD ── */}
                    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-4">
                        <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
                            <Package className="w-4 h-4 text-neutral-500" />
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">
                                Items ({order.items?.length || 0})
                            </h2>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-5">
                                    {/* Thumbnail */}
                                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-neutral-50 rounded-xl overflow-hidden shrink-0 border border-neutral-100">
                                        <img
                                            src={item.product_image || item.image || '/placeholder.jpg'}
                                            alt={item.product_name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <Link to={`/products/${item.product_id}`}
                                                className="text-sm font-semibold text-neutral-900 line-clamp-2 hover:underline leading-snug">
                                                {item.product_name}
                                            </Link>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {item.size && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                                                        {item.size}
                                                    </span>
                                                )}
                                                {item.color && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <span className="w-2.5 h-2.5 rounded-full border border-neutral-200 shrink-0"
                                                            style={{ backgroundColor: getColorCode(item) }}
                                                        />
                                                        {item.color}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-xs text-neutral-400 font-medium">Qty {item.quantity}</span>
                                            <span className="text-sm font-bold text-neutral-900">
                                                ₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── BOTTOM ROW: Shipping + Payment (stack on mobile, side-by-side on md) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                        {/* Shipping */}
                        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-neutral-500" />
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">Shipping To</h3>
                            </div>
                            <div className="p-5 space-y-2">
                                <p className="font-semibold text-sm text-neutral-900">{order.shipping_address?.full_name}</p>
                                <p className="text-xs text-neutral-500 leading-relaxed">
                                    {order.shipping_address?.address_line1}
                                    {order.shipping_address?.address_line2 && <><br />{order.shipping_address.address_line2}</>}
                                    <br />{order.shipping_address?.city}, {order.shipping_address?.state} — {order.shipping_address?.postal_code}
                                    <br />{order.shipping_address?.country}
                                </p>
                                <div className="pt-3 border-t border-neutral-100 space-y-1.5">
                                    <p className="flex items-center gap-2 text-xs text-neutral-500">
                                        <Phone className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                                        {order.shipping_address?.phone}
                                    </p>
                                    <p className="flex items-center gap-2 text-xs text-neutral-500 min-w-0">
                                        <Mail className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                                        <span className="truncate">{order.shipping_address?.email}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-neutral-100">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">Payment Summary</h3>
                            </div>
                            <div className="p-5 space-y-2.5 text-sm">
                                <div className="flex justify-between text-neutral-500">
                                    <span>Subtotal</span>
                                    <span>₹{parseFloat(order.subtotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                </div>
                                <div className="flex justify-between text-neutral-500">
                                    <span>Shipping</span>
                                    <span>{parseFloat(order.shipping_cost) > 0 ? `₹${parseFloat(order.shipping_cost).toFixed(2)}` : <span className="text-emerald-600 font-semibold">Free</span>}</span>
                                </div>
                                <div className="flex justify-between text-neutral-500">
                                    <span>Tax (GST)</span>
                                    <span>₹{parseFloat(order.tax_amount).toFixed(2)}</span>
                                </div>
                                {parseFloat(order.discount) > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-medium">
                                        <span>Discount</span>
                                        <span>−₹{parseFloat(order.discount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t border-neutral-100 pt-3 mt-1 flex justify-between items-center">
                                    <span className="font-bold text-neutral-900">Total</span>
                                    <span className="font-bold text-neutral-900 text-base">₹{parseFloat(order.total).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                </div>
                            </div>
                            {/* Payment status chip */}
                            <div className="px-5 pb-5">
                                <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
                                    order.payment_status === 'paid'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'
                                }`}>
                                    {order.payment_status === 'paid'
                                        ? <CheckCircle className="w-3.5 h-3.5" />
                                        : <Clock className="w-3.5 h-3.5" />
                                    }
                                    Payment {order.payment_status || 'pending'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── CANCEL SECTION ── */}
                    {canCancel && (
                        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 mb-4">
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900">Need to cancel?</p>
                                    <p className="text-xs text-neutral-500 mt-1 mb-4 leading-relaxed">
                                        Cancellations are accepted before shipping. Refunds take 5–7 business days.
                                    </p>
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="text-xs font-bold uppercase tracking-widest text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Cancel Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── HELP ── */}
                    <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-5 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                                <HelpCircle className="w-4 h-4 text-neutral-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-neutral-900">Need Help?</p>
                                <p className="text-xs text-neutral-500 mt-0.5">Our team is here for you.</p>
                            </div>
                        </div>
                        <Link to="/contact" className="sm:ml-auto w-full sm:w-auto">
                            <button className="w-full sm:w-auto text-xs font-bold uppercase tracking-widest border border-neutral-300 hover:border-black hover:text-black text-neutral-600 px-5 py-2.5 rounded-xl transition-all">
                                Contact Support
                            </button>
                        </Link>
                    </div>

                </div>
            </main>

            <Footer />

            {/* ── CANCEL MODAL ── */}
            <AnimatePresence>
                {showCancelModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowCancelModal(false)}
                            className="fixed inset-0 bg-black/40 z-50"
                        />
                        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4">
                            <motion.div
                                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                                transition={{ type: 'spring', bounce: 0.15 }}
                                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
                            >
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-neutral-900">Cancel Order</h3>
                                        <p className="text-xs text-neutral-500 mt-1">This action cannot be undone.</p>
                                    </div>
                                </div>

                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                                    Reason
                                </label>
                                <select
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full p-3 text-sm rounded-xl border border-neutral-200 focus:border-black outline-none bg-white mb-5"
                                >
                                    <option value="">Select a reason…</option>
                                    <option value="Changed my mind">Changed my mind</option>
                                    <option value="Ordered by mistake">Ordered by mistake</option>
                                    <option value="Shipping costs too high">Shipping costs too high</option>
                                    <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                                    <option value="Other">Other</option>
                                </select>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        className="flex-1 py-2.5 rounded-xl text-sm text-neutral-600 font-semibold border border-neutral-200 hover:bg-neutral-50 transition-colors"
                                    >
                                        Keep Order
                                    </button>
                                    <button
                                        onClick={handleCancelOrder}
                                        disabled={cancelling || !cancelReason}
                                        className="flex-1 py-2.5 rounded-xl text-sm bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {cancelling ? 'Cancelling…' : 'Confirm'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
