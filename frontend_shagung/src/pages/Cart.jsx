import { useState, useEffect, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight, Loader2, Minus, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import { CartPageSEO } from '../components/SEO';
import {
  fetchCart, updateCartItem, removeFromCart, clearCart,
  selectCartItems, selectCartTotalQty, selectCartSubtotal, selectCartStatus
} from '../store/slices/cartSlice';

// Helper to get color code
const getColorCode = (item) => item?.color_code || '#9ca3af';

const CartItem = forwardRef(({ item, onUpdateQuantity, onRemove, isUpdating }, ref) => {
  const productId = item.product_id || item.id;
  const productName = item.product_name || item.name;
  const productImage = item.image || item.primary_image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80';
  const productPrice = item.price || 0;
  const quantity = item.quantity || item.qty || 1;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex gap-4 sm:gap-6 py-6 sm:py-8 border-b border-stone-200 group relative"
    >
      <Link to={`/products/${productId}`} className="shrink-0 group-hover:opacity-90 transition-opacity">
        <div className="w-24 h-32 sm:w-36 sm:h-48 bg-stone-100 overflow-hidden shrink-0">
          <img src={productImage} alt={productName} className="w-full h-full object-cover object-center" />
        </div>
      </Link>
      
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex justify-between items-start gap-3 sm:gap-4">
          <div className="min-w-0">
            <Link to={`/products/${productId}`}>
              <h3 className="text-base sm:text-lg font-serif text-stone-900 hover:text-stone-600 transition-colors tracking-wide leading-snug line-clamp-2">
                {productName}
              </h3>
            </Link>
            {(item.size || item.color) && (
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 sm:mt-3 text-[10px] sm:text-xs text-stone-500 uppercase tracking-widest">
                {item.size && <span>Size: {item.size}</span>}
                {item.color && (
                  <span className="flex items-center gap-1.5">
                    Color: 
                    <span className="w-2.5 h-2.5 rounded-full border border-stone-300" style={{ backgroundColor: getColorCode(item) }} />
                  </span>
                )}
              </div>
            )}
            <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-stone-500">
              {item.base_price && item.base_price > productPrice ? (
                <div className="flex gap-2 items-center">
                  <span className="line-through text-stone-400">₹{item.base_price}</span>
                  <span className="text-stone-900 font-medium">₹{productPrice?.toLocaleString()}</span>
                </div>
              ) : (
                <span className="text-stone-900 font-medium">₹{productPrice?.toLocaleString()}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => onRemove(item)}
            disabled={isUpdating}
            className="text-stone-400 hover:text-red-700 transition-colors disabled:opacity-50 p-1 -mt-1 -mr-1 shrink-0"
            aria-label="Remove item"
          >
            <Trash2 strokeWidth={1.5} className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex justify-between items-end mt-4 sm:mt-0">
          <div className="flex items-center border border-stone-300 scale-90 sm:scale-100 origin-left">
            <button
              onClick={() => onUpdateQuantity(item, quantity - 1)}
              disabled={quantity <= 1 || isUpdating}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 sm:px-4 py-1 sm:py-1.5 text-sm font-medium border-x border-stone-300 min-w-[2.5rem] sm:min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item, quantity + 1)}
              disabled={isUpdating || (item.stock && quantity >= item.stock)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-right">
            <div className="text-base sm:text-lg font-serif text-stone-900">
              ₹{((productPrice || 0) * quantity).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

CartItem.displayName = 'CartItem';

// Skeleton Component
const CartSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {[1, 2].map(i => (
      <div key={i} className="flex gap-4 sm:gap-6 py-6 sm:py-8 border-b border-stone-200">
        <div className="w-24 h-32 sm:w-36 sm:h-48 bg-stone-200 shrink-0" />
        <div className="flex-1 space-y-3 sm:space-y-4">
          <div className="h-5 sm:h-6 w-2/3 bg-stone-200" />
          <div className="h-3 sm:h-4 w-1/3 bg-stone-200" />
          <div className="h-4 sm:h-5 w-1/4 bg-stone-200 mt-4 sm:mt-8" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyCart = () => (
  <div className="py-24 md:py-32 flex flex-col items-center justify-center text-center">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mb-8"
    >
      <ShoppingBag strokeWidth={1} className="w-16 h-16 text-stone-300" />
    </motion.div>
    <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-6 tracking-wide">Your bag is empty</h2>
    <div className="w-12 h-px bg-stone-300 mb-8" />
    <Link to="/products">
      <button className="px-8 py-4 bg-stone-900 text-white text-sm uppercase tracking-widest hover:bg-stone-800 transition-all">
        Discover Collections
      </button>
    </Link>
  </div>
);

export default function CartPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const cartItems = useSelector(selectCartItems);
  const totalQty = useSelector(selectCartTotalQty);
  const subtotal = useSelector(selectCartSubtotal);
  const cartStatus = useSelector(selectCartStatus);
  // Treat both 'idle' and 'loading' as loading if we have no items yet.
  // This prevents showing the empty cart screen before fetchCart() completes.
  const isLoading = (cartStatus === 'loading' || cartStatus === 'idle') && (!cartItems || cartItems.length === 0);

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(() => {
    try {
      const stored = sessionStorage.getItem('appliedCoupon');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    // Fetch coupons for all users (guests and authenticated)
    api.getCoupons(token || '')
      .then(res => setAvailableCoupons(res.coupons || []))
      .catch(err => console.error('Failed to load coupons:', err));
    
    dispatch(fetchCart());
  }, [token, dispatch]);

  const isAuthenticated = !!token;
  const shipping = subtotal >= 999 ? 0 : 99;

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateCartItem({ id: item.id, quantity: newQuantity }))
      .unwrap()
      .catch(err => {
        showToast('Failed to update quantity', 'error');
        console.error(err);
      });
  };

  const handleRemoveItem = async (item) => {
    dispatch(removeFromCart(item.id))
      .unwrap()
      .then(() => showToast('Item removed', 'info'))
      .catch(err => {
        showToast('Failed to remove item', 'error');
        console.error(err);
      });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const result = await api.applyCoupon(couponCode, token);
      setCouponApplied(result.coupon);
      sessionStorage.setItem('appliedCoupon', JSON.stringify(result.coupon));
      showToast('Offer applied successfully', 'success');
    } catch (error) {
      setCouponError(error.message || 'Invalid code');
      setCouponApplied(null);
      sessionStorage.removeItem('appliedCoupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const discountAmount = Number(couponApplied?.discount) || 0;
  const subTotalNum = Number(subtotal) || 0;
  const total = Number((subTotalNum - discountAmount + shipping).toFixed(2));
  const itemCount = totalQty;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-stone-800 font-sans">
        <Header />
        <main className="container mx-auto px-4 md:px-8 py-12 md:py-24 max-w-7xl">
          <div className="h-10 w-48 bg-stone-200 animate-pulse mb-12" />
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">
            <div className="lg:col-span-7 xl:col-span-8"><CartSkeleton /></div>
            <div className="lg:col-span-5 xl:col-span-4"><div className="w-full h-96 bg-stone-200 animate-pulse" /></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!cartItems?.length) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-stone-800 font-sans flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 md:px-8 max-w-7xl">
          <EmptyCart />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-800 font-sans flex flex-col">
      <CartPageSEO />
      <Header />
      
      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-20 max-w-7xl pb-32 lg:pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200 pb-6 md:pb-8 mb-8 md:mb-10 gap-4">
          <h1 className="text-3xl md:text-5xl font-serif text-stone-900 tracking-wide flex items-baseline gap-3 flex-wrap">
            Shopping Bag
            <span className="text-sm md:text-base font-sans text-stone-400 tracking-normal whitespace-nowrap">
              ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
            </span>
          </h1>
          <button
            onClick={() => dispatch(clearCart())}
            className="text-xs text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors self-start md:self-auto mb-2"
          >
            Clear Bag
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Cart Items List */}
          <div className="lg:col-span-7 xl:col-span-8">
            <AnimatePresence mode="popLayout">
              {cartItems.map(item => (
                <CartItem
                  key={item.id || item.product_id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  isUpdating={updating}
                />
              ))}
            </AnimatePresence>
            
            <div className="mt-12">
              <Link to="/products" className="group inline-flex items-center gap-3 text-sm text-stone-500 hover:text-stone-900 uppercase tracking-widest transition-colors mb-12 lg:mb-0">
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-32 bg-white p-6 sm:p-8 border border-stone-200 shadow-sm">
              <h2 className="text-xl font-serif text-stone-900 mb-8 uppercase tracking-wide">Order Summary</h2>

              {/* Promo Code section */}
              <div className="mb-8">
                <div className="flex border border-stone-300 focus-within:border-stone-500 transition-colors">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="PROMO CODE"
                    className="flex-1 w-full px-3 sm:px-4 py-3 bg-transparent text-sm placeholder:text-stone-400 focus:outline-none uppercase tracking-widest min-w-0"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="px-4 sm:px-6 py-3 bg-stone-100 text-stone-900 hover:bg-stone-200 text-[10px] sm:text-xs tracking-widest uppercase transition-colors disabled:opacity-50 font-medium border-l border-stone-300 shrink-0 whitespace-nowrap"
                  >
                    {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-red-700 text-xs mt-2 tracking-wide uppercase">{couponError}</p>}
                
                {couponApplied && (
                  <div className="flex items-center justify-between mt-3 p-3 bg-stone-50 border border-stone-200">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-stone-900 uppercase tracking-widest">{couponApplied.code}</span>
                      <span className="text-sm text-stone-500 mt-0.5">-₹{Number(couponApplied.discount).toFixed(2)} applied</span>
                    </div>
                    <button
                      onClick={() => {
                        setCouponApplied(null);
                        setCouponCode('');
                        sessionStorage.removeItem('appliedCoupon');
                      }}
                      className="text-xs text-stone-400 hover:text-stone-900 tracking-widest uppercase transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Available Offers */}
                {!couponApplied && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-xs font-serif font-bold text-stone-900 tracking-wide mb-3 flex items-center gap-2">
                       <span className="text-rose-500">✨</span> Available Offers
                    </p>
                    {availableCoupons.length > 0 ? (
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {availableCoupons.map(coupon => (
                          <div 
                            key={coupon.code}
                            onClick={() => setCouponCode(coupon.code)}
                            className="group cursor-pointer relative overflow-hidden rounded-xl border border-stone-200 hover:border-rose-300 transition-all duration-300 hover:shadow-[0_4px_20px_-4px_rgba(244,63,94,0.15)] bg-white"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-400 to-amber-400" />
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                            
                            <div className="p-3.5 pl-4 relative z-10 flex flex-col gap-1.5">
                              <div className="flex justify-between items-start">
                                <span className="text-sm sm:text-base font-bold text-stone-900 tracking-wide uppercase font-sans truncate pr-2">
                                  {coupon.code}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-white bg-gradient-to-r from-rose-500 to-amber-500 px-2 sm:px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm whitespace-nowrap shrink-0">
                                   {coupon.discount_type === 'percentage' ? `${parseFloat(coupon.discount_value)}% OFF` : `₹${parseFloat(coupon.discount_value)} OFF`}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 leading-relaxed max-w-[85%] font-medium">
                                {coupon.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-stone-200 border-dashed bg-stone-50/50 flex flex-col items-center justify-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                            <span className="text-stone-400 text-sm">🎫</span>
                         </div>
                         <p className="text-[10px] text-stone-500 uppercase tracking-widest font-medium">No active offers at the moment</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-4 mb-8 text-sm tracking-wide text-stone-600">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span>₹{subtotal?.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-stone-900">
                    <span>Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span>{shipping > 0 ? `₹${shipping}` : 'Complimentary'}</span>
                </div>
                {subtotal < 999 && (
                  <div className="text-[11px] text-stone-500 uppercase tracking-widest pt-2">
                    Add ₹{(999 - subtotal).toFixed(2)} more for complimentary shipping
                  </div>
                )}
              </div>

              <div className="border-t border-stone-200 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm uppercase tracking-widest text-stone-500">Total</span>
                  <span className="text-2xl font-serif text-stone-900">₹{total.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-stone-400 text-right mt-1 uppercase tracking-widest">Incl. of all taxes</p>
              </div>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    showToast('Please sign in to proceed', 'info');
                    navigate('/account', { state: { from: '/cart' } });
                    return;
                  }
                  navigate('/checkout');
                }}
                className="w-full py-4 bg-stone-900 text-white text-sm tracking-widest uppercase hover:bg-stone-800 transition-colors flex justify-center items-center gap-3 group"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="mt-8 pt-8 border-t border-stone-100 flex flex-col gap-3">
                 <div className="flex items-center gap-3 text-xs text-stone-500 uppercase tracking-wider">
                    <div className="w-1 h-1 bg-stone-400 rounded-full"/> Complimentary shipping on orders above ₹999
                 </div>
                 <div className="flex items-center gap-3 text-xs text-stone-500 uppercase tracking-wider">
                    <div className="w-1 h-1 bg-stone-400 rounded-full"/> Secure, encrypted checkout
                 </div>
                 <div className="flex items-center gap-3 text-xs text-stone-500 uppercase tracking-wider">
                    <div className="w-1 h-1 bg-stone-400 rounded-full"/> 30-day returns policy
                 </div>
              </div>

            </div>
          </div>
          
        </div>
      </main>

      {/* Mobile Sticky Bottom Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-50 p-4 pb-6 sm:pb-4">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold truncate">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
            <p className="text-lg sm:text-xl font-serif text-stone-900 leading-none mt-0.5 truncate">₹{total.toFixed(2)}</p>
            {shipping === 0 && <p className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-900 tracking-wider mt-1 truncate">Complimentary Shipping</p>}
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                showToast('Please sign in to proceed', 'info');
                navigate('/account', { state: { from: '/cart' } });
                return;
              }
              navigate('/checkout');
            }}
            className="shrink-0 px-5 sm:px-8 py-3.5 sm:py-4 bg-stone-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 rounded-sm"
          >
            Checkout
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
