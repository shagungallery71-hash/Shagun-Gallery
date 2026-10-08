import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Package, MapPin, Heart, Settings, LogOut,
  Plus, Edit2, Trash2, CheckCircle, Clock, ChevronRight,
  Truck, RefreshCw, XCircle, Mail, ShoppingBag
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastContext'
import { api } from '../api/client'
import { authApi } from '../api/auth'
import Login from './Login'

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const OrderStatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', classes: 'border-amber-200 text-amber-700 bg-amber-50', icon: Clock },
    confirmed: { label: 'Confirmed', classes: 'border-blue-200 text-blue-700 bg-blue-50', icon: CheckCircle },
    processing: { label: 'Processing', classes: 'border-rose-200 text-rose-700 bg-rose-50', icon: RefreshCw },
    shipped: { label: 'Shipped', classes: 'border-indigo-200 text-indigo-700 bg-indigo-50', icon: Truck },
    delivered: { label: 'Delivered', classes: 'border-emerald-200 text-emerald-700 bg-emerald-50', icon: CheckCircle },
    cancelled: { label: 'Cancelled', classes: 'border-red-200 text-red-700 bg-red-50', icon: XCircle },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${c.classes}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
};

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => (
  <div className={`p-6 border transition-all ${address.is_default ? 'border-teal-700 bg-teal-50/60' : 'border-teal-200 bg-white hover:border-teal-400'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-teal-900 tracking-widest uppercase flex items-center gap-2">
          {address.address_type}
        </span>
        {address.is_default && (
          <span className="px-2 py-0.5 bg-teal-700 text-white text-[9px] font-bold uppercase tracking-widest">
            Default
          </span>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={() => onEdit(address)} className="text-teal-400 hover:text-teal-900 transition-colors uppercase text-[10px] tracking-widest flex items-center gap-1 font-bold">
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={() => onDelete(address.id)} className="text-teal-400 hover:text-red-600 transition-colors uppercase text-[10px] tracking-widest flex items-center gap-1 font-bold">
          <Trash2 className="w-3.5 h-3.5" /> Remove
        </button>
      </div>
    </div>
    <div className="space-y-1.5 text-sm text-teal-700 leading-relaxed font-sans">
      <p className="font-semibold text-teal-900">{address.full_name}</p>
      <p>{address.address_line1}</p>
      {address.address_line2 && <p>{address.address_line2}</p>}
      <p>{address.city}, {address.state} - {address.postal_code}</p>
      <p className="uppercase tracking-widest text-xs mt-1 text-teal-500">{address.country}</p>
      <p className="mt-3 text-teal-500 text-xs tracking-wide">T: {address.phone}</p>
    </div>
    {!address.is_default && (
      <button
        onClick={() => onSetDefault(address.id)}
        className="mt-6 text-[10px] uppercase tracking-widest text-teal-600 font-bold hover:text-teal-900 transition-colors border-b border-teal-300 hover:border-teal-900 pb-0.5"
      >
        Set as Default
      </button>
    )}
  </div>
)

const OrderItem = ({ order }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-amber-200 bg-white hover:border-amber-400 transition-colors group">
      <div className="p-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <Package strokeWidth={1.5} className="w-6 h-6" />
            </div>
            <div>
              <p className="font-serif text-lg text-amber-900 tracking-wide mb-1">Order #{order.order_number}</p>
              <p className="text-xs text-amber-600/70 tracking-widest uppercase">
                {new Date(order.created_at).toLocaleDateString()} &nbsp;|&nbsp; {order.items?.length || 0} Items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 border-amber-100 pt-4 md:pt-0 mt-2 md:mt-0">
            <div className="text-left md:text-right">
              <p className="font-serif text-lg text-amber-900 mb-1">₹{parseFloat(order.total).toFixed(2)}</p>
              <OrderStatusBadge status={order.status} />
            </div>
            <ChevronRight className={`w-5 h-5 text-amber-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-50/60 border-t border-amber-200 p-6 space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex gap-4 bg-white p-4 border border-amber-100 items-center">
                  <div className="w-16 h-20 bg-amber-50 shrink-0 overflow-hidden">
                    <img src={item.product_image || item.image || '/placeholder.jpg'} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-amber-900 text-base line-clamp-1 mb-1">{item.product_name}</p>
                    <p className="text-xs text-amber-600/70 tracking-widest uppercase">Size: {item.size} &nbsp;|&nbsp; Qty: {item.quantity}</p>
                    <p className="text-amber-800 font-semibold mt-2">₹{item.price}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <Link to={`/order/${order.id}`} className="text-xs uppercase tracking-widest font-bold text-amber-700 hover:text-amber-900 border-b border-amber-400 hover:border-amber-900 pb-1 transition-colors">
                  View Full Details
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// MAIN ACCOUNT PAGE
// ============================================================================

export default function Account() {
  const { user, token, loading, signIn, signUp, signOut, sendForgotPassword } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Auth State
  const [authMode, setAuthMode] = useState('login')
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [authLoading, setAuthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newResetPassword, setNewResetPassword] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [otpAttempts, setOtpAttempts] = useState(0)

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [otpTimer])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Dashboard State
  const [activeTab, setActiveTab] = useState('dashboard')

  // Data State
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [wishlistCount, setWishlistCount] = useState(0)

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({
    full_name: '', phone: '', email: '',
    address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '',
    address_type: 'home', is_default: false
  })

  // Effects
  useEffect(() => {
    if (location.search.includes('verified=true')) {
      showToast('Email verified successfully!', 'success')
    }
  }, [location])

  useEffect(() => {
    if (user && user.role?.toLowerCase() === 'admin') {
      navigate('/admin')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user && token && user.role?.toLowerCase() !== 'admin') {
      fetchDashboardData()
    }
  }, [user, token, activeTab])

  const fetchDashboardData = async () => {
    if (!token || !user) return

    if (activeTab === 'orders' || activeTab === 'dashboard') {
      try {
        const res = await api.getUserOrders({ limit: 5 }, token)
        setOrders(res.orders || [])
      } catch (e) {
        if (e.message?.includes('Session expired') || e.message?.includes('Invalid token') || e.message?.includes('No authentication')) return
        console.error('Error fetching orders:', e.message)
      }
    }

    if (!token) return

    if (activeTab === 'addresses' || activeTab === 'dashboard') {
      try {
        const res = await api.getAddresses(token)
        setAddresses(res.addresses || [])
      } catch (e) {
        if (e.message?.includes('Session expired') || e.message?.includes('Invalid token') || e.message?.includes('No authentication')) return
        console.error('Error fetching addresses:', e.message)
      }
    }

    if (!token) return

    if (activeTab === 'wishlist' || activeTab === 'dashboard') {
      try {
        const res = await api.getWishlist(token)
        setWishlistCount(res.wishlist?.length || 0)
      } catch (e) { }
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      if (authMode === 'login') {
        const authUser = await signIn({ email: formData.email, password: formData.password })
        showToast('Welcome back!', 'success')
        navigate('/products')
      } else {
        await signUp(formData)
        showToast('Account created! Please verify your email.', 'success')
        setAuthMode('login')
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAddress) {
        await api.updateAddress(editingAddress.id, addressForm)
        showToast('Address updated', 'success')
      } else {
        await api.addAddress(addressForm)
        showToast('Address added', 'success')
      }
      setShowAddressForm(false)
      setEditingAddress(null)
      fetchDashboardData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const deleteAddress = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.deleteAddress(id)
      showToast('Address removed', 'success')
      fetchDashboardData()
    } catch (err) { showToast(err.message, 'error') }
  }

  const setDefaultAddress = async (id) => {
    try {
      await api.setDefaultAddress(id)
      showToast('Default address updated', 'success')
      fetchDashboardData()
    } catch (err) { showToast(err.message, 'error') }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      await authApi.forgetPassword({ email: forgotEmail })
      showToast(`OTP sent to ${forgotEmail}`, 'success')
      setAuthMode('forgot_otp')
      setOtpTimer(600)
      setOtpAttempts(0)
    } catch (err) { showToast(err.message, 'error') }
    finally { setAuthLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otpAttempts >= 3) {
      showToast('Too many attempts. Please resend OTP.', 'error')
      return
    }
    setAuthLoading(true)
    try {
      await authApi.verifyOtp({ email: forgotEmail, otp })
      showToast('OTP Verified!', 'success')
      setAuthMode('forgot_reset')
    } catch (err) {
      setOtpAttempts(prev => prev + 1)
      showToast(err.message, 'error')
    } finally { setAuthLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      await authApi.resetPassword({ email: forgotEmail, otp, newPassword: newResetPassword })
      showToast('Password reset successfully! Please login.', 'success')
      setAuthMode('login')
      setForgotEmail('')
      setOtp('')
      setNewResetPassword('')
      setOtpTimer(0)
    } catch (err) { showToast(err.message, 'error') }
    finally { setAuthLoading(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50/30 text-rose-800 flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
             <div className="w-8 h-8 border border-rose-800 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
             <p className="text-xs uppercase tracking-widest text-rose-500 font-medium">Authenticating</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // --- UN-AUTHENTICATED STATE (LOGIN / SIGNUP) ---
  if (!user || !token) {
    return <Login />
  }

  // --- AUTHENTICATED DASHBOARD ---

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: User },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'track', label: 'Track Your Order', icon: Truck, link: '/orders' },
    { id: 'addresses', label: 'Address Book', icon: MapPin },
    { id: 'wishlist', label: 'Saved Items', icon: Heart },
    { id: 'settings', label: 'Account Details', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-rose-50/20 to-neutral-100 font-sans flex flex-col">
      <Header />

      {/* MOBILE TAB BAR — horizontal scroll below header */}
      <div className="md:hidden sticky top-[60px] z-30 bg-white border-b border-neutral-200 shadow-sm">
        <div className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.link) { navigate(tab.link); return; }
                  if (tab.id === 'wishlist') { navigate('/wishlist'); return; }
                  setActiveTab(tab.id)
                }}
                className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap rounded-full transition-all flex-none ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-3 h-3" strokeWidth={2} />
                {tab.label}
              </button>
            )
          })}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap rounded-full text-red-500 hover:bg-red-50 flex-none transition-all"
          >
            <LogOut className="w-3 h-3" strokeWidth={2} />
            Sign Out
          </button>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 md:px-8 pt-8 pb-16 md:pt-16 md:pb-24 max-w-7xl">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24">

          {/* SIDEBAR NAVIGATION — hidden on mobile, visible md+ */}
          <div className="hidden md:block md:w-56 lg:w-64 shrink-0">
            <div className="sticky top-28">
              <div className="mb-10 pb-8 border-b border-neutral-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-600 flex items-center justify-center text-white font-serif text-xl mb-4 shadow-md">
                  {(user.name || user.username || '?')[0].toUpperCase()}
                </div>
                <h3 className="font-serif text-xl text-neutral-900 tracking-wide mb-1 leading-tight capitalize">{user.name || user.username}</h3>
                <p className="text-xs text-neutral-400 uppercase tracking-widest break-all">{user.email}</p>
              </div>

              <nav className="space-y-0.5">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.link) { navigate(tab.link); return; }
                        if (tab.id === 'wishlist') {
                          navigate('/wishlist');
                        } else {
                          setActiveTab(tab.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold transition-all ${
                        activeTab === tab.id
                          ? 'border-l-2 border-neutral-900 bg-neutral-50 text-neutral-900 pl-3.5'
                          : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50/70 border-l-2 border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
                      {tab.label}
                    </button>
                  )
                })}
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-4 text-xs uppercase tracking-widest font-bold text-neutral-400 hover:text-red-600 mt-6 border-t border-neutral-200 transition-colors border-l-2 border-transparent"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  Sign Out
                </button>
              </nav>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-8 md:space-y-12">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-serif text-neutral-900 tracking-wide">Account Overview</h2>
                      <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Welcome back, {user.name?.split(' ')[0] || user.username}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      {/* Total Orders - Amber */}
                      <div className="p-5 md:p-6 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-md hover:border-amber-400 transition-all group cursor-default">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] text-amber-700 uppercase tracking-widest font-bold">Orders</p>
                          <Package className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" strokeWidth={1.5} />
                        </div>
                        <h4 className="text-3xl md:text-4xl font-serif text-amber-900">{orders.length}</h4>
                      </div>
                      {/* Saved Locations - Teal */}
                      <div className="p-5 md:p-6 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100/50 hover:shadow-md hover:border-teal-400 transition-all group cursor-default">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] text-teal-700 uppercase tracking-widest font-bold">Addresses</p>
                          <MapPin className="w-4 h-4 text-teal-400 group-hover:text-teal-600 transition-colors" strokeWidth={1.5} />
                        </div>
                        <h4 className="text-3xl md:text-4xl font-serif text-teal-900">{addresses.length}</h4>
                      </div>
                      {/* Saved Items - Rose */}
                      <div className="p-5 md:p-6 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50 hover:shadow-md hover:border-rose-400 transition-all group cursor-default">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] text-rose-700 uppercase tracking-widest font-bold">Wishlist</p>
                          <Heart className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors" strokeWidth={1.5} />
                        </div>
                        <h4 className="text-3xl md:text-4xl font-serif text-rose-900">{wishlistCount}</h4>
                      </div>
                      {/* Status - Indigo gradient */}
                      <div className="p-5 md:p-6 rounded-xl border border-indigo-600 bg-gradient-to-br from-indigo-700 to-indigo-900 hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-default">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">Status</p>
                          <User className="w-4 h-4 text-indigo-300" strokeWidth={1.5} />
                        </div>
                        <h4 className="text-lg md:text-xl font-serif text-white tracking-wide capitalize">{user.role}</h4>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-amber-100">
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <h3 className="text-xl md:text-2xl font-serif text-amber-900 tracking-wide">Recent Orders</h3>
                          <p className="text-[10px] text-amber-600/70 uppercase tracking-widest mt-0.5">{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => setActiveTab('orders')} className="text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-900 border-b border-amber-400 pb-0.5 transition-colors">View All</button>
                      </div>
                      <div className="space-y-4">
                        {orders.slice(0, 3).map(order => (
                          <OrderItem key={order.id} order={order} />
                        ))}
                        {orders.length === 0 && (
                           <div className="py-10 rounded-xl border border-amber-100 text-center bg-amber-50/30">
                              <Package className="w-8 h-8 text-amber-300 mx-auto mb-3" strokeWidth={1} />
                              <p className="text-sm font-serif italic text-amber-600">No recent orders on record.</p>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- ORDERS TAB --- */}
                {activeTab === 'orders' && (
                  <div className="space-y-12">
                    <h2 className="text-3xl font-serif text-amber-900 tracking-wide">Order History</h2>
                    {orders.length > 0 ? (
                      <div className="space-y-6">
                        {orders.map(order => (
                          <OrderItem key={order.id} order={order} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-32 border border-amber-200 bg-amber-50/30">
                        <Package strokeWidth={1} className="w-12 h-12 text-amber-300 mx-auto mb-6" />
                        <h3 className="font-serif text-xl tracking-wide text-amber-900 mb-2">You haven't placed any orders yet.</h3>
                        <div className="w-8 h-[1px] bg-amber-300 mx-auto my-6"></div>
                        <Link to="/products" className="text-xs uppercase tracking-widest font-bold text-amber-800 hover:text-amber-500 transition-colors border-b border-amber-800 pb-1 hover:border-amber-500">Discover Collections</Link>
                      </div>
                    )}
                  </div>
                )}

                {/* --- ADDRESSES TAB --- */}
                {activeTab === 'addresses' && (
                  <div className="space-y-12">
                     <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-teal-200 pb-6">
                        <h2 className="text-3xl font-serif text-teal-900 tracking-wide">Address Book</h2>
                        <button
                           onClick={() => {
                           setEditingAddress(null)
                           setAddressForm({
                              full_name: '', phone: '', email: user.email,
                              address_line1: '', address_line2: '',
                              city: '', state: '', postal_code: '',
                              address_type: 'home', is_default: false
                           })
                           setShowAddressForm(!showAddressForm)
                           }}
                           className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 text-white text-xs font-bold uppercase tracking-widest hover:bg-teal-800 transition-colors"
                        >
                           {showAddressForm ? 'Cancel Entry' : <><Plus className="w-3.5 h-3.5" /> New Address</>}
                        </button>
                     </div>

                    {showAddressForm && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white p-8 md:p-10 border border-teal-200 overflow-hidden">
                        <h3 className="font-serif text-xl text-teal-900 tracking-wide mb-8">{editingAddress ? 'Modify Address' : 'New Address Details'}</h3>
                        <form onSubmit={handleAddressSubmit} className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                          <div className="md:col-span-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 block mb-2">Full Name</label>
                            <input required className="w-full px-4 py-3 border border-teal-200 bg-teal-50/50 focus:bg-white focus:border-teal-700 outline-none text-sm transition-colors"
                              value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 block mb-2">Phone</label>
                            <input required className="w-full px-4 py-3 border border-teal-200 bg-teal-50/50 focus:bg-white focus:border-teal-700 outline-none text-sm transition-colors"
                              value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 block mb-2">Postal Code</label>
                            <input required className="w-full px-4 py-3 border border-teal-200 bg-teal-50/50 focus:bg-white focus:border-teal-700 outline-none text-sm transition-colors uppercase tracking-widest"
                              value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} />
                          </div>
                          <div className="md:col-span-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 block mb-2">Address Line 1</label>
                            <input required placeholder="House No, Building, Street" className="w-full px-4 py-3 border border-teal-200 bg-teal-50/50 focus:bg-white focus:border-teal-700 outline-none text-sm transition-colors placeholder:text-teal-300"
                              value={addressForm.address_line1} onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })} />
                          </div>
                          <div className="md:col-span-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 block mb-2">Address Line 2 (Optional)</label>
                            <input placeholder="Area, Landmark" className="w-full px-4 py-3 border border-teal-200 bg-teal-50/50 focus:bg-white focus:border-teal-700 outline-none text-sm transition-colors placeholder:text-teal-300"
                              value={addressForm.address_line2} onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })} />
                          </div>

                          <div>
                             <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 block mb-2">City</label>
                            <input required className="w-full px-4 py-3 border border-teal-200 bg-teal-50/50 focus:bg-white focus:border-teal-700 outline-none text-sm transition-colors"
                              value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                          </div>
                          <div>
                             <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 block mb-2">State</label>
                            <input required className="w-full px-4 py-3 border border-teal-200 bg-teal-50/50 focus:bg-white focus:border-teal-700 outline-none text-sm transition-colors"
                              value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} />
                          </div>

                          <div className="flex gap-6 items-center pt-2">
                            <select className="px-4 py-2 border border-teal-200 bg-white text-xs uppercase tracking-widest font-bold text-teal-800 outline-none"
                              value={addressForm.address_type} onChange={e => setAddressForm({ ...addressForm, address_type: e.target.value })}>
                              <option value="home">Home</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </select>
                            <label className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-teal-600 cursor-pointer">
                              <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${addressForm.is_default ? 'bg-teal-700 border-teal-700' : 'bg-white border-teal-300'}`}>
                                {addressForm.is_default && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <input type="checkbox" className="hidden" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} />
                              Set As Default
                            </label>
                          </div>

                          <div className="md:col-span-2 flex items-center justify-end gap-6 mt-6 pt-6 border-t border-teal-100">
                            <button type="button" onClick={() => setShowAddressForm(false)} className="text-[10px] uppercase tracking-widest font-bold text-teal-600 hover:text-teal-900 transition-colors">Discard</button>
                            <button type="submit" className="px-8 py-3 bg-teal-700 text-white text-xs font-bold uppercase tracking-widest hover:bg-teal-800 transition-colors">Save Details</button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {addresses.map(address => (
                        <AddressCard
                          key={address.id}
                          address={address}
                          onEdit={() => {
                            setEditingAddress(address)
                            setAddressForm(address)
                            setShowAddressForm(true)
                            window.scrollTo({ top: 100, behavior: 'smooth' })
                          }}
                          onDelete={deleteAddress}
                          onSetDefault={setDefaultAddress}
                        />
                      ))}
                      {addresses.length === 0 && !showAddressForm && (
                        <div className="md:col-span-2 text-center py-24 border border-teal-200 bg-teal-50/30">
                          <MapPin strokeWidth={1} className="w-10 h-10 text-teal-300 mx-auto mb-4" />
                          <p className="font-serif italic text-teal-600">Your address book is empty.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === 'settings' && (
                  <div className="max-w-xl mx-auto md:mx-0 space-y-12">
                     <h2 className="text-3xl font-serif text-violet-900 tracking-wide border-b border-violet-200 pb-6">Account Details</h2>
                    <div className="bg-white border border-violet-200 p-8 space-y-8">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-violet-500 block mb-3">Registered Name</label>
                          <p className="text-xl font-serif text-violet-900 leading-tight">{user.name || user.username}</p>
                        </div>
                        <div className="w-12 h-[1px] bg-violet-200"></div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-violet-500 block mb-3">Email Address</label>
                          <div className="flex items-center gap-4">
                              <p className="text-base text-violet-900">{user.email}</p>
                              {user.is_verified && <span className="text-[9px] font-bold uppercase tracking-widest bg-violet-700 text-white px-2 py-0.5">Verified</span>}
                          </div>
                        </div>
                        
                        <div className="pt-8 mt-4 border-t border-violet-100">
                          <p className="text-xs text-violet-500 uppercase tracking-widest leading-relaxed">To update your credentials or manage preferences, please engage our concierge support or utilize the recovery flow at sign in.</p>
                        </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
