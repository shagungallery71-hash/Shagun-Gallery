// =============================================================================
// ADMIN API - Centralized Admin API Management
// =============================================================================

import { cookieStorage } from '../../utils/cookieStorage';

const API_BASE = import.meta.env.VITE_API_URL || 'https://shagun-backend-kbbh.onrender.com';

// Get token from cookies
const getToken = () => cookieStorage.getItem('token');

// Generic JSON helper
async function fetchJSON(path, options = {}) {
    const { headers, ...rest } = options;

    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            accept: 'application/json',
            ...(headers || {}),
        },
        ...rest,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const message = (data && (data.message || data.error)) || `Request failed ${res.status}`;
        throw new Error(message);
    }

    return data;
}

// Auth headers helper
const authHeaders = (token) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || getToken()}`,
});

// =============================================================================
// ADMIN API EXPORTS
// =============================================================================

export const adminApi = {
    // =========================================================================
    // DASHBOARD
    // =========================================================================

    /** Get dashboard stats - GET /api/admin/stats */
    getStats: (token) =>
        fetchJSON('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Get analytics data - GET /api/coupons/analytics */
    getAnalytics: (period = 30, token) =>
        fetchJSON(`/api/coupons/analytics?period=${period}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Get database statistics - GET /api/admin/database-stats */
    getDatabaseStats: (token) =>
        fetchJSON('/api/admin/database-stats', {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Clear cache - POST /api/admin/clear-cache */
    clearCache: (token) =>
        fetchJSON('/api/admin/clear-cache', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),


    // =========================================================================
    // PRODUCTS
    // =========================================================================

    /** Get all products (Admin - includes unpublished) - GET /api/products/admin/all */
    getProducts: (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchJSON(`/api/products/admin/all${queryString ? `?${queryString}` : ''}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        });
    },

    /** Get product detail - GET /api/products/:id (with cache-busting for admin) */
    getProduct: (id, token) => fetchJSON(`/api/products/${id}?_t=${Date.now()}`, {
        headers: {
            Authorization: `Bearer ${token || getToken()}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        },
    }),

    /** Create product - POST /api/products */
    createProduct: (data, token) =>
        fetchJSON('/api/products', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    /** Update product - PUT /api/products/:id */
    updateProduct: (id, data, token) =>
        fetchJSON(`/api/products/${id}`, {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    /** Delete product - DELETE /api/products/:id */
    deleteProduct: (id, token) =>
        fetchJSON(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    // =========================================================================
    // PRODUCT VARIANTS
    // =========================================================================

    /** Create variant - POST /api/products/variant */
    createVariant: (data, token) =>
        fetchJSON('/api/products/variant', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    /** Update variant - PUT /api/products/variant/:id */
    updateVariant: (id, data, token) =>
        fetchJSON(`/api/products/variant/${id}`, {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    /** Delete variant - DELETE /api/products/variant/:id */
    deleteVariant: (id, token) =>
        fetchJSON(`/api/products/variant/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    // =========================================================================
    // RELATED PRODUCTS
    // =========================================================================

    /** Get related products for admin - GET /api/products/:id/related/admin */
    getRelatedProducts: (productId, token) =>
        fetchJSON(`/api/products/${productId}/related/admin?_t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Add a single related product - POST /api/products/:id/related */
    addRelatedProduct: (productId, relatedProductId, sortOrder = 0, token) =>
        fetchJSON(`/api/products/${productId}/related`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ related_product_id: relatedProductId, sort_order: sortOrder }),
        }),

    /** Add multiple related products - POST /api/products/:id/related/bulk */
    addMultipleRelatedProducts: (productId, relatedProductIds, token) =>
        fetchJSON(`/api/products/${productId}/related/bulk`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ related_product_ids: relatedProductIds }),
        }),

    /** Update related products order - PUT /api/products/:id/related/order */
    updateRelatedProductsOrder: (productId, orderedProducts, token) =>
        fetchJSON(`/api/products/${productId}/related/order`, {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify({ related_products: orderedProducts }),
        }),

    /** Remove a related product - DELETE /api/products/:id/related/:relatedId */
    removeRelatedProduct: (productId, relatedProductId, token) =>
        fetchJSON(`/api/products/${productId}/related/${relatedProductId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Clear all related products - DELETE /api/products/:id/related */
    clearRelatedProducts: (productId, token) =>
        fetchJSON(`/api/products/${productId}/related`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Search products for selection - GET /api/products/admin/all */
    searchProductsForSelection: (search, excludeId, token) => {
        const params = new URLSearchParams({ search, limit: 20 });
        return fetchJSON(`/api/products/admin/all?${params.toString()}&_t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        });
    },

    // =========================================================================
    // PRODUCT IMAGES
    // =========================================================================

    /** Upload images - POST /api/products/image */
    uploadImages: (formData, token) =>
        fetch(`${API_BASE}/api/products/image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token || getToken()}` },
            body: formData,
        }).then(async (res) => {
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || data?.error || 'Upload failed');
            return data;
        }),

    /** Delete image - DELETE /api/products/image/:id */
    deleteImage: (id, token) =>
        fetchJSON(`/api/products/image/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Set primary image (thumbnail) - PATCH /api/products/image/:id/primary */
    setPrimaryImage: (imageId, token) =>
        fetchJSON(`/api/products/image/${imageId}/primary`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Update image positions (drag-and-drop reorder) - PUT /api/products/images/positions */
    updateImagePositions: (productId, images, token) =>
        fetchJSON(`/api/products/images/positions`, {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify({ product_id: productId, images }),
        }),

    /** Upload single image (general) - POST /api/upload */
    uploadSingleImage: async (file, token) => {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token || getToken()}` },
            body: formData,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || 'Upload failed');
        return data;
    },


    // =========================================================================
    // CATEGORIES
    // =========================================================================

    /** Get all categories with subcategories (admin - includes inactive) - GET /api/categories/admin/all */
    getCategories: (token) =>
        fetchJSON(`/api/categories/admin/all?_t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Get main categories (admin - includes inactive) - GET /api/categories/admin/main */
    getMainCategories: (token) =>
        fetchJSON(`/api/categories/admin/main?_t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Create category - POST /api/categories */
    createCategory: (data, token) =>
        fetchJSON('/api/categories', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    /** Create subcategory - POST /api/categories/sub */
    createSubcategory: (data, token) =>
        fetchJSON('/api/categories/sub', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    /** Update category - PUT /api/categories/:id */
    updateCategory: (id, data, token) =>
        fetchJSON(`/api/categories/${id}`, {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    /** Delete category - DELETE /api/categories/:id */
    deleteCategory: (id, token) =>
        fetchJSON(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    // =========================================================================
    // ORDERS
    // =========================================================================

    /** Get all orders - GET /api/orders/admin/all */
    getOrders: (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchJSON(`/api/orders/admin/all${queryString ? `?${queryString}` : ''}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        });
    },

    /** Get order detail (Admin) - GET /api/orders/admin/:id */
    getOrder: (id, token) =>
        fetchJSON(`/api/orders/admin/${id}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    /** Update order status - PATCH /api/orders/admin/:id/status */
    updateOrderStatus: (id, data, token) =>
        fetchJSON(`/api/orders/admin/${id}/status`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    // =========================================================================
    // REVIEWS
    // =========================================================================

    /** Get all reviews - GET /api/admin/reviews */
    getReviews: (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchJSON(`/api/admin/reviews${queryString ? `?${queryString}` : ''}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        });
    },

    /** Approve/Unapprove review - PATCH /api/admin/reviews/:id/approve */
    approveReview: (id, isApproved, token) =>
        fetchJSON(`/api/admin/reviews/${id}/approve`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ is_approved: isApproved }),
        }),

    /** Delete review - DELETE /api/admin/reviews/:id */
    deleteReview: (id, token) =>
        fetchJSON(`/api/admin/reviews/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    // =========================================================================
    // CUSTOMERS
    // =========================================================================

    /** Get all customers - GET /api/admin/customers */
    getCustomers: (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchJSON(`/api/admin/customers${queryString ? `?${queryString}` : ''}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        });
    },

    /** Get customer detail - GET /api/admin/customers/:id */
    getCustomer: (id, token) =>
        fetchJSON(`/api/admin/customers/${id}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    // =========================================================================
    // USER MANAGEMENT
    // =========================================================================

    /** Get all users with stats - GET /api/admin/users */
    getUsers: (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchJSON(`/api/admin/users${queryString ? `?${queryString}` : ''}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        });
    },

    /** Toggle user verified status - PATCH /api/admin/users/:id/verify */
    toggleUserVerified: (userId, isVerified, token) =>
        fetchJSON(`/api/admin/users/${userId}/verify`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ is_verified: isVerified }),
        }),

    /** Update user role - PATCH /api/admin/users/:id/role */
    updateUserRole: (userId, role, token) =>
        fetchJSON(`/api/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ role }),
        }),

    // =========================================================================
    // COUPONS
    // =========================================================================

    /** Get all coupons - GET /api/coupons */
    getCoupons: (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchJSON(`/api/coupons${queryString ? `?${queryString}` : ''}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        });
    },

    /** Create coupon - POST /api/coupons */
    createCoupon: (data, token) =>
        fetchJSON('/api/coupons', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    /** Update coupon - PUT /api/coupons/:id */
    updateCoupon: (id, data, token) =>
        fetchJSON(`/api/coupons/${id}`, {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        }),

    /** Toggle coupon status - PATCH /api/coupons/:id/toggle */
    toggleCoupon: (id, token) =>
        fetchJSON(`/api/coupons/${id}/toggle`, {
            method: 'PATCH',
            headers: authHeaders(token),
        }),

    /** Delete coupon - DELETE /api/coupons/:id */
    deleteCoupon: (id, token) =>
        fetchJSON(`/api/coupons/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token || getToken()}` },
        }),

    // =========================================================================
    // NEWSLETTER
    // =========================================================================

    /** Get subscribers - GET /api/newsletter/subscribers */
    getSubscribers: (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchJSON(`/api/newsletter/subscribers${queryString ? `?${queryString}` : ''}`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        });
    },

    /** Export subscribers as CSV - GET /api/newsletter/export */
    exportSubscribers: async (token) => {
        const res = await fetch(`${API_BASE}/api/newsletter/export`, {
            headers: { Authorization: `Bearer ${token || getToken()}` },
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        return blob;
    },
};

export { getToken };
export default adminApi;
