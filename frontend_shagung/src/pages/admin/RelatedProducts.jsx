// =============================================================================
// ADMIN RELATED PRODUCTS PAGE
// Manage related products for all products - simplified with ID-based operations
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Link2, Search, Package, Plus, X, Trash2, Loader2, RefreshCw, Hash, Check
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';
import { useToast } from '../../components/ToastContext';
import { useAuth } from '../../context/AuthContext';

// Inline Related Products Editor Component
const RelatedProductsEditor = ({ product, onUpdate, token }) => {
    const { showToast } = useToast();
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingId, setAddingId] = useState('');
    const [saving, setSaving] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    // Fetch related products
    const fetchRelatedProducts = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await adminApi.getRelatedProducts(product.id, token);
            setRelatedProducts(data.related_products || []);
            onUpdate?.(product.id, (data.related_products || []).length);
        } catch (error) {
            console.error('Failed to fetch related products:', error);
        } finally {
            setLoading(false);
        }
    }, [product.id, token, onUpdate]);

    useEffect(() => {
        fetchRelatedProducts();
    }, [fetchRelatedProducts]);

    // Add product by ID
    const handleAddById = async () => {
        const id = parseInt(addingId);
        if (isNaN(id) || id <= 0) {
            showToast('Enter a valid product ID', 'warning');
            return;
        }
        if (id === product.id) {
            showToast('Cannot add product to itself', 'warning');
            return;
        }
        if (relatedProducts.some(p => p.id === id)) {
            showToast('Product already added', 'warning');
            return;
        }

        setSaving(true);
        try {
            await adminApi.addMultipleRelatedProducts(product.id, [id], token);
            showToast(`Added product ID: ${id}`, 'success');
            setAddingId('');
            await fetchRelatedProducts();
        } catch (error) {
            showToast('Failed to add: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Remove product
    const handleRemove = async (relatedProductId) => {
        setRemovingId(relatedProductId);
        try {
            await adminApi.removeRelatedProduct(product.id, relatedProductId, token);
            setRelatedProducts(prev => prev.filter(p => p.id !== relatedProductId));
            onUpdate?.(product.id, relatedProducts.length - 1);
            showToast('Removed', 'success');
        } catch (error) {
            showToast('Failed to remove', 'error');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="border-t bg-gray-50 p-3 md:p-4">
            {/* Add by ID */}
            <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Hash className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
                <input
                    type="number"
                    value={addingId}
                    onChange={(e) => setAddingId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddById()}
                    placeholder="Enter Product ID..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    min="1"
                />
                <Button
                    onClick={handleAddById}
                    disabled={saving || !addingId}
                    size="sm"
                    leftIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                >
                    Add
                </Button>
            </div>

            {/* Related Products List */}
            {loading ? (
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
            ) : relatedProducts.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No related products. Add IDs above.</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {relatedProducts.map(p => (
                        <div
                            key={p.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-sm group hover:border-primary transition-colors"
                        >
                            <span className="font-medium text-primary">#{p.id}</span>
                            <span className="text-gray-600 max-w-[150px] truncate">{p.name}</span>
                            <button
                                onClick={() => handleRemove(p.id)}
                                disabled={removingId === p.id}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Remove"
                            >
                                {removingId === p.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <X className="w-3 h-3" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Product Row Component
const ProductRow = ({ product, isExpanded, onToggle, relatedCount, onCountUpdate, token }) => (
    <div className="border-b border-gray-100">
        <div
            onClick={onToggle}
            className={`flex items-center py-3 px-3 md:px-4 cursor-pointer transition-colors ${isExpanded ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
        >
            {/* Product Info */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                        <span className="text-[10px] md:text-xs font-bold text-primary bg-primary/10 px-1 md:px-1.5 py-0.5 rounded">
                            #{product.id}
                        </span>
                        <p className="font-medium text-sm md:text-base text-gray-900 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{product.name}</p>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 truncate">{product.category_name || 'No category'}</p>
                </div>
            </div>

            {/* Related Count */}
            <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs md:text-sm font-medium">
                    <Link2 className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{relatedCount ?? '...'}</span>
                </div>
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                    {isExpanded ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <Plus className="w-3 h-3 md:w-4 md:h-4" />}
                </div>
            </div>
        </div>

        {/* Expanded Editor */}
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <RelatedProductsEditor
                        product={product}
                        token={token}
                        onUpdate={onCountUpdate}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

export default function AdminRelatedProducts() {
    const { showToast } = useToast();
    const { token } = useAuth();

    const [products, setProducts] = useState([]);
    const [relatedCounts, setRelatedCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
    });
    const [pagination, setPagination] = useState({});

    // Update count for a specific product
    const handleCountUpdate = useCallback((productId, count) => {
        setRelatedCounts(prev => ({ ...prev, [productId]: count }));
    }, []);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            const params = { page: filters.page, limit: 15 };
            if (filters.search) params.search = filters.search;

            const data = await adminApi.getProducts(params, token);
            const productsList = data.products || [];
            setProducts(productsList);
            setPagination(data.pagination || {});

            // Fetch related counts for each product
            const counts = {};
            await Promise.all(
                productsList.map(async (product) => {
                    try {
                        const relatedData = await adminApi.getRelatedProducts(product.id, token);
                        counts[product.id] = (relatedData.related_products || []).length;
                    } catch (err) {
                        counts[product.id] = 0;
                    }
                })
            );
            setRelatedCounts(counts);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            showToast('Failed to fetch products', 'error');
            setProducts([]);
            setPagination({});
        } finally {
            setLoading(false);
        }
    }, [filters.page, filters.search, token, showToast]);

    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token, filters.page]);

    // Handle search submit
    const handleSearch = (e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchProducts();
    };

    // Search by ID
    const handleSearchById = (e) => {
        e.preventDefault();
        const id = parseInt(searchId);
        if (isNaN(id) || id <= 0) {
            showToast('Enter a valid product ID', 'warning');
            return;
        }
        // Find the product and expand it
        const found = products.find(p => p.id === id);
        if (found) {
            setExpandedId(id);
            showToast(`Found product #${id}`, 'success');
        } else {
            // Try to search for it
            setFilters(prev => ({ ...prev, search: String(id), page: 1 }));
            showToast('Searching for product...', 'info');
        }
    };

    // Calculate total related products
    const totalRelatedProducts = Object.values(relatedCounts).reduce((sum, count) => sum + count, 0);

    return (
        <AdminLayout>
            <div className="p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
                            <Link2 className="w-5 h-5 md:w-7 md:h-7 text-blue-500" />
                            Related Products
                        </h1>
                        <p className="text-sm text-gray-500">Click a product to manage its related products</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-left sm:text-right">
                            <p className="text-xl md:text-2xl font-bold text-primary">{totalRelatedProducts}</p>
                            <p className="text-xs text-gray-500">Total Relations</p>
                        </div>
                    </div>
                </div>

                {/* Search Filters */}
                <Card className="p-3 md:p-4 mb-4 md:mb-6" hover={false}>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                        {/* Search by Name */}
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
                                />
                            </div>
                            <Button type="submit" variant="outline" size="sm" className="hidden sm:flex">
                                Search
                            </Button>
                        </form>

                        {/* Search by ID + Refresh */}
                        <div className="flex gap-2">
                            <form onSubmit={handleSearchById} className="flex gap-2 flex-1 sm:flex-none">
                                <div className="relative flex-1 sm:flex-none">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        value={searchId}
                                        onChange={(e) => setSearchId(e.target.value)}
                                        placeholder="ID"
                                        className="w-full sm:w-24 pl-9 pr-2 py-2 text-sm border border-gray-200 rounded-lg"
                                        min="1"
                                    />
                                </div>
                                <Button type="submit" variant="outline" size="sm">
                                    Find
                                </Button>
                            </form>

                            {/* Refresh */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFilters({ search: '', page: 1 });
                                    setSearchId('');
                                    fetchProducts();
                                }}
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Products List */}
                <Card className="overflow-hidden" hover={false}>
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-lg" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-1/2 mb-2" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                    <Skeleton className="h-8 w-16 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-16 text-center">
                            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No products found</p>
                        </div>
                    ) : (
                        <div>
                            {/* Header */}
                            <div className="flex items-center py-2 px-4 bg-gray-50 border-b text-sm text-gray-500 font-medium">
                                <span className="flex-1">Product</span>
                                <span>Related</span>
                            </div>

                            {/* Product Rows */}
                            {products.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    isExpanded={expandedId === product.id}
                                    onToggle={() => setExpandedId(expandedId === product.id ? null : product.id)}
                                    relatedCount={relatedCounts[product.id]}
                                    onCountUpdate={handleCountUpdate}
                                    token={token}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t flex items-center justify-between bg-gray-50">
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
