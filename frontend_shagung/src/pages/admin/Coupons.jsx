import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tag, Plus, Edit, Trash2, Search, RefreshCw,
    X, Save, Percent, DollarSign, Calendar, Check, Ban
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';


// Coupon Form Modal
const CouponFormModal = ({ coupon, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        max_discount: '',
        min_order_amount: '',
        max_uses: '',
        is_active: true,
        ...coupon,
        starts_at: coupon?.starts_at ? coupon.starts_at.split('T')[0] : '',
        expires_at: coupon?.expires_at ? coupon.expires_at.split('T')[0] : '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
        setFormData(prev => ({ ...prev, code }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errs = {};
        if (!formData.code?.trim()) errs.code = 'Code is required';
        if (!formData.discount_value || formData.discount_value <= 0) errs.discount_value = 'Valid discount required';
        if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
            errs.discount_value = 'Percentage cannot exceed 100';
        }
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true);
        try {
            const data = {
                ...formData,
                discount_value: parseFloat(formData.discount_value),
                max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
                starts_at: formData.starts_at || null,
                expires_at: formData.expires_at || null,
            };

            if (coupon?.id) {
                await adminApi.updateCoupon(coupon.id, data);
            } else {
                await adminApi.createCoupon(data);
            }

            onSave();
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold">{coupon?.id ? 'Edit Coupon' : 'Create Coupon'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className={`flex-1 px-4 py-2 border rounded-lg ${errors.code ? 'border-red-500' : 'border-gray-200'}`}
                                placeholder="SUMMER20"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={generateCode}>
                                Generate
                            </Button>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            placeholder="20% off summer collection"
                        />
                    </div>

                    {/* Discount Type & Value */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                            <select
                                value={formData.discount_type}
                                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {formData.discount_type === 'percentage' ? '%' : '₹'}
                                </span>
                                <input
                                    type="number"
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                    className={`w-full pl-8 pr-4 py-2 border rounded-lg ${errors.discount_value ? 'border-red-500' : 'border-gray-200'}`}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Max Discount & Min Order */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                            <input
                                type="number"
                                value={formData.max_discount}
                                onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                placeholder="Optional"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                            <input
                                type="number"
                                value={formData.min_order_amount}
                                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                placeholder="Optional"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Max Uses */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                        <input
                            type="number"
                            value={formData.max_uses}
                            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            placeholder="Unlimited"
                            min="0"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={formData.starts_at}
                                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                            <input
                                type="date"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 text-primary rounded"
                        />
                        <span className="text-sm">Active</span>
                    </label>

                    {errors.submit && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errors.submit}</div>
                    )}
                </form>

                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} loading={saving} leftIcon={<Save className="w-4 h-4" />}>
                        {coupon?.id ? 'Update' : 'Create'}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

// Main Coupons Page
export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editCoupon, setEditCoupon] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [filters, setFilters] = useState({ status: '', page: 1 });

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getCoupons({ status: filters.status, page: filters.page });
            setCoupons(data.coupons || []);
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCoupons(); }, [filters]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this coupon?')) return;
        setDeleting(id);
        try {
            await adminApi.deleteCoupon(id);
            fetchCoupons();
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setDeleting(null);
        }
    };

    const handleToggle = async (id) => {
        try {
            await adminApi.toggleCoupon(id);
            fetchCoupons();
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
                        <p className="text-gray-500">Manage discount codes</p>
                    </div>
                    <Button onClick={() => { setEditCoupon(null); setShowForm(true); }} leftIcon={<Plus className="w-4 h-4" />}>
                        Create Coupon
                    </Button>
                </div>

                <Card className="p-4 mb-6" hover={false}>
                    <div className="flex gap-4">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2 border border-gray-200 rounded-lg"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <Button variant="outline" onClick={fetchCoupons}><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                </Card>

                <Card className="overflow-hidden" hover={false}>
                    {loading ? (
                        <div className="p-6 space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                    ) : coupons.length === 0 ? (
                        <div className="p-16 text-center">
                            <Tag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No coupons found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr className="text-left text-sm text-gray-500">
                                        <th className="py-3 px-4 font-medium">Code</th>
                                        <th className="py-3 px-4 font-medium">Discount</th>
                                        <th className="py-3 px-4 font-medium">Usage</th>
                                        <th className="py-3 px-4 font-medium">Validity</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map((coupon) => (
                                        <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                            <td className="py-3 px-4">
                                                <p className="font-mono font-bold text-primary">{coupon.code}</p>
                                                <p className="text-xs text-gray-500">{coupon.description || '-'}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-semibold">
                                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                                                </span>
                                                {coupon.max_discount && <p className="text-xs text-gray-500">Max: ₹{coupon.max_discount}</p>}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span>{coupon.uses_count || 0}</span>
                                                {coupon.max_uses && <span className="text-gray-400">/{coupon.max_uses}</span>}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {coupon.expires_at ? (
                                                    <span className={new Date(coupon.expires_at) < new Date() ? 'text-red-500' : ''}>
                                                        {new Date(coupon.expires_at).toLocaleDateString('en-IN')}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">No expiry</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={coupon.status === 'active' ? 'success' : coupon.status === 'expired' ? 'destructive' : 'ghost'}>
                                                    {coupon.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleToggle(coupon.id)} className={`p-2 rounded-lg ${coupon.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                                                        {coupon.is_active ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => { setEditCoupon(coupon); setShowForm(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(coupon.id)} disabled={deleting === coupon.id} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                                                        {deleting === coupon.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            <AnimatePresence>
                {showForm && (
                    <CouponFormModal
                        coupon={editCoupon}
                        onClose={() => { setShowForm(false); setEditCoupon(null); }}
                        onSave={() => { setShowForm(false); setEditCoupon(null); fetchCoupons(); }}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
