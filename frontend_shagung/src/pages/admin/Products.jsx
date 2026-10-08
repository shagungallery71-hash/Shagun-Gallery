// =============================================================================
// ADMIN PRODUCTS PAGE
// Product management with list, search, filters, and CRUD operations
// Uses ProductFormModal component for add/edit
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Plus, Edit, Trash2, Search, Filter,
    Image, Eye, EyeOff, Star, RefreshCw, Link2, Flame, Loader2
} from 'lucide-react';
import { adminApi } from './index';
import { api } from '../../api/client';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';
import ProductFormModal from './ProductFormModal';
import RelatedProductsManager from './RelatedProductsManager';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContext';

// Product Row Component
const ProductRow = ({ product, onEdit, onDelete, onRelated, onToggleSale, deleting, saleLoading, isOnSale }) => (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
        <td className="py-3 px-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                    {/* Sale Fire Badge */}
                    {isOnSale && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <Flame className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>
                <div>
                    <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-500">ID: {product.id}</p>
                </div>
            </div>
        </td>
        <td className="py-3 px-4">
            <Badge variant="outline" size="sm">{product.category_name || '-'}</Badge>
        </td>
        <td className="py-3 px-4">
            <div>
                <p className="font-semibold">₹{parseFloat(product.price).toLocaleString('en-IN')}</p>
                {product.compare_at_price && (
                    <p className="text-xs text-gray-400 line-through">
                        ₹{parseFloat(product.compare_at_price).toLocaleString('en-IN')}
                    </p>
                )}
            </div>
        </td>
        <td className="py-3 px-4">
            <span className={product.stock > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                {product.stock || 0}
            </span>
        </td>
        <td className="py-3 px-4">
            <div className="flex flex-wrap gap-1">
                {product.is_published ? (
                    <Badge variant="success" size="sm"><Eye className="w-3 h-3" /></Badge>
                ) : (
                    <Badge variant="ghost" size="sm"><EyeOff className="w-3 h-3" /></Badge>
                )}
                {product.is_featured && <Badge variant="warning" size="sm"><Star className="w-3 h-3" /></Badge>}
                {product.is_new && <Badge variant="new" size="sm">NEW</Badge>}
                {isOnSale && (
                    <Badge variant="sale" size="sm" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                        <Flame className="w-3 h-3" /> SALE
                    </Badge>
                )}
            </div>
        </td>
        <td className="py-3 px-4">
            <div className="flex items-center gap-1">
                {/* Sale Toggle Button */}
                <button
                    onClick={() => onToggleSale(product)}
                    disabled={saleLoading === product.id}
                    className={`p-2 rounded-lg transition-all ${isOnSale
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg'
                        : 'hover:bg-orange-50 text-gray-400 hover:text-orange-500'
                        }`}
                    title={isOnSale ? 'Remove from Sale' : 'Add to Sale'}
                >
                    {saleLoading === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Flame className="w-4 h-4" />
                    )}
                </button>
                <button
                    onClick={() => onEdit(product)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    title="Edit Product"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onRelated(product)}
                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"
                    title="Manage Related Products"
                >
                    <Link2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(product.id)}
                    disabled={deleting === product.id}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                    title="Delete Product"
                >
                    {deleting === product.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                </button>
            </div>
        </td>
    </tr>
);

// Main Products Management Component
export default function AdminProducts() {
    const { token } = useAuth();
    const { showToast } = useToast();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [relatedProduct, setRelatedProduct] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        page: 1,
    });
    const [pagination, setPagination] = useState({});

    // Sale related state
    const [activeSale, setActiveSale] = useState(null);
    const [saleProductIds, setSaleProductIds] = useState(new Set());
    const [saleLoading, setSaleLoading] = useState(null);

    // Fetch active sale and sale products
    const fetchSaleData = useCallback(async () => {
        try {
            // Get active sales
            const salesRes = await api.getActiveSales();
            const sales = salesRes.sales || [];

            if (sales.length > 0) {
                setActiveSale(sales[0]);

                // Get products on sale
                const productsRes = await api.getSaleProducts({ limit: 100 });
                const saleProducts = productsRes.products || [];
                setSaleProductIds(new Set(saleProducts.map(p => p.id)));
            }
        } catch (err) {
            console.error('Failed to fetch sale data:', err);
        }
    }, []);

    // Fetch products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = { page: filters.page, limit: 20 };
            if (filters.search) params.search = filters.search;
            if (filters.category) params.category = filters.category;

            const data = await adminApi.getProducts(params);
            setProducts(data.products || []);
            setPagination(data.pagination || {});
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
            setPagination({});
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const data = await adminApi.getCategories();
            // Handle different response formats
            const cats = data.categories || data || [];
            // Deduplicate by category_id or id
            const uniqueCats = [];
            const seen = new Set();
            for (const cat of cats) {
                const id = cat.category_id || cat.id;
                if (id && !seen.has(id)) {
                    seen.add(id);
                    uniqueCats.push({ id, name: cat.category || cat.name });
                }
            }
            setCategories(uniqueCats);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchSaleData();
    }, [filters.page, filters.category, fetchSaleData]);

    // Toggle sale for product
    const handleToggleSale = async (product) => {
        if (!activeSale) {
            showToast('No active sale available. Create a sale first.', 'warning');
            return;
        }

        setSaleLoading(product.id);
        const isOnSale = saleProductIds.has(product.id);

        try {
            if (isOnSale) {
                // Remove from sale
                await api.removeProductFromSale({
                    productId: product.id,
                    saleId: activeSale.id
                }, token);
                setSaleProductIds(prev => {
                    const next = new Set(prev);
                    next.delete(product.id);
                    return next;
                });
                showToast(`${product.name} removed from sale`, 'info');
            } else {
                // Add to sale
                await api.addProductToSale({
                    productId: product.id,
                    saleId: activeSale.id,
                    discountPercentage: activeSale.discount_percentage
                }, token);
                setSaleProductIds(prev => new Set(prev).add(product.id));
                showToast(`${product.name} added to ${activeSale.name}!`, 'success');
            }
        } catch (err) {
            showToast('Failed to update sale status', 'error');
        } finally {
            setSaleLoading(null);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        setDeleting(id);
        try {
            await adminApi.deleteProduct(id);
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setDeleting(null);
        }
    };

    // Handle edit
    const handleEdit = async (product) => {
        // Fetch full product details with variants and images
        try {
            const fullProduct = await adminApi.getProduct(product.id);
            setEditProduct(fullProduct);
            setShowForm(true);
        } catch (error) {
            console.error('Failed to fetch product details:', error);
            // Fallback to basic product data
            setEditProduct(product);
            setShowForm(true);
        }
    };

    // Handle search submit
    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                        <p className="text-gray-500">Manage your product catalog</p>
                    </div>
                    <Button
                        onClick={() => { setEditProduct(null); setShowForm(true); }}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Add Product
                    </Button>
                </div>

                {/* Active Sale Banner */}
                {activeSale && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Flame className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold">{activeSale.name}</p>
                                    <p className="text-sm text-white/80">
                                        {saleProductIds.size} products on sale
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-white/70">
                                Click <Flame className="w-4 h-4 inline" /> to add/remove products
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <Card className="p-4 mb-6" hover={false}>
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-200 rounded-lg"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <Button type="submit" variant="outline">
                            <Filter className="w-4 h-4 mr-2" /> Filter
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setFilters({ search: '', category: '', page: 1 });
                                fetchProducts();
                            }}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </form>
                </Card>

                {/* Products Table */}
                <Card className="overflow-hidden" hover={false}>
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-16 text-center">
                            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No products found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr className="text-left text-sm text-gray-500">
                                        <th className="py-3 px-4 font-medium">Product</th>
                                        <th className="py-3 px-4 font-medium">Category</th>
                                        <th className="py-3 px-4 font-medium">Price</th>
                                        <th className="py-3 px-4 font-medium">Stock</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <ProductRow
                                            key={product.id}
                                            product={product}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onRelated={(p) => setRelatedProduct(p)}
                                            onToggleSale={handleToggleSale}
                                            deleting={deleting}
                                            saleLoading={saleLoading}
                                            isOnSale={saleProductIds.has(product.id)}
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

            {/* Product Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <ProductFormModal
                        key={editProduct?.id || 'new'}
                        product={editProduct}
                        categories={categories}
                        onClose={() => { setShowForm(false); setEditProduct(null); }}
                        onSave={() => { setShowForm(false); setEditProduct(null); fetchProducts(); }}
                    />
                )}
            </AnimatePresence>

            {/* Related Products Manager Modal */}
            <AnimatePresence>
                {relatedProduct && (
                    <RelatedProductsManager
                        productId={relatedProduct.id}
                        productName={relatedProduct.name}
                        onClose={() => setRelatedProduct(null)}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
