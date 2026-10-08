import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Users, DollarSign, TrendingUp, Clock,
    CheckCircle, Truck, XCircle, RefreshCw, Eye,
    ChevronDown, Filter, Search, MoreVertical,
    Calendar, ArrowUpRight, ArrowDownRight, Settings
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';

// Stats Card Component
const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
    <Card className="p-6" hover>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {change && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{change}</span>
                    </div>
                )}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </Card>
);

// Order Status Badge
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

// Analytics Section
const AnalyticsSection = ({ analytics, loading }) => {
    if (loading) return <Skeleton className="h-64 w-full" />;
    if (!analytics) return null;

    const maxRevenue = Math.max(...(analytics.revenueByDay?.map(d => parseFloat(d.revenue)) || [0]), 1);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <Card className="p-6" hover={false}>
                <h3 className="text-lg font-bold mb-6">Revenue Trend (30 Days)</h3>
                <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto pb-4">
                    {analytics.revenueByDay?.map((day, i) => {
                        const height = (parseFloat(day.revenue) / maxRevenue) * 100;
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 group min-w-[30px]">
                                <div
                                    className="w-full bg-primary/20 hover:bg-primary rounded-t-sm transition-all relative group-hover:shadow-lg"
                                    style={{ height: `${height}%`, minHeight: '4px' }}
                                >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        ₹{parseFloat(day.revenue).toLocaleString()}
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400 rotate-45 origin-left translate-y-2">
                                    {new Date(day.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Top Products */}
            <Card className="p-0 overflow-hidden" hover={false}>
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold">Top Selling Products</h3>
                </div>
                <div className="overflow-y-auto max-h-[300px]">
                    {analytics.topProducts?.map((p, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 border-b last:border-0">
                            <span className="w-6 text-center text-gray-400 font-bold">{i + 1}</span>
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                <img src={p.image || '/placeholder.jpg'} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{p.name}</p>
                                <p className="text-xs text-gray-500">{p.sold} sold</p>
                            </div>
                            <span className="font-semibold text-green-600">₹{parseFloat(p.revenue).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

// Order Row Component
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

import AdminLayout from './AdminLayout';
import { useToast } from '../../components/ToastContext';

// ... (StatCard, OrderStatusBadge, AnalyticsSection, OrderRow components remain unchanged)

// Database Stats Card
const DatabaseStatsCard = ({ dbStats }) => {
    if (!dbStats) return null;

    return (
        <Card className="p-6 mb-6" hover={false}>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5" /> Database Statistics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{dbStats.counts?.products || 0}</p>
                    <p className="text-xs text-gray-500">Products</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{dbStats.counts?.orders || 0}</p>
                    <p className="text-xs text-gray-500">Orders</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{dbStats.counts?.users || 0}</p>
                    <p className="text-xs text-gray-500">Users</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{dbStats.counts?.categories || 0}</p>
                    <p className="text-xs text-gray-500">Categories</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-pink-600">{dbStats.counts?.reviews || 0}</p>
                    <p className="text-xs text-gray-500">Reviews</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-600">{dbStats.counts?.images || 0}</p>
                    <p className="text-xs text-gray-500">Images</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-indigo-600">{dbStats.counts?.coupons || 0}</p>
                    <p className="text-xs text-gray-500">Coupons</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-teal-600">{dbStats.counts?.subscribers || 0}</p>
                    <p className="text-xs text-gray-500">Subscribers</p>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div>
                    <p className="text-sm text-gray-600">Database Size (Neon)</p>
                    <p className="text-2xl font-bold text-indigo-600">{dbStats.size || 'N/A'}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">Tables</p>
                    <p className="text-lg font-semibold">{dbStats.tables?.length || 0} tables</p>
                </div>
            </div>
        </Card>
    );
};

// Cache Management Card
const CacheManagementCard = ({ onClearCache, clearing }) => (
    <Card className="p-6 mb-8 border-red-100" hover={false}>
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-bold flex items-center gap-2 text-red-600">
                    <RefreshCw className="w-5 h-5" /> Cache Management
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Clear cached data to refresh all product listings, categories, and other content.
                    This may temporarily slow down the website.
                </p>
            </div>
            <Button
                onClick={onClearCache}
                loading={clearing}
                variant="destructive"
                size="sm"
                className="shrink-0 ml-4"
            >
                <RefreshCw className="w-4 h-4 mr-2" /> Clear All Cache
            </Button>
        </div>
    </Card>
);


// Main Admin Dashboard
export default function AdminDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [dbStats, setDbStats] = useState(null);
    const [clearing, setClearing] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        page: 1,
    });
    const [pagination, setPagination] = useState({});

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { page: filters.page };
            if (filters.status) params.status = filters.status;
            if (filters.search) params.search = filters.search;

            // In parallel fetch orders, dashboard stats, and database stats
            const [ordersData, statsData, dbData] = await Promise.all([
                adminApi.getOrders(params),
                adminApi.getStats(),
                adminApi.getDatabaseStats().catch(() => null)
            ]);

            setOrders(ordersData.orders || []);
            setPagination(ordersData.pagination || {});

            if (statsData) {
                setAnalytics(statsData);
            }

            if (dbData?.database) {
                setDbStats(dbData.database);
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Clear cache handler
    const handleClearCache = async () => {
        if (!confirm('⚠️ IMPORTANT: This will clear all cached data.\n\nThis may temporarily slow down the website as caches are rebuilt.\n\nAre you sure you want to continue?')) {
            return;
        }

        setClearing(true);
        try {
            await adminApi.clearCache();
            showToast('Cache cleared successfully', 'success');
        } catch (error) {
            showToast('Failed to clear cache: ' + error.message, 'error');
        } finally {
            setClearing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters.status, filters.page]);

    // Update order status
    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await adminApi.updateOrderStatus(orderId, { status: newStatus });
            fetchData();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData();
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Stats Grid - Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                    <StatCard
                        title="Total Orders"
                        value={analytics?.summary?.total_orders || dbStats?.counts?.orders || 0}
                        icon={Package}
                        color="bg-gradient-to-br from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`₹${parseFloat(analytics?.summary?.total_revenue || 0).toLocaleString('en-IN')}`}
                        trend="up"
                        icon={DollarSign}
                        color="bg-gradient-to-br from-green-500 to-emerald-600"
                    />
                    <StatCard
                        title="Total Customers"
                        value={analytics?.summary?.new_customers || dbStats?.counts?.users || 0}
                        icon={Users}
                        color="bg-gradient-to-br from-purple-500 to-purple-600"
                    />
                    <StatCard
                        title="Avg Order Value"
                        value={`₹${parseFloat(analytics?.summary?.avg_order_value || 0).toFixed(0)}`}
                        icon={TrendingUp}
                        color="bg-gradient-to-br from-amber-500 to-orange-600"
                    />
                </div>

                {/* Stats Grid - Row 2: Order Status Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <Card className="p-4 text-center border-l-4 border-yellow-400" hover={false}>
                        <Clock className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold text-yellow-600">{analytics?.ordersByStatus?.pending || 0}</p>
                        <p className="text-xs text-gray-500">Pending</p>
                    </Card>
                    <Card className="p-4 text-center border-l-4 border-blue-400" hover={false}>
                        <CheckCircle className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                        <p className="text-2xl font-bold text-blue-600">{analytics?.ordersByStatus?.confirmed || 0}</p>
                        <p className="text-xs text-gray-500">Confirmed</p>
                    </Card>
                    <Card className="p-4 text-center border-l-4 border-purple-400" hover={false}>
                        <RefreshCw className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                        <p className="text-2xl font-bold text-purple-600">{analytics?.ordersByStatus?.processing || 0}</p>
                        <p className="text-xs text-gray-500">Processing</p>
                    </Card>
                    <Card className="p-4 text-center border-l-4 border-cyan-400" hover={false}>
                        <Truck className="w-6 h-6 mx-auto text-cyan-500 mb-2" />
                        <p className="text-2xl font-bold text-cyan-600">{analytics?.ordersByStatus?.shipped || 0}</p>
                        <p className="text-xs text-gray-500">Shipped</p>
                    </Card>
                    <Card className="p-4 text-center border-l-4 border-green-400" hover={false}>
                        <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold text-green-600">{analytics?.ordersByStatus?.delivered || 0}</p>
                        <p className="text-xs text-gray-500">Delivered</p>
                    </Card>
                    <Card className="p-4 text-center border-l-4 border-red-400" hover={false}>
                        <XCircle className="w-6 h-6 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold text-red-600">{analytics?.ordersByStatus?.cancelled || 0}</p>
                        <p className="text-xs text-gray-500">Cancelled</p>
                    </Card>
                </div>

                {/* Analytics Section */}
                <AnalyticsSection analytics={analytics} loading={loading && !analytics} />

                {/* Database Statistics */}
                <DatabaseStatsCard dbStats={dbStats} />

                {/* Orders Table */}
                <Card className="overflow-hidden" hover={false}>
                    {/* ... (Existing table code unchanged, just reusing) ... */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold">Recent Orders</h2>
                            {/* ... Search and Filters ... */}
                            <div className="flex flex-wrap items-center gap-3">
                                <form onSubmit={handleSearch} className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        placeholder="Search orders..."
                                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary w-48"
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
                                <Button onClick={fetchData} variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {loading && !orders.length ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
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
                                Page {pagination.page} of {pagination.totalPages}
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
