# Shagung E-commerce Frontend - Developer Guide

> **Last Updated:** December 26, 2024  
> **Framework:** React 18 + Vite  
> **Styling:** TailwindCSS  

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Environment Configuration](#environment-configuration)
3. [API Architecture](#api-architecture)
4. [Authentication Flow](#authentication-flow)
5. [Frontend Routes](#frontend-routes)
6. [API Reference](#api-reference)
7. [State Management](#state-management)
8. [Development Guidelines](#development-guidelines)

---

## Project Structure

```
frontend_shagung/
├── public/                    # Static assets
├── src/
│   ├── api/                   # API client modules
│   │   ├── client.js          # Main API client (products, orders, etc.)
│   │   └── auth.js            # Authentication API
│   ├── components/            # Reusable UI components
│   ├── context/               # React Context providers
│   │   ├── AuthContext.jsx    # Authentication state
│   │   └── CartContext.jsx    # Cart state management
│   ├── pages/                 # Page components
│   │   ├── admin/             # Admin panel pages
│   │   ├── Company/           # Company info pages
│   │   ├── Support/           # Support/help pages
│   │   └── ProductDetails/    # Product detail components
│   ├── utils/                 # Utility functions
│   ├── App.jsx                # Main app with routes
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── .env                       # Environment variables
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Environment Configuration

### `.env` File

```env
VITE_API_URL=http://localhost:5000
```

### Usage in Code

```javascript
// All API calls use this pattern:
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### Environment Files

| File | Purpose |
|------|---------|
| `.env` | Default/Development environment |
| `.env.production` | Production build variables |
| `.env.local` | Local overrides (gitignored) |

---

## API Architecture

### API Client Structure

The frontend uses two main API modules:

#### 1. `src/api/client.js` (Main API)
- Central API client for most endpoints
- Handles authentication headers automatically
- Includes cache-busting for real-time data

#### 2. `src/api/auth.js` (Auth API)
- Handles authentication operations
- Login, register, password reset, etc.

### How API Calls Work

```javascript
// Import the API client
import { api } from '../api/client';

// Making a GET request
const products = await api.products({ page: 1, limit: 20 });

// Making a POST request with auth
const order = await api.createOrder(orderData, token);

// Using auth API
import { authApi } from '../api/auth';
const result = await authApi.login({ email, password });
```

### Token Management

- Tokens are stored in **cookies** via `cookieStorage` utility
- Token is automatically included in protected API calls
- Token retrieval: `cookieStorage.getItem('token')`

---

## Authentication Flow

### Login Flow
```
1. User submits email/password
2. authApi.login() → POST /api/auth/login
3. Backend returns { success, token, user }
4. Token stored in cookies
5. AuthContext updates user state
6. User redirected to account/home
```

### Registration Flow
```
1. User submits registration form
2. authApi.register() → POST /api/auth/register
3. Verification email sent
4. User clicks email link
5. authApi.verifyEmail() confirms
6. User can now login
```

### Password Reset Flow
```
1. User requests reset → authApi.forgetPassword()
2. OTP sent to email
3. User enters OTP → authApi.verifyOtp()
4. User sets new password → authApi.resetPassword()
```

---

## Frontend Routes

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Homepage with hero, featured products |
| `/products` | `Products` | Product listing with filters |
| `/products/:id` | `ProductDetail` | Single product page |
| `/product/:id` | `ProductDetail` | Alias for product detail |
| `/cart` | `Cart` | Shopping cart |
| `/checkout` | `Checkout` | Checkout process |
| `/wishlist` | `Wishlist` | User wishlist |
| `/sale` | `SalePage` | Sale/discount products |

### User Account Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/account` | `Account` | User profile & settings |
| `/orders` | `Orders` | Order history |
| `/order/:orderId` | `OrderDetail` | Single order details |
| `/order-success/:orderId` | `OrderSuccess` | Order confirmation |

### Company Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/about` | `AboutUs` | About the company |
| `/story` | `OurStory` | Brand story |
| `/careers` | `Careers` | Job listings |
| `/press` | `Press` | Press/media |
| `/sustainability` | `Sustainability` | Sustainability info |

### Support Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/contact` | `ContactUs` | Contact form |
| `/faqs` | `FAQs` | Frequently asked questions |
| `/shipping` | `ShippingInfo` | Shipping information |
| `/returns` | `Returns` | Return policy |
| `/size-guide` | `SizeGuide` | Size chart |

### Blog Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/blogs` | `Blogs` | Blog listing |
| `/blog/:slug` | `BlogDetail` | Single blog post |

### Auth Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/verify-email` | `VerifyEmail` | Email verification |
| `/reset-password` | `ResetPassword` | Password reset |

### Admin Routes (Protected)

All admin routes require authentication and admin role.

| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | `AdminDashboard` | Dashboard with stats |
| `/admin/dashboard` | `AdminDashboard` | Dashboard alias |
| `/admin/orders` | `AdminOrders` | Order management |
| `/admin/orders/:orderId` | `AdminOrderDetail` | Order details |
| `/admin/products` | `AdminProducts` | Product management |
| `/admin/categories` | `AdminCategories` | Category management |
| `/admin/users` | `AdminUsers` | User management |
| `/admin/customers` | `AdminCustomers` | Customer list |
| `/admin/reviews` | `AdminReviews` | Review moderation |
| `/admin/coupons` | `AdminCoupons` | Coupon management |
| `/admin/newsletter` | `AdminNewsletter` | Newsletter subscribers |
| `/admin/settings` | `AdminSettings` | Site settings |
| `/admin/sales` | `AdminSales` | Sale events |
| `/admin/hero` | `AdminHero` | Homepage hero slider |
| `/admin/careers` | `AdminCareers` | Job postings |
| `/admin/blogs` | `AdminBlogs` | Blog management |

---

## API Reference

### Authentication APIs (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | User registration | No |
| POST | `/login` | User login | No |
| GET | `/verify` | Email verification | No |
| POST | `/forget-password` | Request password reset | No |
| POST | `/verify-otp` | Verify OTP | No |
| POST | `/reset-password` | Reset password | No |
| POST | `/create-admin` | Create admin user | Yes (Admin) |
| DELETE | `/delete-user` | Delete user | Yes (Admin) |

### Category APIs (`/api/categories`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | All categories with subcategories | No |
| GET | `/main` | Main categories only | No |
| GET | `/sub/:parentId` | Subcategories by parent | No |
| POST | `/` | Create category | Yes (Admin) |
| POST | `/sub` | Create subcategory | Yes (Admin) |
| PUT | `/:id` | Update category | Yes (Admin) |
| DELETE | `/:id` | Delete category | Yes (Admin) |

### Product APIs (`/api/products`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | All products (paginated) | No |
| GET | `/:id` | Product detail | No |
| GET | `/featured` | Featured products | No |
| GET | `/category/:categoryId` | Products by category | No |
| GET | `/:id/related` | Related products | No |
| GET | `/:id/reviews` | Product reviews | No |
| POST | `/` | Create product | Yes (Admin) |
| PUT | `/:id` | Update product | Yes (Admin) |
| DELETE | `/:id` | Delete product | Yes (Admin) |
| POST | `/:id/review` | Add review | Yes (User) |
| POST | `/variant` | Create variant | Yes (Admin) |
| PUT | `/variant/:id` | Update variant | Yes (Admin) |
| DELETE | `/variant/:id` | Delete variant | Yes (Admin) |
| POST | `/image` | Upload image | Yes (Admin) |
| DELETE | `/image/:id` | Delete image | Yes (Admin) |

### Search APIs (`/api/search`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/?q=` | Search products | No |
| GET | `/suggestions?q=` | Search suggestions | No |
| GET | `/trending` | Trending searches | No |

### Cart APIs (`/api/cart`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get cart | Yes |
| POST | `/` | Add to cart | Yes |
| PUT | `/:itemId` | Update cart item | Yes |
| DELETE | `/:itemId` | Remove from cart | Yes |
| DELETE | `/` | Clear cart | Yes |
| GET | `/count` | Get cart count | Yes |
| POST | `/coupon` | Apply coupon | Yes |

### Wishlist APIs (`/api/wishlist`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get wishlist | Yes |
| POST | `/` | Add to wishlist | Yes |
| POST | `/toggle` | Toggle wishlist item | Yes |
| DELETE | `/:productId` | Remove from wishlist | Yes |
| GET | `/check/:productId` | Check if in wishlist | Yes |
| POST | `/move-to-cart` | Move to cart | Yes |

### Address APIs (`/api/addresses`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get user addresses | Yes |
| POST | `/` | Add address | Yes |
| PUT | `/:id` | Update address | Yes |
| DELETE | `/:id` | Delete address | Yes |
| PUT | `/:id/default` | Set default address | Yes |

### Order APIs (`/api/orders`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | User's orders | Yes |
| GET | `/:orderId` | Order detail | Yes |
| POST | `/` | Create order | Yes |
| POST | `/:orderId/cancel` | Cancel order | Yes |
| GET | `/track/:orderNumber` | Track order | No |
| GET | `/admin/all` | All orders (Admin) | Yes (Admin) |
| PATCH | `/admin/:id/status` | Update status | Yes (Admin) |

### Payment APIs (`/api/payments`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/offers` | Payment offers | Yes |
| POST | `/create-intent` | Create payment | Yes |
| POST | `/verify` | Verify payment | Yes |
| POST | `/confirm` | Confirm payment | Yes |
| GET | `/status/:orderId` | Payment status | Yes |
| POST | `/refund` | Create refund | Yes (Admin) |

### Sales APIs (`/api/sales`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/active` | Active sales | No |
| GET | `/products` | Sale products | No |
| GET | `/:id` | Sale details | No |
| GET | `/` | All sales (Admin) | Yes (Admin) |
| POST | `/` | Create sale | Yes (Admin) |
| PUT | `/:id` | Update sale | Yes (Admin) |
| DELETE | `/:id` | Delete sale | Yes (Admin) |

### Hero Section APIs (`/api/hero`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/slides` | Active slides | No |
| GET | `/settings` | Hero settings | No |
| GET | `/admin/slides` | All slides | Yes (Admin) |
| POST | `/slides` | Create slide | Yes (Admin) |
| PUT | `/slides/:id` | Update slide | Yes (Admin) |
| DELETE | `/slides/:id` | Delete slide | Yes (Admin) |
| PATCH | `/slides/:id/toggle` | Toggle slide | Yes (Admin) |

### Careers APIs (`/api/careers`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/jobs` | Active jobs | No |
| GET | `/jobs/:id` | Job details | No |
| GET | `/departments` | Departments | No |
| POST | `/apply` | Submit application | No |
| POST | `/upload-resume` | Upload resume | No |
| GET | `/admin/jobs` | All jobs | Yes (Admin) |
| POST | `/admin/jobs` | Create job | Yes (Admin) |
| PUT | `/admin/jobs/:id` | Update job | Yes (Admin) |
| DELETE | `/admin/jobs/:id` | Delete job | Yes (Admin) |
| GET | `/admin/applications` | All applications | Yes (Admin) |
| PATCH | `/admin/applications/:id/status` | Update status | Yes (Admin) |

### Blog APIs (`/api/blogs`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | All blogs | No |
| GET | `/categories` | Blog categories | No |
| GET | `/featured` | Featured blogs | No |
| GET | `/category/:slug` | Blogs by category | No |
| GET | `/:idOrSlug` | Blog detail | No |
| GET | `/admin/all` | All blogs (Admin) | Yes (Admin) |
| POST | `/admin` | Create blog | Yes (Admin) |
| PUT | `/admin/:id` | Update blog | Yes (Admin) |
| DELETE | `/admin/:id` | Delete blog | Yes (Admin) |
| PATCH | `/admin/:id/publish` | Toggle publish | Yes (Admin) |
| PATCH | `/admin/:id/featured` | Toggle featured | Yes (Admin) |

### Newsletter APIs (`/api/newsletter`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Subscribe | No |
| DELETE | `/` | Unsubscribe | No |
| GET | `/subscribers` | Get subscribers | Yes (Admin) |
| GET | `/export` | Export CSV | Yes (Admin) |

### Admin APIs (`/api/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/stats` | Dashboard stats | Yes (Admin) |
| GET | `/customers` | All customers | Yes (Admin) |
| GET | `/customers/:id` | Customer detail | Yes (Admin) |
| GET | `/reviews` | All reviews | Yes (Admin) |
| PATCH | `/reviews/:id/approve` | Approve review | Yes (Admin) |
| DELETE | `/reviews/:id` | Delete review | Yes (Admin) |
| GET | `/users` | All users | Yes (Admin) |
| PATCH | `/users/:id/verify` | Toggle verified | Yes (Admin) |
| PATCH | `/users/:id/role` | Update role | Yes (Admin) |
| POST | `/clear-cache` | Clear cache | Yes (Admin) |

---

## State Management

### AuthContext

Manages user authentication state.

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, token, login, logout, isAuthenticated } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';
}
```

### CartContext

Manages shopping cart state.

```javascript
import { useCart } from '../context/CartContext';

function MyComponent() {
  const { 
    cart, 
    cartCount, 
    addToCart, 
    removeFromCart, 
    updateQuantity,
    clearCart 
  } = useCart();
}
```

---

## Development Guidelines

### Making API Calls

1. **Always use the API client**
```javascript
// ✅ Good
import { api } from '../api/client';
const data = await api.products();

// ❌ Bad - Don't use fetch directly
const data = await fetch('/api/products');
```

2. **Handle errors properly**
```javascript
try {
  const result = await api.createOrder(orderData, token);
  // Handle success
} catch (error) {
  // error.message contains the error from backend
  console.error(error.message);
}
```

3. **Protected routes require token**
```javascript
const { token } = useAuth();
const orders = await api.getUserOrders({}, token);
```

### Adding New API Endpoints

1. Add the method to `src/api/client.js`:
```javascript
/** Description - METHOD /api/endpoint */
newEndpoint: (params, token) =>
  fetchJSON('/api/endpoint', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(params),
  }),
```

2. Use in component:
```javascript
const result = await api.newEndpoint(data, token);
```

### Adding New Routes

1. Create page component in `src/pages/`
2. Import in `App.jsx`
3. Add route:
```jsx
<Route path="/new-page" element={<NewPage />} />
```

For protected routes:
```jsx
<Route 
  path="/admin/new-page" 
  element={<AdminRoute><AdminNewPage /></AdminRoute>} 
/>
```

### Code Style

- Use **functional components** with hooks
- Use **TailwindCSS** for styling
- Follow **ESLint** rules
- Use **async/await** for API calls
- Add JSDoc comments for complex functions

---

## Running the Project

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker
```bash
docker build -t shagung-frontend .
docker run -p 3000:80 shagung-frontend
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| API calls failing | Check `.env` has correct `VITE_API_URL` |
| 401 Unauthorized | Token expired, user needs to re-login |
| CORS errors | Backend needs to allow frontend origin |
| Build errors | Clear `node_modules` and reinstall |

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

---

## Contact

For questions or issues, contact the development team.
