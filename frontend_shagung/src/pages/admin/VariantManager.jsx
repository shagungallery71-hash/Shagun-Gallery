// =============================================================================
// VARIANT MANAGER COMPONENT
// Manages product variants (size, color, price, stock)
// =============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, RefreshCw, Package } from 'lucide-react';
import { adminApi } from './index';
import { Button, Badge } from '../../components/ui';

// Size options
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', 'Free Size'];

// Variant Form Component
const VariantForm = ({ variant, productId, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        size: variant?.size || '',
        color: variant?.color || '',
        color_code: variant?.color_code || '#000000',
        price: variant?.price || '',
        stock: variant?.stock || 0,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.size || !formData.price) {
            setError('Size and price are required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const data = {
                product_id: productId,
                size: formData.size,
                color: formData.color || null,
                color_code: formData.color ? formData.color_code : null,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock) || 0,
            };

            if (variant?.id) {
                await adminApi.updateVariant(variant.id, data);
            } else {
                await adminApi.createVariant(data);
            }
            onSave();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Row 1: Size, Price, Stock */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Size *</label>
                        <select
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                            <option value="">Select</option>
                            {SIZE_OPTIONS.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹) *</label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                        <input
                            type="number"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                </div>

                {/* Row 2: Color Name + Color Picker */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Color Name <span className="text-gray-400">(e.g. Royal Maroon)</span>
                        </label>
                        <input
                            type="text"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            placeholder="Enter color name"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Color Code <span className="text-gray-400">(pick color)</span>
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={formData.color_code}
                                onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                                className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer p-0.5"
                                disabled={!formData.color}
                            />
                            <input
                                type="text"
                                value={formData.color_code}
                                onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                                placeholder="#000000"
                                maxLength={7}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                                disabled={!formData.color}
                            />
                            {formData.color && (
                                <div
                                    className="w-10 h-10 rounded-lg border-2 border-gray-300 shrink-0"
                                    style={{ backgroundColor: formData.color_code }}
                                    title={`${formData.color}: ${formData.color_code}`}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                    <Button type="submit" size="sm" loading={saving} leftIcon={<Save className="w-3 h-3" />}>
                        {variant?.id ? 'Update' : 'Add'} Variant
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                        <X className="w-4 h-4" />
                    </Button>
                    {error && <p className="text-red-500 text-xs ml-2">{error}</p>}
                </div>
            </form>
        </motion.div>
    );
};

// Variant Row Component - displays color using color_code from variant data
const VariantRow = ({ variant, onEdit, onDelete, deleting }) => {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50/50">
            <td className="py-3 px-4">
                <Badge variant="outline" size="sm">{variant.size}</Badge>
            </td>
            <td className="py-3 px-4">
                {variant.color ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="w-5 h-5 rounded-full border border-gray-200 shrink-0"
                            style={{ backgroundColor: variant.color_code || '#ccc' }}
                        />
                        <span className="text-sm text-gray-600">{variant.color}</span>
                    </div>
                ) : (
                    <span className="text-sm text-gray-400">-</span>
                )}
            </td>
            <td className="py-3 px-4 text-sm font-medium">
                ₹{parseFloat(variant.price).toLocaleString('en-IN')}
            </td>
            <td className="py-3 px-4">
                <span className={`text-sm font-medium ${variant.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {variant.stock}
                </span>
            </td>
            <td className="py-3 px-4">
                <div className="flex gap-1">
                    <button
                        onClick={() => onEdit(variant)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(variant.id)}
                        disabled={deleting === variant.id}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                        title="Delete"
                    >
                        {deleting === variant.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </td>
        </tr>
    );
};

// Main Variant Manager Component
export default function VariantManager({ productId, variants = [], onUpdate }) {
    const [showForm, setShowForm] = useState(false);
    const [editVariant, setEditVariant] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const handleEdit = (variant) => {
        setEditVariant(variant);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this variant?')) return;
        setDeleting(id);
        try {
            await adminApi.deleteVariant(id);
            onUpdate();
        } catch (error) {
            console.error('Delete variant error:', error);
        } finally {
            setDeleting(null);
        }
    };

    const handleSave = () => {
        setShowForm(false);
        setEditVariant(null);
        onUpdate();
    };

    return (
        <div className="border border-gray-200 rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-500" />
                    <h3 className="font-medium">Variants ({variants.length})</h3>
                </div>
                {productId && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditVariant(null); setShowForm(true); }}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Add Variant
                    </Button>
                )}
            </div>

            {/* Add/Edit Form */}
            <AnimatePresence>
                {showForm && productId && (
                    <div className="p-4">
                        <VariantForm
                            variant={editVariant}
                            productId={productId}
                            onSave={handleSave}
                            onCancel={() => { setShowForm(false); setEditVariant(null); }}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Variants Table */}
            {variants.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="py-2 px-4 text-left font-medium">Size</th>
                                <th className="py-2 px-4 text-left font-medium">Color</th>
                                <th className="py-2 px-4 text-left font-medium">Price</th>
                                <th className="py-2 px-4 text-left font-medium">Stock</th>
                                <th className="py-2 px-4 text-left font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map((variant) => (
                                <VariantRow
                                    key={variant.id}
                                    variant={variant}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    deleting={deleting}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center text-gray-500">
                    <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">No variants added yet</p>
                    {!productId && <p className="text-xs text-gray-400 mt-1">Save product first to add variants</p>}
                </div>
            )}
        </div>
    );
}
