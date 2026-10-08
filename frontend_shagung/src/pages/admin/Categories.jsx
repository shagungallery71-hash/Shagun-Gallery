import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder, Plus, Edit, Trash2, ChevronRight,
    X, Save, Image, RefreshCw, FolderOpen, Upload
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';
import { useToast } from '../../components/ToastContext';

// Category Form Modal
const CategoryFormModal = ({ category, parentCategories, onClose, onSave, showToast }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parent_id: '',
        image_url: '',
        category_image: '',
        is_active: true,
        ...category,
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({
        image_url: false,
        category_image: false
    });
    const [errors, setErrors] = useState({});
    const fileInputRef1 = useRef(null);
    const fileInputRef2 = useRef(null);

    const generateSlug = () => {
        if (!formData.name) return;
        const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleImageUpload = async (e, field) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast?.('Please select an image file', 'error');
            return;
        }

        setUploading(prev => ({ ...prev, [field]: true }));
        try {
            const result = await adminApi.uploadSingleImage(file);
            if (result.url) {
                setFormData(prev => ({ ...prev, [field]: result.url }));
                showToast?.('Image uploaded successfully', 'success');
            }
        } catch (error) {
            showToast?.('Failed to upload image: ' + error.message, 'error');
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
            if (field === 'image_url' && fileInputRef1.current) fileInputRef1.current.value = '';
            if (field === 'category_image' && fileInputRef2.current) fileInputRef2.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errs = {};
        if (!formData.name?.trim()) errs.name = 'Name is required';
        if (!formData.slug?.trim()) errs.slug = 'Slug is required';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true);
        try {
            const data = {
                ...formData,
                parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
            };

            // Ensure images are strings or null
            data.image_url = data.image_url || null;
            data.category_image = data.category_image || null;

            if (category?.id) {
                await adminApi.updateCategory(category.id, data);
                showToast?.('Category updated successfully', 'success');
            } else if (data.parent_id) {
                await adminApi.createSubcategory(data);
                showToast?.('Subcategory created successfully', 'success');
            } else {
                await adminApi.createCategory(data);
                showToast?.('Category created successfully', 'success');
            }
            onSave();
        } catch (error) {
            setErrors({ submit: error.message });
            showToast?.('Failed to save category: ' + error.message, 'error');
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
                {/* ... Header ... */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold">
                        {category?.id ? 'Edit Category' : 'Add Category'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            onBlur={() => !formData.slug && generateSlug()}
                            className={`w-full px-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="Enter category name"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className={`flex-1 px-4 py-2 border rounded-lg ${errors.slug ? 'border-red-500' : 'border-gray-200'}`}
                                placeholder="category-slug"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={generateSlug}>
                                <RefreshCw className="w-4 h-4 mr-1" /> Generate
                            </Button>
                        </div>
                        {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                        <select
                            value={formData.parent_id || ''}
                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        >
                            <option value="">None (Level 1 - Main Category)</option>
                            {parentCategories
                                .filter(c => c.id !== category?.id)
                                .map(cat => {
                                    // Determine level prefix based on parent_id
                                    const isLevel1 = !cat.parent_id;
                                    const level = isLevel1 ? 1 : (parentCategories.find(p => p.id === cat.parent_id)?.parent_id ? 3 : 2);
                                    const prefix = level === 1 ? '' : level === 2 ? '└─ ' : '  └─ ';
                                    const levelLabel = ` [L${level}]`;
                                    return (
                                        <option key={cat.id} value={cat.id}>
                                            {prefix}{cat.name}{levelLabel}
                                        </option>
                                    );
                                })}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Select a parent to create: L1 → L2 (subcategory) → L3 (sub-subcategory)
                        </p>
                    </div>

                    {/* Thumbnail Image Section */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <label className="block text-sm font-medium text-gray-900 mb-2">Thumbnail Image (Small)</label>
                        <p className="text-xs text-gray-500 mb-3">Used for navigation icons and lists.</p>
                        <div className="flex gap-3 items-start">
                            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border flex items-center justify-center shrink-0">
                                {formData.image_url ? (
                                    <img src={formData.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                    <Image className="w-6 h-6 text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    ref={fileInputRef1}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'image_url')}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef1.current?.click()}
                                    loading={uploading.image_url}
                                    className="w-full h-8 text-xs"
                                >
                                    <Upload className="w-3 h-3 mr-1" /> Upload Thumbnail
                                </Button>
                                <input
                                    type="url"
                                    value={formData.image_url || ''}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full px-3 py-1 border border-gray-200 rounded-lg text-xs"
                                    placeholder="Paste thumbnail URL..."
                                />
                            </div>
                        </div>
                    </div>



                    <div className="flex items-center pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 text-primary rounded"
                            />
                            <span className="text-sm">Active</span>
                        </label>
                    </div>

                    {errors.submit && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errors.submit}</div>
                    )}
                </form>

                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} loading={saving} leftIcon={<Save className="w-4 h-4" />}>
                        {category?.id ? 'Update' : 'Create'}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};


// Category Row
const CategoryRow = ({ category, level = 0, onEdit, onDelete, deleting }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = category.subcategories?.length > 0;

    // Level badge colors
    const levelColors = {
        0: 'bg-purple-100 text-purple-700',
        1: 'bg-blue-100 text-blue-700',
        2: 'bg-green-100 text-green-700',
        3: 'bg-amber-100 text-amber-700',
    };

    return (
        <>
            <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="py-3 px-4">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                        {hasChildren ? (
                            <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                            </button>
                        ) : (
                            <span className="w-6" />
                        )}
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                            {category.image_url ? (
                                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                                <Folder className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-gray-500">/{category.slug}</p>
                        </div>
                    </div>
                </td>
                <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${levelColors[level] || levelColors[3]}`}>
                        Level {level + 1}
                    </span>
                </td>
                <td className="py-3 px-4 text-center">
                    <Badge variant="outline" size="sm">{category.product_count || 0}</Badge>
                </td>
                <td className="py-3 px-4 text-center">
                    <span className="text-gray-500">{category.sort_order || 0}</span>
                </td>
                <td className="py-3 px-4">
                    <Badge variant={category.is_active !== false ? 'success' : 'ghost'} size="sm">
                        {category.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                </td>
                <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(category)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(category.id)}
                            disabled={deleting === category.id}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                        >
                            {deleting === category.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                    </div>
                </td>
            </tr>
            {expanded && hasChildren && category.subcategories.map(sub => (
                <CategoryRow
                    key={sub.id}
                    category={sub}
                    level={level + 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deleting={deleting}
                />
            ))}
        </>
    );
};

// Main Categories Management
export default function AdminCategories() {
    const { showToast } = useToast();
    const [categories, setCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editCategory, setEditCategory] = useState(null);
    const [deleting, setDeleting] = useState(null);

    // Fetch categories
    const fetchCategories = async () => {
        setLoading(true);
        try {
            // Get all categories
            const allData = await adminApi.getCategories();
            const allCats = allData.categories || allData || [];
            setAllCategories(allCats);

            // Build full hierarchy (supports 3+ levels)
            const buildHierarchy = (parentId = null) => {
                return allCats
                    .filter(c => c.parent_id === parentId)
                    .map(cat => ({
                        ...cat,
                        subcategories: buildHierarchy(cat.id)
                    }));
            };

            const hierarchicalCategories = buildHierarchy(null);
            setCategories(hierarchicalCategories);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            showToast('Failed to fetch categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle delete
    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will also affect products in this category.')) return;

        setDeleting(id);
        try {
            await adminApi.deleteCategory(id);
            showToast('Category deleted successfully', 'success');
            fetchCategories();
        } catch (error) {
            console.error('Delete failed:', error);
            showToast('Failed to delete category', 'error');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-500">Organize your product categories</p>
                    </div>
                    <Button onClick={() => { setEditCategory(null); setShowForm(true); }} leftIcon={<Plus className="w-4 h-4" />}>
                        Add Category
                    </Button>
                </div>

                {/* Categories Table */}
                <Card className="overflow-hidden" hover={false}>
                    {loading ? (
                        <div className="w-full">
                            <div className="bg-gray-50 border-b p-4 grid grid-cols-12 gap-4">
                                <div className="col-span-4"><Skeleton className="h-4 w-24" /></div>
                                <div className="col-span-2"><Skeleton className="h-4 w-16 mx-auto" /></div>
                                <div className="col-span-4"><Skeleton className="h-4 w-16 mx-auto" /></div>
                                <div className="col-span-2"><Skeleton className="h-4 w-16" /></div>
                            </div>
                            <div className="p-4 space-y-6">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-4 flex items-center gap-3">
                                            <Skeleton className="w-10 h-10 rounded-lg" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-1/2" />
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex justify-center"><Skeleton className="h-6 w-12 rounded-full" /></div>
                                        <div className="col-span-4 flex justify-center"><Skeleton className="h-4 w-8" /></div>
                                        <div className="col-span-2 flex gap-2">
                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="p-16 text-center">
                            <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No categories found</p>
                            <Button onClick={() => setShowForm(true)} className="mt-4" variant="outline">
                                Create First Category
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr className="text-left text-sm text-gray-500">
                                        <th className="py-3 px-4 font-medium">Category</th>
                                        <th className="py-3 px-4 font-medium text-center">Level</th>
                                        <th className="py-3 px-4 font-medium text-center">Products</th>
                                        <th className="py-3 px-4 font-medium text-center">Order</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category) => (
                                        <CategoryRow
                                            key={category.id}
                                            category={category}
                                            onEdit={(cat) => { setEditCategory(cat); setShowForm(true); }}
                                            onDelete={handleDelete}
                                            deleting={deleting}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* Category Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <CategoryFormModal
                        category={editCategory}
                        parentCategories={allCategories.filter(c => !c.parent_id)}
                        onClose={() => { setShowForm(false); setEditCategory(null); }}
                        onSave={() => { setShowForm(false); setEditCategory(null); fetchCategories(); }}
                        showToast={showToast}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}

