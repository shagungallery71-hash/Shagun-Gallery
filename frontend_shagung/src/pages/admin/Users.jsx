import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Search, Shield, ShieldCheck, ShieldOff,
    UserCheck, UserX, Calendar, RefreshCw, Mail,
    Phone, ShoppingCart, DollarSign, Crown, UserCog
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';
import { useToast } from '../../components/ToastContext';

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className="p-5" hover>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </Card>
);

// User Row Component
const UserRow = ({ user, onToggleVerify, onUpdateRole, loading }) => {
    const [showRoleMenu, setShowRoleMenu] = useState(false);

    return (
        <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
        >
            {/* User Info */}
            <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${user.role === 'admin'
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                        : 'bg-gradient-to-br from-pink-500 to-rose-600'
                        }`}>
                        {user.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <p className="font-medium">{user.username || 'No Username'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                </div>
            </td>

            {/* Role */}
            <td className="py-4 px-4">
                <div className="relative">
                    <button
                        onClick={() => setShowRoleMenu(!showRoleMenu)}
                        disabled={loading}
                        className="focus:outline-none"
                    >
                        {user.role === 'admin' ? (
                            <Badge variant="primary" className="gap-1 cursor-pointer hover:opacity-80">
                                <Crown className="w-3 h-3" /> Admin
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="gap-1 cursor-pointer hover:opacity-80">
                                <Users className="w-3 h-3" /> Customer
                            </Badge>
                        )}
                    </button>

                    {showRoleMenu && (
                        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
                            <button
                                onClick={() => { onUpdateRole(user.id, 'customer'); setShowRoleMenu(false); }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Users className="w-4 h-4 text-gray-500" /> Customer
                            </button>
                            <button
                                onClick={() => { onUpdateRole(user.id, 'admin'); setShowRoleMenu(false); }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Crown className="w-4 h-4 text-purple-500" /> Admin
                            </button>
                        </div>
                    )}
                </div>
            </td>

            {/* Verified Status */}
            <td className="py-4 px-4">
                <button
                    onClick={() => onToggleVerify(user.id, !user.is_verified)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${user.is_verified
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                >
                    {user.is_verified ? (
                        <>
                            <ShieldCheck className="w-4 h-4" /> Verified
                        </>
                    ) : (
                        <>
                            <ShieldOff className="w-4 h-4" /> Unverified
                        </>
                    )}
                </button>
            </td>

            {/* Orders & Spent */}
            <td className="py-4 px-4 text-center">
                <span className="font-semibold">{user.order_count || 0}</span>
            </td>
            <td className="py-4 px-4 text-center">
                <span className="font-semibold text-green-600">
                    ₹{parseFloat(user.total_spent || 0).toLocaleString('en-IN')}
                </span>
            </td>

            {/* Joined Date */}
            <td className="py-4 px-4 text-sm text-gray-500">
                {new Date(user.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                })}
            </td>
        </motion.tr>
    );
};

// Main Users Management Page
export default function AdminUsers() {
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        verified: '',
        page: 1,
    });
    const [pagination, setPagination] = useState({});

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { page: filters.page };
            if (filters.search) params.search = filters.search;
            if (filters.role) params.role = filters.role;
            if (filters.verified) params.verified = filters.verified;

            const data = await adminApi.getUsers(params);
            setUsers(data.users || []);
            setStats(data.stats || null);
            setPagination(data.pagination || {});
        } catch (error) {
            console.error('Failed to fetch users:', error);
            showToast('Failed to load users', 'error');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filters.page, filters.role, filters.verified]);

    // Toggle user verified status
    const handleToggleVerify = async (userId, newStatus) => {
        setActionLoading(true);
        try {
            await adminApi.toggleUserVerified(userId, newStatus);
            showToast(newStatus ? 'User verified' : 'User unverified', 'success');
            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, is_verified: newStatus } : u));
        } catch (error) {
            showToast('Failed to update user: ' + error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Update user role
    const handleUpdateRole = async (userId, newRole) => {
        setActionLoading(true);
        try {
            await adminApi.updateUserRole(userId, newRole);
            showToast(`User role updated to ${newRole}`, 'success');
            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            showToast('Failed to update role: ' + error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <UserCog className="w-7 h-7 text-primary" />
                            User Management
                        </h1>
                        <p className="text-gray-500">Manage all users, admins and customers</p>
                    </div>
                    <Button variant="outline" onClick={fetchUsers} leftIcon={<RefreshCw className="w-4 h-4" />}>
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <StatCard
                            title="Total Users"
                            value={stats.total}
                            icon={Users}
                            color="bg-gradient-to-br from-blue-500 to-blue-600"
                        />
                        <StatCard
                            title="Admins"
                            value={stats.admins}
                            icon={Crown}
                            color="bg-gradient-to-br from-purple-500 to-indigo-600"
                        />
                        <StatCard
                            title="Customers"
                            value={stats.customers}
                            icon={ShoppingCart}
                            color="bg-gradient-to-br from-pink-500 to-rose-600"
                        />
                        <StatCard
                            title="Verified"
                            value={stats.verified}
                            icon={ShieldCheck}
                            color="bg-gradient-to-br from-green-500 to-emerald-600"
                        />
                        <StatCard
                            title="Unverified"
                            value={stats.unverified}
                            icon={ShieldOff}
                            color="bg-gradient-to-br from-amber-500 to-orange-600"
                        />
                        <StatCard
                            title="New (30 days)"
                            value={stats.newLast30Days}
                            icon={Calendar}
                            color="bg-gradient-to-br from-cyan-500 to-teal-600"
                        />
                    </div>
                )}

                {/* Search & Filters */}
                <Card className="p-4 mb-6" hover={false}>
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Search by username or email..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-200 rounded-lg"
                        >
                            <option value="">All Roles</option>
                            <option value="admin">Admins Only</option>
                            <option value="customer">Customers Only</option>
                        </select>
                        <select
                            value={filters.verified}
                            onChange={(e) => setFilters({ ...filters, verified: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-200 rounded-lg"
                        >
                            <option value="">All Status</option>
                            <option value="true">Verified</option>
                            <option value="false">Unverified</option>
                        </select>
                        <Button type="submit">Search</Button>
                    </form>
                </Card>

                {/* Users Table */}
                <Card className="overflow-hidden" hover={false}>
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-16 text-center">
                            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No users found</p>
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr className="text-left text-sm text-gray-500">
                                        <th className="py-3 px-4 font-medium">User</th>
                                        <th className="py-3 px-4 font-medium">Role</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium text-center">Orders</th>
                                        <th className="py-3 px-4 font-medium text-center">Spent</th>
                                        <th className="py-3 px-4 font-medium">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <UserRow
                                            key={user.id}
                                            user={user}
                                            onToggleVerify={handleToggleVerify}
                                            onUpdateRole={handleUpdateRole}
                                            loading={actionLoading}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} users)
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
