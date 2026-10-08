// =============================================================================
// API CLIENT - Shagung E-commerce
// =============================================================================

import { cookieStorage } from '../utils/cookieStorage';

const API_BASE = import.meta.env.VITE_API_URL || 'https://shagun-backend-kbbh.onrender.com';

// Get token from cookies
const getToken = () => cookieStorage.getItem('token');

// Session state flags
let authExpiredFired = false;
let sessionInvalid = false;

// Reset session invalid flag (called when user logs in)
export function resetSessionState() {
  sessionInvalid = false;
  authExpiredFired = false;
}

// Generic JSON helper for GET/POST/etc
export async function fetchJSON(path, options = {}) {
  const { signal, headers, ...rest } = options;

  // Check if session has been invalidated
  const hasAuthHeader = headers?.Authorization;
  if (sessionInvalid && hasAuthHeader) {
    throw new Error('Session expired. Please login again.');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    signal,
    headers: {
      accept: 'application/json',
      ...(headers || {}),
    },
    ...rest,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Handle 401 Unauthorized - session expired or invalid token
    if (res.status === 401 && hasAuthHeader && !authExpiredFired) {
      console.log('API returned 401 - Session expired or unauthorized');
      authExpiredFired = true;
      sessionInvalid = true;

      // Immediately clear invalid token from cookies
      try {
        cookieStorage.removeItem('token');
        cookieStorage.removeItem('auth:user');
      } catch (e) { /* ignore */ }

      // Dispatch custom event for session expiry (updates React state)
      window.dispatchEvent(new Event('auth-expired'));

      // Reset authExpiredFired after delay to allow for future sessions
      setTimeout(() => { authExpiredFired = false; }, 2000);
    }

    const message = (data && (data.message || data.error)) || `Request failed ${res.status}`;
    throw new Error(message);
  }

  return data;
}

