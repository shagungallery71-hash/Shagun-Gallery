import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Link2, Plus, X, Trash2, Package,
    AlertCircle, Loader2, Hash, Search, CheckCircle
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Badge, Skeleton } from '../../components/ui';
import { useToast } from '../../components/ToastContext';
import { useAuth } from '../../context/AuthContext';

const RelatedProductsManager = ({ productId, productName, onClose }) => {
    const { showToast } = useToast();
    const { token } = useAuth();
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingId, setAddingId] = useState('');
    const [saving, setSaving] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    // Search Mode State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch related products
    const fetchRelatedProducts = useCallback(async () => {
        if (!token) return;
        try {
            const data = await adminApi.getRelatedProducts(productId, token);
            setRelatedProducts(data.related_products || []);
        } catch (error) {
            console.error('Failed to fetch related products:', error);
            showToast('Failed to load related products', 'error');
        } finally {
            setLoading(false);
        }
    }, [productId, token, showToast]);

    useEffect(() => {
        fetchRelatedProducts();
    }, [fetchRelatedProducts]);

    // Handle Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const data = await adminApi.searchProductsForSelection(searchQuery, productId, token);
                // Filter out the current product itself to avoid adding itself
                const results = (data.products || []).filter(p => p.id !== parseInt(productId));
                setSearchResults(results);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, productId, token]);

    // Add product by ID (Manual)
    const handleAddById = async () => {
        const id = parseInt(addingId);
        if (isNaN(id) || id <= 0) {
            showToast('Enter a valid product ID', 'warning');
            return;
        }
        await addProduct(id);
        setAddingId('');
    };

    // Generic Add Product
    const addProduct = async (id) => {
        if (id === parseInt(productId)) {
            showToast('Cannot add product to itself', 'warning');
            return;
        }
        if (relatedProducts.some(p => p.id === id)) {
            showToast('Product already added', 'warning');
            return;
        }

        setSaving(true);
        try {
            await adminApi.addMultipleRelatedProducts(productId, [id], token);
            showToast(`Added product ID: ${id}`, 'success');
            await fetchRelatedProducts();
        } catch (error) {
            showToast('Failed to add: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Remove a related product
    const handleRemove = async (relatedProductId) => {
        setRemovingId(relatedProductId);
        try {
            await adminApi.removeRelatedProduct(productId, relatedProductId, token);
            setRelatedProducts(prev => prev.filter(p => p.id !== relatedProductId));
            showToast('Removed', 'success');
        } catch (error) {
            showToast('Failed to remove: ' + error.message, 'error');
        } finally {
            setRemovingId(null);
        }
    };

    // Clear all related products
    const handleClearAll = async () => {
        if (!confirm('Remove all related products?')) return;

        setSaving(true);
        try {
            await adminApi.clearRelatedProducts(productId, token);
            setRelatedProducts([]);
            showToast('All removed', 'success');
        } catch (error) {
            showToast('Failed to clear: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Check if a product is already related
    const isRelated = (id) => relatedProducts.some(p => p.id === id);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            <Link2 className="w-6 h-6 text-primary" />
                            Manage Related Products
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Editing for: <span className="font-semibold text-gray-900">{productName}</span> (ID: {productId})
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT SIDE: Current Related Products */}
                    <div className="w-1/3 border-r flex flex-col bg-gray-50/30">
                        <div className="p-4 border-b bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    Selected Products
                                    <Badge variant="outline" className="ml-2">{relatedProducts.length}</Badge>
                                </h3>
                                {relatedProducts.length > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {loading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                                </div>
                            ) : relatedProducts.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">No products selected</p>
                                    <p className="text-xs text-gray-500 mt-1">Search and add products from the right panel.</p>
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {relatedProducts.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-3 p-2 bg-white border rounded-lg shadow-sm group hover:border-primary/30 transition-all"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden shrink-0">
                                                {product.image ? (
                                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-full h-full p-2 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate text-gray-800">{product.name}</p>
                                                <p className="text-xs text-gray-500">ID: {product.id} • ₹{product.price}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(product.id)}
                                                disabled={removingId === product.id}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                {removingId === product.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: Search & Add */}
                    <div className="flex-1 flex flex-col bg-white">
                        <div className="p-4 border-b space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Find Products to Add</h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by product name..."
                                        className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Manual ID Input Fallback */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500">Or add by ID:</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={addingId}
                                        onChange={(e) => setAddingId(e.target.value)}
                                        placeholder="ID"
                                        className="w-16 px-2 py-1 border rounded text-center"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddById()}
                                    />
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={handleAddById}
                                        disabled={!addingId || saving}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Search Results */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                                    <p className="text-sm">Searching products...</p>
                                </div>
                            ) : !searchQuery ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Search className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm">Start typing to search products</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <AlertCircle className="w-8 h-8 mb-2 text-gray-300" />
                                    <p className="text-sm">No products found matching "{searchQuery}"</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map((product) => {
                                        const alreadyAdded = isRelated(product.id);
                                        return (
                                            <div
                                                key={product.id}
                                                className={`flex items-center gap-4 p-3 bg-white border rounded-xl transition-all ${alreadyAdded ? 'opacity-60 bg-gray-50' : 'hover:border-primary/50 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                                                    {product.thumbnail_image || product.image ? (
                                                        <img
                                                            src={product.thumbnail_image || product.image}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono text-gray-400">#{product.id}</span>
                                                        {product.category_name && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                                {product.category_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-600">
                                                        <span>₹{product.price}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className={product.stock > 0 ? 'text-green-600' : 'text-red-500 text-xs'}>
                                                            {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant={alreadyAdded ? "secondary" : "primary"}
                                                    disabled={alreadyAdded || saving}
                                                    onClick={() => addProduct(product.id)}
                                                    className={alreadyAdded ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" : ""}
                                                >
                                                    {alreadyAdded ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 mr-1.5" />
                                                            Added
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-4 h-4 mr-1.5" />
                                                            Add
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <Button onClick={onClose} size="lg" className="px-8">
                        Done
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default RelatedProductsManager;
