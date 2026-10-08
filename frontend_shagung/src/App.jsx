 

import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import AutoScrollToTop from './components/AutoScrollToTop'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Account from './pages/Account'
import Brand from './pages/Brand'
import Community from './pages/Community'
import Help from './pages/Help'
import AuthCartSync from './components/AuthCartSync'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ToastContext'
import VerifyEmail from './pages/VerifyEmail'
import ResetPassword from './pages/ResetPassword'

import AdminRoute from './components/AdminRoute'

// Lazy load pages for better performance
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const Orders = lazy(() => import('./pages/Orders'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const SalePage = lazy(() => import('./pages/SalePage'))
const Blogs = lazy(() => import('./pages/Blogs'))
const BlogDetail = lazy(() => import('./pages/BlogDetail'))

// Company Pages
const AboutUs = lazy(() => import('./pages/Company/AboutUs'))
const OurStory = lazy(() => import('./pages/Company/OurStory'))
const Careers = lazy(() => import('./pages/Careers'))
const Press = lazy(() => import('./pages/Company/Press'))
const Sustainability = lazy(() => import('./pages/Company/Sustainability'))

// Support Pages
const ContactUs = lazy(() => import('./pages/Support/ContactUs'))
const FAQs = lazy(() => import('./pages/Support/FAQs'))
const ShippingInfo = lazy(() => import('./pages/Support/ShippingInfo'))
const Returns = lazy(() => import('./pages/Support/Returns'))
const SizeGuide = lazy(() => import('./pages/Support/SizeGuide'))
const PrivacyPolicy = lazy(() => import('./pages/Support/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/Support/TermsOfService'))
const CookiePolicy = lazy(() => import('./pages/Support/CookiePolicy'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetail'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminCustomers = lazy(() => import('./pages/admin/Customers'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminReviews = lazy(() => import('./pages/admin/Reviews'))
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'))
const AdminNewsletter = lazy(() => import('./pages/admin/Newsletter'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminSales = lazy(() => import('./pages/admin/Sales'))
const AdminHero = lazy(() => import('./pages/admin/Hero'))
const AdminCareers = lazy(() => import('./pages/admin/Careers'))
const AdminBlogs = lazy(() => import('./pages/admin/Blogs'))
const AdminRelatedProducts = lazy(() => import('./pages/admin/RelatedProducts'))

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
)

import { ScrollProgress } from './components/ui/ScrollProgress'

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ScrollProgress />
        <AutoScrollToTop />
        <AuthCartSync />
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/product/:id" element={<ProductDetail />} />

              {/* Shopping Routes */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/sale" element={<SalePage />} />

              {/* User Account Routes */}
              <Route path="/account" element={<Account />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order/:orderId" element={<OrderDetail />} />

              {/* Company Routes */}
              <Route path="/about" element={<AboutUs />} />
              <Route path="/story" element={<OurStory />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/press" element={<Press />} />
              <Route path="/sustainability" element={<Sustainability />} />

              {/* Support Routes */}
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/shipping" element={<ShippingInfo />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/size-guide" element={<SizeGuide />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />

              {/* Admin Routes - Protected */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/orders/:orderId" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/related-products" element={<AdminRoute><AdminRelatedProducts /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
              <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
              <Route path="/admin/newsletter" element={<AdminRoute><AdminNewsletter /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/sales" element={<AdminRoute><AdminSales /></AdminRoute>} />
              <Route path="/admin/hero" element={<AdminRoute><AdminHero /></AdminRoute>} />
              <Route path="/admin/careers" element={<AdminRoute><AdminCareers /></AdminRoute>} />
              <Route path="/admin/blogs" element={<AdminRoute><AdminBlogs /></AdminRoute>} />

              {/* Blog Routes */}
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />

              {/* Other Routes */}
              <Route path="/brand" element={<Brand />} />
              <Route path="/community" element={<Community />} />
              <Route path="/help" element={<Help />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />


              {/* 404 - Redirect to home */}
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}

export default App

