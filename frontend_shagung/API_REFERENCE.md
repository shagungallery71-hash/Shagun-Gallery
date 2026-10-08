# API Quick Reference - Shagung E-commerce

## Environment Setup

```env
# .env
VITE_API_URL=http://localhost:5000
```

---

## API Usage Examples

### Import
```javascript
import { api } from './api/client';
import { authApi } from './api/auth';
import { useAuth } from './context/AuthContext';
```

---

## Authentication

```javascript
// Login
const result = await authApi.login({ email, password });
// Returns: { success, token, user }

// Register
await authApi.register({ username, email, password });

// Forgot Password
await authApi.forgetPassword({ email });

// Verify OTP
await authApi.verifyOtp({ email, otp });

// Reset Password
await authApi.resetPassword({ email, otp, newPassword });
```

---

## Products

```javascript
// Get all products (paginated)
const { data, pagination } = await api.products({ page: 1, limit: 20 });

// Get single product
const product = await api.productDetail(productId);

// Get featured products
const featured = await api.featuredProducts(8);

// Get products by category
const products = await api.productsByCategoryId(categoryId);

// Get related products
const related = await api.relatedProducts(productId);

// Search products
const results = await api.searchProducts('query', { limit: 20 });

// Get search suggestions
const suggestions = await api.searchSuggestions('query');
```

---

## Categories

```javascript
// All categories with subcategories
const categories = await api.categoriesWithSub();

// Main categories only
const main = await api.mainCategories();

// Subcategories of a parent
const subs = await api.subcategories(parentId);
```

---

## Cart (Requires Auth)

```javascript
const { token } = useAuth();

// Get cart
const cart = await api.getCart(token);

// Add to cart
await api.addToCart({ productId, variantId, quantity: 1 }, token);

// Update quantity
await api.updateCartItem(itemId, newQuantity, token);

// Remove item
await api.removeFromCart(itemId, token);

// Clear cart
await api.clearCart(token);

// Get cart count
const { count } = await api.getCartCount(token);

// Apply coupon
await api.applyCoupon(couponCode, token);
```

---

## Wishlist (Requires Auth)

```javascript
const { token } = useAuth();

// Get wishlist
const wishlist = await api.getWishlist(token);

// Toggle wishlist (add/remove)
await api.toggleWishlist(productId, token);

// Check if in wishlist
const { isInWishlist } = await api.checkWishlist(productId, token);

// Move to cart
await api.moveToCart({ productId, variantId }, token);
```

---

## Orders (Requires Auth)

```javascript
const { token } = useAuth();

// Create order
const order = await api.createOrder({
  addressId,
  paymentMethod: 'online', // or 'cod'
  items: [{ productId, variantId, quantity }],
}, token);

// Get user's orders
const { data: orders } = await api.getUserOrders({ page: 1 }, token);

// Get single order
const order = await api.getOrder(orderId, token);

// Cancel order
await api.cancelOrder(orderId, 'reason', token);

// Track order (no auth needed)
const tracking = await api.trackOrder(orderNumber, email);
```

---

## Addresses (Requires Auth)

```javascript
const { token } = useAuth();

// Get all addresses
const addresses = await api.getAddresses(token);

// Add address
await api.addAddress({
  full_name, phone, address_line1, address_line2,
  city, state, pincode, country, is_default
}, token);

// Update address
await api.updateAddress(addressId, addressData, token);

// Delete address
await api.deleteAddress(addressId, token);

// Set as default
await api.setDefaultAddress(addressId, token);
```

---

## Reviews (Requires Auth)

```javascript
const { token } = useAuth();

// Get product reviews
const reviews = await api.getReviews(productId, page, limit);

// Add review
await api.createReview(productId, { rating, comment }, token);

// Add review with image
const formData = new FormData();
formData.append('rating', 5);
formData.append('comment', 'Great product!');
formData.append('image', imageFile);
await api.createReviewWithImage(productId, formData, token);
```

---

## Sales

```javascript
// Get active sales
const sales = await api.getActiveSales();

// Get products on sale
const products = await api.getSaleProducts({ page: 1, limit: 20 });

// Get sale details
const sale = await api.getSaleById(saleId);

// Check if product is on sale
const status = await api.getProductSaleStatus(productId);
```

---

## Blogs

```javascript
// Get all blogs
const blogs = await api.blogs({ page: 1, limit: 10 });

// Get blog categories
const categories = await api.blogCategories();

// Get featured blogs
const featured = await api.featuredBlogs(5);

// Get blogs by category
const blogs = await api.blogsByCategory('fashion');

// Get blog detail
const blog = await api.blogDetail('blog-slug-or-id');
```

---

## Careers

```javascript
// Get active jobs
const jobs = await api.getJobs({ department: 'Design' });

// Get job details
const job = await api.getJobDetails(jobId);

// Get departments
const departments = await api.getDepartments();

// Submit application
await api.submitApplication({
  job_id, full_name, email, phone,
  resume_url, cover_letter
});

// Upload resume
const formData = new FormData();
formData.append('resume', file);
const { url } = await api.uploadResume(formData);
```

---

## Newsletter

```javascript
// Subscribe
await api.subscribeNewsletter(email);

// Unsubscribe
await api.unsubscribeNewsletter(email);
```

---

## Admin APIs (Requires Admin Token)

```javascript
const { token } = useAuth();

// Dashboard stats
const stats = await api.getAdminStats(token);

// Admin order management
const orders = await api.getAllOrders({ page: 1, status: 'pending' }, token);
await api.updateOrderStatus(orderId, { status: 'shipped', trackingNumber }, token);

// Admin product management
await api.createProduct(productData, token);
await api.updateProduct(productId, productData, token);
await api.deleteProduct(productId, token);

// Admin category management
await api.createCategory(categoryData, token);
await api.updateCategory(categoryId, categoryData, token);
await api.deleteCategory(categoryId, token);

// Admin sales management
await api.createSale(saleData, token);
await api.updateSale(saleId, saleData, token);
await api.deleteSale(saleId, token);

// Admin blog management
await api.createBlog(formData, token);
await api.updateBlog(blogId, formData, token);
await api.deleteBlog(blogId, token);
await api.toggleBlogPublish(blogId, token);

// Admin careers management
await api.createJob(jobData, token);
await api.updateJob(jobId, jobData, token);
await api.deleteJob(jobId, token);
await api.getApplicationsAdmin({ job_id, status }, token);
await api.updateApplicationStatus(appId, { status }, token);

// Admin newsletter
const subscribers = await api.getNewsletterSubscribers({}, token);
const csvBlob = await api.exportNewsletterSubscribers(token);
```

---

## Error Handling

```javascript
try {
  const result = await api.someEndpoint(data, token);
  // Handle success
} catch (error) {
  console.error(error.message);
  // error.message contains backend error message
}
```

---

## Response Patterns

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
