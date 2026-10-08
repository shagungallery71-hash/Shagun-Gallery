import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Truck, CheckCircle, Clock, XCircle, ChevronDown,
  RefreshCw, Eye, AlertTriangle, ShoppingBag, MapPin,
  CreditCard, Hash, Layers, ArrowRight, X, Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:    { label: 'Pending',    color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200', dot: 'bg-amber-400',  icon: Clock },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',  dot: 'bg-blue-400',   icon: CheckCircle },
  processing: { label: 'Processing', color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-200',dot: 'bg-violet-400', icon: RefreshCw },
  shipped:    { label: 'Shipped',    color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200',dot: 'bg-indigo-400', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200',dot:'bg-emerald-400',icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'text-rose-500',   bg: 'bg-rose-50',    border: 'border-rose-200',  dot: 'bg-rose-400',   icon: XCircle },
};

const STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'delivered'];

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${s.color} ${s.bg} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

function StatusTracker({ status }) {
  if (status === 'cancelled') return null;
  const curr = STATUS_STEPS.indexOf(status);
  if (curr < 0 && status !== 'pending') return null;
  const activeIdx = status === 'pending' ? -1 : curr;

  return (
    <div className="mt-5 pt-5 border-t border-neutral-100">
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= activeIdx;
          const active = i === activeIdx;
          const s = STATUS[step];
          const Icon = s.icon;
          return (
            <div key={step} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  done ? `${s.bg} ${s.border} ${s.color}` : 'bg-neutral-100 border-neutral-200 text-neutral-300'
                } ${active ? 'shadow-md scale-110' : ''}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${done ? s.color : 'text-neutral-300'}`}>
                  {s.label}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-all duration-500 ${i < activeIdx ? 'bg-emerald-300' : 'bg-neutral-100'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onCancel, index }) {
  const [open, setOpen] = useState(false);
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
  const firstImage = order.items?.[0]?.image || order.items?.[0]?.product_image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:border-neutral-300 hover:shadow-lg transition-all duration-300"
    >
      {/* Card Header — always visible */}
      <button
        className="w-full text-left p-5 md:p-6"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start gap-4">
          {/* Product thumbnail OR icon */}
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-100 ring-1 ring-neutral-200">
            {firstImage
              ? <img src={firstImage} alt="" className="w-full h-full object-cover object-top" />
              : <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-neutral-300" />
                </div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                <Hash className="w-3 h-3" />{order.order_number}
              </span>
              <span className="text-neutral-200">·</span>
              <span className="text-[10px] text-neutral-400 font-medium">{date}</span>
              <span className="text-neutral-200">·</span>
              <span className="text-[10px] text-neutral-400 font-medium">{order.items?.length || order.item_count || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
            </div>

            {/* Item names preview */}
            <p className="text-sm font-semibold text-neutral-800 line-clamp-1 mb-2">
              {order.items?.map(i => i.product_name).join(', ') || 'Order Items'}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.status} />
              <span className="text-base font-black text-neutral-900">₹{parseFloat(order.total).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Chevron */}
          <div className={`shrink-0 w-8 h-8 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>
        </div>

        {/* Status tracker — compact on header */}
        {!open && <StatusTracker status={order.status} />}
      </button>

      {/* Expanded section */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-100">
              {/* Status Tracker */}
              <div className="px-5 md:px-6 pb-5">
                <StatusTracker status={order.status} />
              </div>

              {/* Items */}
              <div className="px-5 md:px-6 pb-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <Layers className="w-3 h-3" /> Items in this Order
                </p>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-neutral-50 rounded-xl">
                    <div className="w-14 h-16 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
                      <img
                        src={item.image || item.product_image || '/placeholder.jpg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover object-top"
                        onError={e => e.target.style.display = 'none'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-neutral-900 line-clamp-2 mb-1">{item.product_name}</p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500 mb-1.5">
                        {item.size && <span className="bg-white border border-neutral-200 px-2 py-0.5 rounded-full font-medium">Size: {item.size}</span>}
                        {item.color && (
                          <span className="bg-white border border-neutral-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full border border-neutral-300" style={{ backgroundColor: item.color_code || '#9ca3af' }} />
                            {item.color}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">
                        ₹{parseFloat(item.price).toLocaleString('en-IN')} × {item.quantity}
                        <span className="font-bold text-neutral-800 ml-1">= ₹{parseFloat(item.total).toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary grid */}
              <div className="mx-5 md:mx-6 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                {/* Shipping */}
                {order.shipping_address && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" /> Delivery Address
                    </p>
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      <span className="font-semibold">{order.shipping_address.full_name}</span><br />
                      {order.shipping_address.address_line1}<br />
                      {order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.postal_code}
                    </p>
                  </div>
                )}

                {/* Payment */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1 mb-2">
                    <CreditCard className="w-3 h-3" /> Payment
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    order.payment_status === 'paid'
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                      : 'text-amber-600 bg-amber-50 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${order.payment_status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                  {order.tracking_number && (
                    <div className="mt-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Tracking ID</p>
                      <p className="text-sm font-mono font-semibold text-neutral-700">{order.tracking_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order total */}
              <div className="mx-5 md:mx-6 mb-5 flex justify-between items-center py-3 border-y border-dashed border-neutral-200">
                <span className="text-sm text-neutral-500 font-medium">Order Total</span>
                <span className="text-xl font-black text-neutral-900">₹{parseFloat(order.total).toLocaleString('en-IN')}</span>
              </div>

              {/* Actions */}
              <div className="px-5 md:px-6 pb-5 flex flex-wrap gap-2">
                <Link to={`/order/${order.id}`}
                  className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View Details
                </Link>
                {order.tracking_url && (
                  <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors">
                    <Truck className="w-3.5 h-3.5" /> Track Package
                  </a>
                )}
                {canCancel && (
                  <button onClick={() => onCancel(order)}
                    className="inline-flex items-center gap-2 border border-rose-200 hover:bg-rose-50 text-rose-500 font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors ml-auto">
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Shipping costs too high',
  'Item price too high',
  'Found a better price elsewhere',
  'Other',
];

function CancelModal({ order, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-neutral-900 text-base">Cancel Order #{order?.order_number}</h3>
            <p className="text-rose-600 text-xs mt-0.5">This action cannot be undone.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-rose-100 transition-colors">
            <X className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-3">Reason for Cancellation</label>
            <div className="grid grid-cols-1 gap-2">
              {CANCEL_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    reason === r
                      ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-sm hover:bg-neutral-50 transition-colors">
              Keep Order
            </button>
            <button onClick={() => onConfirm(reason)} disabled={!reason || loading}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling…</> : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function UserOrders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [pagination, setPagination] = useState({});
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = async (showRefreshAnim = false) => {
    if (showRefreshAnim) setRefreshing(true);
    else setLoading(true);
    try {
      const params = { page: filters.page };
      if (filters.status) params.status = filters.status;
      const data = await api.getUserOrders(params);
      setOrders(data.orders || []);
      setPagination(data.pagination || {});
    } catch {
      showToast('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [filters.status, filters.page]);

  const confirmCancel = async (reason) => {
    if (!reason) { showToast('Please select a reason', 'error'); return; }
    setCancelling(true);
    try {
      await api.cancelOrder(cancelOrder.id, reason);
      showToast('Order cancelled successfully', 'success');
      setCancelOrder(null);
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-neutral-50 font-outfit">
        {/* Hero strip */}
        <div className="bg-white border-b border-neutral-100 pt-24 pb-6">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium mb-2 uppercase tracking-widest">
                  <Link to="/" className="hover:text-neutral-600 transition-colors">Home</Link>
                  <span>›</span>
                  <span className="text-neutral-600">My Orders</span>
                </div>
                <h1 className="font-playfair text-3xl md:text-4xl font-bold text-neutral-900">My Orders</h1>
                <p className="text-neutral-400 text-sm mt-1">
                  {!loading && orders.length > 0 ? `${pagination.total || orders.length} orders found` : 'Track and manage your purchases'}
                </p>
              </div>
              <button
                onClick={() => fetchOrders(true)}
                className={`hidden sm:flex items-center gap-2 border border-neutral-200 hover:border-neutral-300 bg-white text-neutral-600 font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all ${refreshing ? 'opacity-70' : ''}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2 flex-wrap mt-5">
              {STATUS_FILTERS.map(f => (
                <button key={f.value} onClick={() => setFilters({ status: f.value, page: 1 })}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                    filters.status === f.value
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="container mx-auto px-4 max-w-4xl py-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-5 md:p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-neutral-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-neutral-100 rounded w-32" />
                      <div className="h-4 bg-neutral-100 rounded w-3/4" />
                      <div className="h-6 bg-neutral-100 rounded w-28" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-neutral-200 p-12 md:p-20 text-center">
              <div className="w-20 h-20 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <ShoppingBag className="w-9 h-9 text-neutral-300" />
              </div>
              <h2 className="font-playfair text-2xl font-bold text-neutral-800 mb-2">No orders yet</h2>
              <p className="text-neutral-400 text-sm mb-8 max-w-xs mx-auto">
                {filters.status ? `No ${filters.status} orders found.` : 'Discover our collections and place your first order.'}
              </p>
              <Link to="/products"
                className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-xl transition-colors">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => (
                <OrderCard key={order.id} order={order} index={i} onCancel={setCancelOrder} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-sm hover:border-neutral-300 disabled:opacity-40 transition-all"
              >
                ← Previous
              </button>
              <span className="text-neutral-400 text-sm font-medium px-2">
                Page <strong className="text-neutral-800">{pagination.page}</strong> of {pagination.totalPages}
              </span>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= pagination.totalPages}
                className="px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-sm hover:border-neutral-300 disabled:opacity-40 transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelOrder && (
          <CancelModal
            order={cancelOrder}
            onClose={() => setCancelOrder(null)}
            onConfirm={confirmCancel}
            loading={cancelling}
          />
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
