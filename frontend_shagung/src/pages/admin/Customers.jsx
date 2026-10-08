import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Search, Mail, Phone, MapPin, ShoppingCart,
    Calendar, MoreVertical, Eye, Ban, Check, RefreshCw,
    DollarSign, Package, Download, ArrowUpDown
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';

// Customer Detail Modal
const CustomerDetailModal = ({ customer, onClose }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomerDetails = async () => {
            setLoading(true);
            try {
                const data = await adminApi.getCustomer(customer.id);
                if (data.success && data.customer) {
                    setOrders(data.customer.recent_orders || []);
                }
            } catch (error) {
                console.error('Failed to fetch customer details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (customer?.id) {
            fetchCustomerDetails();
        }
    }, [customer.id]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold">Customer Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {customer.name?.charAt(0) || customer.email?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{customer.name || 'Unknown'}</h3>
                            <p className="text-gray-500">{customer.email}</p>
                            <div className="flex gap-2 mt-1">
                                {customer.is_verified && <Badge variant="success" size="sm">Verified</Badge>}
                                {customer.role === 'admin' && <Badge variant="primary" size="sm">Admin</Badge>}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-primary">{customer.order_count || 0}</p>
                            <p className="text-xs text-gray-500">Orders</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">₹{customer.total_spent || 0}</p>
                            <p className="text-xs text-gray-500">Total Spent</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">{customer.wishlist_count || 0}</p>
                            <p className="text-xs text-gray-500">Wishlist</p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                        <h4 className="font-semibold">Contact Information</h4>
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{customer.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Joined {new Date(customer.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div>
                        <h4 className="font-semibold mb-3">Recent Orders</h4>
                        {loading ? (
                            <Skeleton className="h-20 w-full" />
                        ) : orders.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg">
                                No orders yet
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {orders.slice(0, 5).map(order => (
                                    <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">#{order.order_number}</p>
                                            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">₹{order.total}</p>
                                            <Badge variant={order.status === 'delivered' ? 'success' : 'outline'} size="sm">
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    <Button variant="outline" leftIcon={<Mail className="w-4 h-4" />}>
                        Send Email
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

// Main Customers Page
export default function AdminCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
    });
    const [pagination, setPagination] = useState({});

    // Fetch customers
    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getCustomers({ page: filters.page, search: filters.search });
            let customersList = data.customers || [];

            // Sort by joining date
            customersList = customersList.sort((a, b) => {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });

            setCustomers(customersList);
            setPagination(data.pagination || {});
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [filters.page, sortOrder]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        fetchCustomers();
    };

    // Download customers as CSV
    const downloadCSV = () => {
        if (customers.length === 0) return;

        // Create CSV content with name and email
        const csvHeader = 'Name,Email,Joined Date\n';
        const csvData = customers.map(c => {
            const name = (c.name || c.username || 'Unknown').replace(/,/g, ' ');
            const email = c.email || '';
            const joinedDate = new Date(c.created_at).toLocaleDateString('en-IN');
            return `"${name}","${email}","${joinedDate}"`;
        }).join('\n');

        const csvContent = csvHeader + csvData;

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Toggle sort order
    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
    };

    return (
        <AdminLayout>
            <div className="p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Customers</h1>
                        <p className="text-sm text-gray-500">Manage your customer base ({pagination.totalCount || 0} total)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={toggleSortOrder}
                            size="sm"
                            leftIcon={<ArrowUpDown className="w-4 h-4" />}
                        >
                            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={downloadCSV}
                            size="sm"
                            leftIcon={<Download className="w-4 h-4" />}
                            disabled={customers.length === 0}
                        >
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={fetchCustomers} size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <Card className="p-3 md:p-4 mb-4 md:mb-6" hover={false}>
                    <form onSubmit={handleSearch} className="flex gap-2 md:gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg"
                            />
                        </div>
                        <Button type="submit" size="sm">Search</Button>
                    </form>
                </Card>

                {/* Customers Table */}
                <Card className="overflow-hidden" hover={false}>
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-16 text-center">
                            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No customers found</p>
                            <p className="text-sm text-gray-400 mt-1">Customers will appear here once they register</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr className="text-left text-sm text-gray-500">
                                        <th className="py-3 px-4 font-medium">Customer</th>
                                        <th className="py-3 px-4 font-medium">Contact</th>
                                        <th className="py-3 px-4 font-medium text-center">Orders</th>
                                        <th className="py-3 px-4 font-medium text-center">Spent</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Joined</th>
                                        <th className="py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((customer) => (
                                        <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-primary font-semibold">
                                                        {customer.name?.charAt(0) || customer.email?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{customer.name || 'No Name'}</p>
                                                        <p className="text-xs text-gray-500">ID: {customer.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm">{customer.email}</p>
                                                {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="outline">{customer.order_count || 0}</Badge>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-semibold text-green-600">₹{customer.total_spent || 0}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {customer.is_verified ? (
                                                        <Badge variant="success" size="sm"><Check className="w-3 h-3" /></Badge>
                                                    ) : (
                                                        <Badge variant="warning" size="sm">Unverified</Badge>
                                                    )}
                                                    {customer.role === 'admin' && <Badge variant="primary" size="sm">Admin</Badge>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-500">
                                                {new Date(customer.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => setSelectedCustomer(customer)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} customers)
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

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <CustomerDetailModal
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                />
            )}
        </AdminLayout>
    );
}