// Auth helper for protected routes - checks token exists first
const authHeaders = (token) => {
  const tokenToUse = token || getToken();
  if (!tokenToUse) {
    throw new Error('No authentication token available');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenToUse}`,
  };
};

export const api = {
  // ==========================================================================
  // GENERAL ENDPOINTS
  // ==========================================================================

  /** Health check - GET / */
  serverTime: () => fetchJSON('/'),

  /** Health status - GET /health */
  health: () => fetchJSON('/health'),

  // ==========================================================================
  // CATEGORY APIs
  // ==========================================================================

  /** All categories with subcategories - GET /api/categories */
  categoriesWithSub: () => fetchJSON(`/api/categories?_t=${Date.now()}`),

  /** Main categories - GET /api/categories/main */
  mainCategories: () => fetchJSON(`/api/categories/main?_t=${Date.now()}`),

  /** Subcategories by parent - GET /api/categories/sub/:parentId */
  subcategories: (parentId) => fetchJSON(`/api/categories/sub/${parentId}?_t=${Date.now()}`),

  /** Create category (admin) - POST /api/categories */
  createCategory: (categoryData, token) =>
    fetchJSON('/api/categories', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(categoryData),
    }),

  /** Create subcategory (admin) - POST /api/categories/sub */
  createSubcategory: (subcategoryData, token) =>
    fetchJSON('/api/categories/sub', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(subcategoryData),
    }),

  /** Update category (admin) - PUT /api/categories/:id */
  updateCategory: (id, categoryData, token) =>
    fetchJSON(`/api/categories/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(categoryData),
    }),

  /** Delete category (admin) - DELETE /api/categories/:id */
  deleteCategory: (id, token) =>
    fetchJSON(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  // ==========================================================================
  // PRODUCT APIs
  // ==========================================================================

  /** All products with pagination - GET /api/products */
  products: (params = {}) => {
    const queryString = new URLSearchParams({ ...params, _t: Date.now() }).toString();
    return fetchJSON(`/api/products${queryString ? `?${queryString}` : ''}`);
  },

  /** Get products (legacy alias) */
  productsByMainCategories: () => fetchJSON(`/api/products/category?_t=${Date.now()}`),

  /** Products by category - GET /api/products/category/:categoryId */
  productsByCategoryId: async (categoryId) => {
    const res = await fetchJSON(`/api/products/category/${categoryId}?_t=${Date.now()}`);
    return res.data || res.products || [];
  },

  /** Featured products - GET /api/products/featured */
  featuredProducts: (limit = 8) => fetchJSON(`/api/products/featured?limit=${limit}&_t=${Date.now()}`),

  // ==========================================================================
  // SEARCH APIs (Fast Cached Search)
  // ==========================================================================

  /** Search products - GET /api/search?q= */
  searchProducts: (query, params = {}) => {
    const queryParams = new URLSearchParams({ q: query, ...params, _t: Date.now() });
    return fetchJSON(`/api/search?${queryParams}`);
  },

  /** Search suggestions - GET /api/search/suggestions?q= */
  searchSuggestions: (query) =>
    fetchJSON(`/api/search/suggestions?q=${encodeURIComponent(query)}&_t=${Date.now()}`),

  /** Trending searches - GET /api/search/trending */
  trendingSearches: () => fetchJSON(`/api/search/trending?_t=${Date.now()}`),

  /** Product detail - GET /api/products/:id */
  productDetail: (id) => fetchJSON(`/api/products/${id}?_t=${Date.now()}`),

  /** Related products - GET /api/products/:id/related */
  relatedProducts: (id) => fetchJSON(`/api/products/${id}/related?_t=${Date.now()}`),

  /** Create product (admin) - POST /api/products */
  createProduct: (productData, token) =>
    fetchJSON('/api/products', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(productData),
    }),

  /** Update product (admin) - PUT /api/products/:id */
  updateProduct: (id, productData, token) =>
    fetchJSON(`/api/products/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(productData),
    }),

  /** Delete product (admin) - DELETE /api/products/:id */
  deleteProduct: (id, token) =>
    fetchJSON(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Create review - POST /api/products/:id/review */
  createReview: (productId, { rating, comment }, token) =>
    fetchJSON(`/api/products/${productId}/review`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ rating, comment }),
    }),

  /** Create review with image - POST /api/products/:id/review */
  createReviewWithImage: (productId, formData, token) =>
    fetch(`${API_BASE}/api/products/${productId}/review`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token || getToken()}`,
      },
      body: formData,
    }).then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && (data.message || data.error)) || `Request failed ${res.status}`);
      }
      return data;
    }),

  /** Get product reviews - GET /api/products/:id/reviews */
  getReviews: (productId, page = 1, limit = 5) =>
    fetchJSON(`/api/products/${productId}/reviews?page=${page}&limit=${limit}&_t=${Date.now()}`),

  /** Create variant (admin) - POST /api/products/variant */
  createProductVariant: (variantData, token) =>
    fetchJSON('/api/products/variant', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(variantData),
    }),

  /** Create image (admin) - POST /api/products/image */
  createProductImage: (formData, token) =>
    fetchJSON('/api/products/image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token || getToken()}` },
      body: formData,
    }),

  /** Update variant (admin) - PUT /api/products/variant/:id */
  updateProductVariant: (id, variantData, token) =>
    fetchJSON(`/api/products/variant/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(variantData),
    }),

  /** Update image (admin) - PUT /api/products/image/:id */
  updateProductImage: (id, formData, token) =>
    fetchJSON(`/api/products/image/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token || getToken()}` },
      body: formData,
    }),

  /** Delete variant (admin) - DELETE /api/products/variant/:id */
  deleteProductVariant: (id, token) =>
    fetchJSON(`/api/products/variant/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Delete image (admin) - DELETE /api/products/image/:id */
  deleteProductImage: (id, token) =>
    fetchJSON(`/api/products/image/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Delete review (admin) - DELETE /api/products/review/:id */
  deleteProductReview: (id, token) =>
    fetchJSON(`/api/products/review/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  // ==========================================================================
  // CART APIs
  // ==========================================================================

  /** Get cart - GET /api/cart */
  getCart: (token) =>
    fetchJSON('/api/cart', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Add to cart - POST /api/cart */
  addToCart: ({ productId, variantId, quantity = 1 }, token) =>
    fetchJSON('/api/cart', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ productId, variantId, quantity }),
    }),

  /** Update cart item - PUT /api/cart/:itemId */
  updateCartItem: (itemId, quantity, token) =>
    fetchJSON(`/api/cart/${itemId}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ quantity }),
    }),

  /** Remove from cart - DELETE /api/cart/:itemId */
  removeFromCart: (itemId, token) =>
    fetchJSON(`/api/cart/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Clear cart - DELETE /api/cart */
  clearCart: (token) =>
    fetchJSON('/api/cart', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Get cart count - GET /api/cart/count */
  getCartCount: (token) =>
    fetchJSON('/api/cart/count', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Apply coupon - POST /api/cart/coupon */
  applyCoupon: (code, token) =>
    fetchJSON('/api/cart/coupon', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ code }),
    }),

  /** Get available coupons - GET /api/cart/coupons */
  getCoupons: (token) =>
    fetchJSON('/api/cart/coupons', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  // ==========================================================================
  // WISHLIST APIs
  // ==========================================================================

  /** Get wishlist - GET /api/wishlist */
  getWishlist: (token) =>
    fetchJSON('/api/wishlist', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Add to wishlist - POST /api/wishlist */
  addToWishlist: (productId, token) =>
    fetchJSON('/api/wishlist', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ productId }),
    }),

  /** Toggle wishlist - POST /api/wishlist/toggle */
  toggleWishlist: (productId, token) =>
    fetchJSON('/api/wishlist/toggle', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ productId }),
    }),

  /** Remove from wishlist - DELETE /api/wishlist/:productId */
  removeFromWishlist: (productId, token) =>
    fetchJSON(`/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Check if in wishlist - GET /api/wishlist/check/:productId */
  checkWishlist: (productId, token) =>
    fetchJSON(`/api/wishlist/check/${productId}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Move to cart - POST /api/wishlist/move-to-cart */
  moveToCart: ({ productId, variantId }, token) =>
    fetchJSON('/api/wishlist/move-to-cart', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ productId, variantId }),
    }),

  /** Clear wishlist - DELETE /api/wishlist */
  clearWishlist: (token) =>
    fetchJSON('/api/wishlist', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  // ==========================================================================
  // ADDRESS APIs
  // ==========================================================================

  /** Get user addresses - GET /api/addresses */
  getAddresses: (token) =>
    fetchJSON('/api/addresses', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Add new address - POST /api/addresses */
  addAddress: (addressData, token) =>
    fetchJSON('/api/addresses', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(addressData),
    }),

  /** Update address - PUT /api/addresses/:addressId */
  updateAddress: (addressId, addressData, token) =>
    fetchJSON(`/api/addresses/${addressId}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(addressData),
    }),

  /** Delete address - DELETE /api/addresses/:addressId */
  deleteAddress: (addressId, token) =>
    fetchJSON(`/api/addresses/${addressId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Set default address - PATCH /api/addresses/:addressId/default */
  setDefaultAddress: (addressId, token) =>
    fetchJSON(`/api/addresses/${addressId}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  // ==========================================================================
  // ORDER APIs
  // ==========================================================================

  /** Create order - POST /api/orders */
  createOrder: (orderData, token) =>
    fetchJSON('/api/orders', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(orderData),
    }),

  /** Get user orders - GET /api/orders */
  getUserOrders: (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchJSON(`/api/orders${queryString ? `?${queryString}` : ''}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    });
  },

  /** Get order by ID - GET /api/orders/:orderId */
  getOrder: (orderId, token) =>
    fetchJSON(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Track order by number - GET /api/orders/track/:orderNumber */
  trackOrder: (orderNumber, email) =>
    fetchJSON(`/api/orders/track/${orderNumber}${email ? `?email=${encodeURIComponent(email)}` : ''}`),

  /** Cancel order - POST /api/orders/:orderId/cancel */
  cancelOrder: (orderId, reason, token) =>
    fetchJSON(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ reason }),
    }),

  /** Get all orders (admin) - GET /api/orders/admin/all */
  getAllOrders: (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchJSON(`/api/orders/admin/all${queryString ? `?${queryString}` : ''}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    });
  },

  /** Update order status (admin) - PATCH /api/orders/admin/:orderId/status */
  updateOrderStatus: (orderId, { status, trackingNumber, trackingUrl, notes }, token) =>
    fetchJSON(`/api/orders/admin/${orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ status, trackingNumber, trackingUrl, notes }),
    }),

  // ==========================================================================
  // PAYMENT APIs (Cashfree)
  // ==========================================================================

  /** Get available payment offers - GET /api/payments/offers */
  getPaymentOffers: (token) =>
    fetchJSON('/api/payments/offers', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Create Cashfree payment order - POST /api/payments/create-intent */
  createPaymentIntent: ({ amount, currency = 'INR', metadata = {} }, token) =>
    fetchJSON('/api/payments/create-intent', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ amount, currency, metadata }),
    }),

  /** Verify Cashfree payment - POST /api/payments/verify */
  verifyPayment: (orderId, token) =>
    fetchJSON('/api/payments/verify', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ orderId }),
    }),

  /** Confirm payment (alias for verify) - POST /api/payments/confirm */
  confirmPayment: ({ orderId }, token) =>
    fetchJSON('/api/payments/confirm', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ orderId }),
    }),

  /** Get payment status - GET /api/payments/status/:orderId */
  getPaymentStatus: (orderId, token) =>
    fetchJSON(`/api/payments/status/${orderId}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Get payment service status - GET /api/payments/status */
  getPaymentServiceStatus: () =>
    fetchJSON('/api/payments/status'),

  /** Get saved payment methods - GET /api/payments/methods */
  getPaymentMethods: (token) =>
    fetchJSON('/api/payments/methods', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Create refund (admin) - POST /api/payments/refund */
  createRefund: ({ paymentIntentId, amount, reason }, token) =>
    fetchJSON('/api/payments/refund', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ paymentIntentId, amount, reason }),
    }),

  // ==========================================================================
  // ADMIN APIs
  // ==========================================================================

  /** Get dashboard stats (admin) - GET /api/admin/stats */
  getAdminStats: (token) =>
    fetchJSON('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Get all customers (admin) - GET /api/admin/customers */
  getAllCustomers: (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchJSON(`/api/admin/customers${queryString ? `?${queryString}` : ''}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    });
  },

  /** Get customer details (admin) - GET /api/admin/customers/:id */
  getCustomer: (id, token) =>
    fetchJSON(`/api/admin/customers/${id}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Get all coupons (admin) - GET /api/coupons */
  getAllCoupons: (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchJSON(`/api/coupons${queryString ? `?${queryString}` : ''}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    });
  },

  /** Create coupon (admin) - POST /api/coupons */
  createCoupon: (data, token) =>
    fetchJSON('/api/coupons', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  /** Toggle coupon status (admin) - PATCH /api/coupons/:id/toggle */
  toggleCoupon: (id, token) =>
    fetchJSON(`/api/coupons/${id}/toggle`, {
      method: 'PATCH',
      headers: authHeaders(token),
    }),

  /** Delete coupon (admin) - DELETE /api/coupons/:id */
  deleteCoupon: (id, token) =>
    fetchJSON(`/api/coupons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Get newsletter subscribers (admin) - GET /api/newsletter/subscribers */
  getNewsletterSubscribers: (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchJSON(`/api/newsletter/subscribers${queryString ? `?${queryString}` : ''}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    });
  },

  /** Export newsletter subscribers (admin) - GET /api/newsletter/export */
  exportNewsletterSubscribers: (token) =>
    fetchJSON('/api/newsletter/export', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  // ==========================================================================
  // ADDRESS APIs
  // ==========================================================================

  /** Get user addresses - GET /api/addresses */
  getAddresses: (token) =>
    fetchJSON('/api/addresses', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Add address - POST /api/addresses */
  addAddress: (addressData, token) =>
    fetchJSON('/api/addresses', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(addressData),
    }),

  /** Update address - PUT /api/addresses/:id */
  updateAddress: (id, addressData, token) =>
    fetchJSON(`/api/addresses/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(addressData),
    }),

  /** Delete address - DELETE /api/addresses/:id */
  deleteAddress: (id, token) =>
    fetchJSON(`/api/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Set default address - PUT /api/addresses/:id/default */
  setDefaultAddress: (id, token) =>
    fetchJSON(`/api/addresses/${id}/default`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  // ==========================================================================
  // NEWSLETTER APIs
  // ==========================================================================

  /** Subscribe to newsletter - POST /api/newsletter */
  subscribeNewsletter: (email) =>
    fetchJSON('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),

  /** Unsubscribe from newsletter - DELETE /api/newsletter */
  unsubscribeNewsletter: (email) =>
    fetchJSON(`/api/newsletter?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }),

  // ==========================================================================
  // DELIVERY APIs
  // ==========================================================================

  /** Check pincode delivery availability - GET /api/delivery/check/:pincode */
  checkPincode: (pincode) => fetchJSON(`/api/delivery/check/${pincode}`),

  /** Get all serviceable pincodes - GET /api/delivery/pincodes */
  getServiceablePincodes: () => fetchJSON('/api/delivery/pincodes'),

  // ==========================================================================
  // SALES APIs
  // ==========================================================================

  /** Get active sales - GET /api/sales/active */
  getActiveSales: () => fetchJSON(`/api/sales/active?_t=${Date.now()}`),

  /** Get sale products - GET /api/sales/products */
  getSaleProducts: (params = {}) => {
    const queryString = new URLSearchParams({ ...params, _t: Date.now() }).toString();
    return fetchJSON(`/api/sales/products?${queryString}`);
  },

  /** Get sale by ID/slug - GET /api/sales/:id */
  getSaleById: (idOrSlug) => fetchJSON(`/api/sales/${idOrSlug}?_t=${Date.now()}`),

  /** Check if product is on sale - GET /api/sales/product/:product_id/status */
  getProductSaleStatus: (productId) => fetchJSON(`/api/sales/product/${productId}/status`),

  /** Get all sales (admin) - GET /api/sales */
  getAllSales: (token) =>
    fetchJSON('/api/sales', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Create sale (admin) - POST /api/sales */
  createSale: (saleData, token) =>
    fetchJSON('/api/sales', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(saleData),
    }),

  /** Update sale (admin) - PUT /api/sales/:id */
  updateSale: (id, saleData, token) =>
    fetchJSON(`/api/sales/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(saleData),
    }),

  /** Delete sale (admin) - DELETE /api/sales/:id */
  deleteSale: (id, token) =>
    fetchJSON(`/api/sales/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Add product to sale (admin) - POST /api/sales/products/add */
  addProductToSale: ({ productId, saleId, salePrice, discountPercentage }, token) =>
    fetchJSON('/api/sales/products/add', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ product_id: productId, sale_id: saleId, sale_price: salePrice, discount_percentage: discountPercentage }),
    }),

  /** Remove product from sale (admin) - POST /api/sales/products/remove */
  removeProductFromSale: ({ productId, saleId }, token) =>
    fetchJSON('/api/sales/products/remove', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ product_id: productId, sale_id: saleId }),
    }),

  /** Bulk add products to sale (admin) - POST /api/sales/products/bulk-add */
  bulkAddProductsToSale: ({ saleId, productIds, discountPercentage }, token) =>
    fetchJSON('/api/sales/products/bulk-add', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ sale_id: saleId, product_ids: productIds, discount_percentage: discountPercentage }),
    }),

  // ==========================================================================
  // HERO SECTION APIs (Homepage Banners)
  // ==========================================================================

  /** Get active hero slides - GET /api/hero/slides */
  getHeroSlides: () => fetchJSON(`/api/hero/slides?fresh=true&_t=${Date.now()}`),

  /** Get hero settings - GET /api/hero/settings */
  getHeroSettings: () => fetchJSON(`/api/hero/settings?fresh=true&_t=${Date.now()}`),

  /** Get all hero slides (admin) - GET /api/hero/admin/slides */
  getHeroSlidesAdmin: (token) =>
    fetchJSON(`/api/hero/admin/slides?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Create hero slide (admin) - POST /api/hero/slides */
  createHeroSlide: (slideData, token) =>
    fetchJSON('/api/hero/slides', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(slideData),
    }),

  /** Update hero slide (admin) - PUT /api/hero/slides/:id */
  updateHeroSlide: (id, slideData, token) =>
    fetchJSON(`/api/hero/slides/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(slideData),
    }),

  /** Delete hero slide (admin) - DELETE /api/hero/slides/:id */
  deleteHeroSlide: (id, token) =>
    fetchJSON(`/api/hero/slides/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Toggle hero slide (admin) - PATCH /api/hero/slides/:id/toggle */
  toggleHeroSlide: (id, token) =>
    fetchJSON(`/api/hero/slides/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Reorder hero slides (admin) - PUT /api/hero/slides/reorder */
  reorderHeroSlides: (slideIds, token) =>
    fetchJSON('/api/hero/slides/reorder', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ slideIds }),
    }),

  /** Get all hero settings (admin) - GET /api/hero/admin/settings */
  getHeroSettingsAdmin: (token) =>
    fetchJSON(`/api/hero/admin/settings?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Update hero setting (admin) - PUT /api/hero/settings/:key */
  updateHeroSetting: (key, value, type, token) =>
    fetchJSON(`/api/hero/settings/${key}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ value, type }),
    }),

  /** Bulk update hero settings (admin) - PUT /api/hero/settings */
  bulkUpdateHeroSettings: (settings, token) =>
    fetchJSON('/api/hero/settings', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ settings }),
    }),

  // ==========================================================================
  // CAREERS APIs (Job Listings & Applications)
  // ==========================================================================

  /** Get active jobs - GET /api/careers/jobs */
  getJobs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);
    if (filters.type) params.append('type', filters.type);
    if (filters.level) params.append('level', filters.level);
    const queryString = params.toString();
    return fetchJSON(`/api/careers/jobs${queryString ? '?' + queryString : ''}`);
  },

  /** Get job details - GET /api/careers/jobs/:id */
  getJobDetails: (id) => fetchJSON(`/api/careers/jobs/${id}`),

  /** Get departments - GET /api/careers/departments */
  getDepartments: () => fetchJSON('/api/careers/departments'),

  /** Submit job application - POST /api/careers/apply */
  submitApplication: (data) =>
    fetchJSON('/api/careers/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  /** Upload resume - POST /api/careers/upload-resume */
  uploadResume: (formData) =>
    fetch(`${API_BASE}/api/careers/upload-resume`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json()),

  // Admin Careers APIs
  /** Get all jobs (admin) - GET /api/careers/admin/jobs */
  getJobsAdmin: (token) =>
    fetchJSON('/api/careers/admin/jobs', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Create job (admin) - POST /api/careers/admin/jobs */
  createJob: (data, token) =>
    fetchJSON('/api/careers/admin/jobs', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  /** Update job (admin) - PUT /api/careers/admin/jobs/:id */
  updateJob: (id, data, token) =>
    fetchJSON(`/api/careers/admin/jobs/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  /** Delete job (admin) - DELETE /api/careers/admin/jobs/:id */
  deleteJob: (id, token) =>
    fetchJSON(`/api/careers/admin/jobs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Toggle job status (admin) - PATCH /api/careers/admin/jobs/:id/toggle */
  toggleJob: (id, token) =>
    fetchJSON(`/api/careers/admin/jobs/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Get all applications (admin) - GET /api/careers/admin/applications */
  getApplicationsAdmin: (filters = {}, token) => {
    const params = new URLSearchParams();
    if (filters.job_id) params.append('job_id', filters.job_id);
    if (filters.status) params.append('status', filters.status);
    const queryString = params.toString();
    return fetchJSON(`/api/careers/admin/applications${queryString ? '?' + queryString : ''}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    });
  },

  /** Get application details (admin) - GET /api/careers/admin/applications/:id */
  getApplicationDetails: (id, token) =>
    fetchJSON(`/api/careers/admin/applications/${id}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Update application status (admin) - PATCH /api/careers/admin/applications/:id/status */
  updateApplicationStatus: (id, data, token) =>
    fetchJSON(`/api/careers/admin/applications/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  /** Delete application (admin) - DELETE /api/careers/admin/applications/:id */
  deleteApplication: (id, token) =>
    fetchJSON(`/api/careers/admin/applications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Get careers stats (admin) - GET /api/careers/admin/stats */
  getCareersStats: (token) =>
    fetchJSON('/api/careers/admin/stats', {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  // ==========================================================================
  // BLOG APIs
  // ==========================================================================

  /** Get all blogs - GET /api/blogs */
  blogs: (params = {}) => {
    const queryString = new URLSearchParams({ ...params, _t: Date.now() }).toString();
    return fetchJSON(`/api/blogs?${queryString}`);
  },

  /** Get blog categories - GET /api/blogs/categories */
  blogCategories: () => fetchJSON(`/api/blogs/categories?_t=${Date.now()}`),

  /** Get featured blogs - GET /api/blogs/featured */
  featuredBlogs: (limit = 5) => fetchJSON(`/api/blogs/featured?limit=${limit}&_t=${Date.now()}`),

  /** Get blogs by category - GET /api/blogs/category/:categorySlug */
  blogsByCategory: (categorySlug, params = {}) => {
    const queryString = new URLSearchParams({ ...params, _t: Date.now() }).toString();
    return fetchJSON(`/api/blogs/category/${categorySlug}?${queryString}`);
  },

  /** Get blog detail - GET /api/blogs/:idOrSlug */
  blogDetail: (idOrSlug) => fetchJSON(`/api/blogs/${idOrSlug}?_t=${Date.now()}`),

  /** Get all blogs (admin) - GET /api/blogs/admin/all */
  adminBlogs: (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchJSON(`/api/blogs/admin/all${queryString ? `?${queryString}` : ''}`, {
      headers: { Authorization: `Bearer ${token || getToken()}` },
    });
  },

  /** Create blog (admin) - POST /api/blogs/admin */
  createBlog: (formData, token) =>
    fetch(`${API_BASE}/api/blogs/admin`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token || getToken()}`,
      },
      body: formData,
    }).then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && (data.message || data.error)) || `Request failed ${res.status}`);
      }
      return data;
    }),

  /** Update blog (admin) - PUT /api/blogs/admin/:id */
  updateBlog: (id, formData, token) =>
    fetch(`${API_BASE}/api/blogs/admin/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token || getToken()}`,
      },
      body: formData,
    }).then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && (data.message || data.error)) || `Request failed ${res.status}`);
      }
      return data;
    }),

  /** Delete blog (admin) - DELETE /api/blogs/admin/:id */
  deleteBlog: (id, token) =>
    fetchJSON(`/api/blogs/admin/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Toggle blog publish (admin) - PATCH /api/blogs/admin/:id/publish */
  toggleBlogPublish: (id, token) =>
    fetchJSON(`/api/blogs/admin/${id}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Toggle blog featured (admin) - PATCH /api/blogs/admin/:id/featured */
  toggleBlogFeatured: (id, token) =>
    fetchJSON(`/api/blogs/admin/${id}/featured`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),

  /** Create blog category (admin) - POST /api/blogs/admin/categories */
  createBlogCategory: (data, token) =>
    fetchJSON('/api/blogs/admin/categories', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  /** Update blog category (admin) - PUT /api/blogs/admin/categories/:id */
  updateBlogCategory: (id, data, token) =>
    fetchJSON(`/api/blogs/admin/categories/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  /** Delete blog category (admin) - DELETE /api/blogs/admin/categories/:id */
  deleteBlogCategory: (id, token) =>
    fetchJSON(`/api/blogs/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || getToken()}` },
    }),
};

export default api;
