import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Clock, CheckCircle, Truck, XCircle, RefreshCw, Eye,
    Filter, Search, MoreVertical, Settings
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';

// Order Status Badge (Reused)
const OrderStatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { label: 'Pending', variant: 'warning', icon: Clock },
        confirmed: { label: 'Confirmed', variant: 'primary', icon: CheckCircle },
        processing: { label: 'Processing', variant: 'secondary', icon: RefreshCw },
        shipped: { label: 'Shipped', variant: 'outline', icon: Truck },
        delivered: { label: 'Delivered', variant: 'success', icon: CheckCircle },
        cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
        refunded: { label: 'Refunded', variant: 'ghost', icon: RefreshCw },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="gap-1">
            <Icon className="w-3 h-3" />
            {config.label}
        </Badge>
    );
};

// Order Row Component (Reused)
const OrderRow = ({ order, onUpdateStatus, onViewDetails }) => {
    const [showActions, setShowActions] = useState(false);

    return (
        <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
        >
            <td className="py-4 px-4">
                <Link to={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                    {order.order_number}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                    })}
                </p>
            </td>
            <td className="py-4 px-4">
                <p className="font-medium">{order.shipping_address?.full_name || 'Guest'}</p>
                <p className="text-xs text-gray-500">{order.shipping_address?.email}</p>
            </td>
            <td className="py-4 px-4">
                <span className="font-semibold">₹{parseFloat(order.total).toFixed(2)}</span>
                <p className="text-xs text-gray-500">{order.items_count || order.item_count} items</p>
            </td>
            <td className="py-4 px-4">
                <OrderStatusBadge status={order.status} />
            </td>
            <td className="py-4 px-4">
                <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'} size="sm">
                    {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                </Badge>
            </td>
            <td className="py-4 px-4 relative">
                <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>

                <AnimatePresence>
                    {showActions && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-4 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10 min-w-[180px]"
                        >
                            <button
                                onClick={() => { onViewDetails(order); setShowActions(false); }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Eye className="w-4 h-4" /> View Details
                            </button>
                            {order.status === 'pending' && (
                                <button
                                    onClick={() => { onUpdateStatus(order.id, 'confirmed'); setShowActions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                >
                                    <CheckCircle className="w-4 h-4" /> Confirm Order
                                </button>
                            )}
                            {order.status === 'confirmed' && (
                                <button
                                    onClick={() => { onUpdateStatus(order.id, 'processing'); setShowActions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Start Processing
                                </button>
                            )}
                            {order.status === 'processing' && (
                                <button
                                    onClick={() => { onUpdateStatus(order.id, 'shipped'); setShowActions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                                >
                                    <Truck className="w-4 h-4" /> Mark Shipped
                                </button>
                            )}
                            {order.status === 'shipped' && (
                                <button
                                    onClick={() => { onUpdateStatus(order.id, 'delivered'); setShowActions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                >
                                    <CheckCircle className="w-4 h-4" /> Mark Delivered
                                </button>
                            )}
                            {!['cancelled', 'delivered', 'refunded'].includes(order.status) && (
                                <button
                                    onClick={() => { onUpdateStatus(order.id, 'cancelled'); setShowActions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                >
                                    <XCircle className="w-4 h-4" /> Cancel Order
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </td>
        </motion.tr>
    );
};

export default function AdminOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        page: 1,
    });
    const [pagination, setPagination] = useState({});

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = { page: filters.page };
            if (filters.status) params.status = filters.status;
            if (filters.search) params.search = filters.search;

            const data = await adminApi.getOrders(params);
            setOrders(data.orders || []);
            setPagination(data.pagination || {});
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [filters.status, filters.page]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await adminApi.updateOrderStatus(orderId, { status: newStatus });
            fetchOrders();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchOrders();
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                        <p className="text-gray-500">Manage customer orders</p>
                    </div>
                </div>

                <Card className="overflow-hidden" hover={false}>
                    {/* Filters Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3 w-full">
                                <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        placeholder="Search order #, customer, email..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </form>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <Button onClick={fetchOrders} variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />}>
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="p-16 text-center">
                                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">No orders found</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-sm text-gray-500">
                                        <th className="py-3 px-4 font-medium">Order</th>
                                        <th className="py-3 px-4 font-medium">Customer</th>
                                        <th className="py-3 px-4 font-medium">Amount</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Payment</th>
                                        <th className="py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <OrderRow
                                            key={order.id}
                                            order={order}
                                            onUpdateStatus={handleUpdateStatus}
                                            onViewDetails={(o) => navigate(`/admin/orders/${o.id}`)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} orders)
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page <= 1}
                                    variant="outline"
                                    size="sm"
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page >= pagination.totalPages}
                                    variant="outline"
                                    size="sm"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
