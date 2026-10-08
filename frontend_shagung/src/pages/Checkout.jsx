import { useState, useEffect } from 'react';
import { cookieStorage } from '../utils/cookieStorage';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, CreditCard, Truck, Check, ChevronRight,
  Lock, ArrowLeft, Package, AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { Button, Card, Badge, Input, AnimatedSection, Skeleton } from '../components/ui';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Helper to get color code from item
const getColorCode = (item) => item?.color_code || '#9ca3af';


// Step Indicator
const StepIndicator = ({ steps, currentStep }) => (
  <div className="flex items-center justify-center mb-8 sm:mb-12 px-2 overflow-x-auto no-scrollbar py-4">
    {steps.map((step, index) => (
      <div key={step.id} className="flex items-center shrink-0">
        <div className={`
          flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 border transition-all duration-300
          ${index < currentStep
            ? 'bg-rose-600 border-rose-600 text-white rounded-full shadow-sm'
            : index === currentStep
              ? 'bg-white border-rose-600 text-rose-600 shadow-lg rounded-full scale-110'
              : 'bg-stone-50 border-stone-200 text-stone-400 rounded-full'}
        `}>
          {index < currentStep ? <Check strokeWidth={2.5} className="w-4 h-4 sm:w-5 sm:h-5" /> : step.icon}
        </div>
        <div className="hidden sm:block ml-4 mr-8">
          <p className={`text-[10px] tracking-widest uppercase font-bold transition-colors ${index <= currentStep ? 'text-rose-700' : 'text-stone-400'}`}>
            {step.title}
          </p>
        </div>
        {index < steps.length - 1 && (
          <div className="w-8 sm:w-16 h-px mx-2 sm:mx-0 sm:mr-8 transition-colors bg-stone-200 relative overflow-hidden rounded-full">
             <div className={`absolute top-0 left-0 h-full bg-rose-600 transition-all duration-500 ${index < currentStep ? 'w-full' : 'w-0'}`} />
          </div>
        )}
      </div>
    ))}
  </div>
);

// Address Form
const AddressForm = ({ address, onChange, errors }) => {
  const inputBase = "w-full px-4 py-3.5 border bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all duration-200 text-sm font-medium placeholder:text-stone-400 placeholder:font-normal";
  const labelBase = "block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2";
  return (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="md:col-span-2">
      <label className={labelBase}>Full Name *</label>
      <input
        type="text"
        value={address.full_name || ''}
        onChange={(e) => onChange({ ...address, full_name: e.target.value })}
        className={`${inputBase} ${errors.full_name ? 'border-rose-500' : 'border-stone-200'}`}
        placeholder="Enter your full name"
      />
      {errors.full_name && <p className="text-rose-500 text-[10px] uppercase tracking-wider mt-1.5">{errors.full_name}</p>}
    </div>

    <div>
      <label className={labelBase}>Phone *</label>
      <input
        type="tel"
        value={address.phone || ''}
        onChange={(e) => onChange({ ...address, phone: e.target.value })}
        className={`${inputBase} ${errors.phone ? 'border-rose-500' : 'border-stone-200'}`}
        placeholder="10-digit mobile number"
      />
      {errors.phone && <p className="text-rose-500 text-[10px] uppercase tracking-wider mt-1.5">{errors.phone}</p>}
    </div>

    <div>
      <label className={labelBase}>Email *</label>
      <input
        type="email"
        value={address.email || ''}
        onChange={(e) => onChange({ ...address, email: e.target.value })}
        className={`${inputBase} ${errors.email ? 'border-rose-500' : 'border-stone-200'}`}
        placeholder="your@email.com"
      />
      {errors.email && <p className="text-rose-500 text-[10px] uppercase tracking-wider mt-1.5">{errors.email}</p>}
    </div>

    <div className="md:col-span-2">
      <label className={labelBase}>Address Line 1 *</label>
      <input
        type="text"
        value={address.address_line1 || ''}
        onChange={(e) => onChange({ ...address, address_line1: e.target.value })}
        className={`${inputBase} ${errors.address_line1 ? 'border-rose-500' : 'border-stone-200'}`}
        placeholder="House no, Building, Street"
      />
      {errors.address_line1 && <p className="text-rose-500 text-[10px] uppercase tracking-wider mt-1.5">{errors.address_line1}</p>}
    </div>

    <div className="md:col-span-2">
      <label className={labelBase}>Address Line 2</label>
      <input
        type="text"
        value={address.address_line2 || ''}
        onChange={(e) => onChange({ ...address, address_line2: e.target.value })}
        className={`${inputBase} border-stone-200`}
        placeholder="Landmark, Area (optional)"
      />
    </div>

    <div>
      <label className={labelBase}>City *</label>
      <input
        type="text"
        value={address.city || ''}
        onChange={(e) => onChange({ ...address, city: e.target.value })}
        className={`${inputBase} ${errors.city ? 'border-rose-500' : 'border-stone-200'}`}
        placeholder="City"
      />
      {errors.city && <p className="text-rose-500 text-[10px] uppercase tracking-wider mt-1.5">{errors.city}</p>}
    </div>

    <div>
      <label className={labelBase}>State *</label>
      <select
        value={address.state || ''}
        onChange={(e) => onChange({ ...address, state: e.target.value })}
        className={`${inputBase} ${errors.state ? 'border-rose-500' : 'border-stone-200'} bg-white appearance-none`}
      >
        <option value="">Select State</option>
        {['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'].map(state => (
          <option key={state} value={state}>{state}</option>
        ))}
      </select>
      {errors.state && <p className="text-rose-500 text-[10px] uppercase tracking-wider mt-1.5">{errors.state}</p>}
    </div>

    <div>
      <label className={labelBase}>Postal Code *</label>
      <input
        type="text"
        value={address.postal_code || ''}
        onChange={(e) => onChange({ ...address, postal_code: e.target.value })}
        className={`${inputBase} ${errors.postal_code ? 'border-rose-500' : 'border-stone-200'}`}
        placeholder="6-digit PIN code"
        maxLength={6}
      />
      {errors.postal_code && <p className="text-rose-500 text-[10px] uppercase tracking-wider mt-1.5">{errors.postal_code}</p>}
    </div>
  </div>
)};

// Order Summary Sidebar
const OrderSummary = ({ cart, coupon }) => {
  const items = cart?.items || [];
  const discount = Number(coupon?.discount) || 0;

  // Calculate total price (GST inclusive) from all items
  const rawTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  // Use cart.shipping if available, otherwise calculate (same as Cart page: free shipping on orders >= 999)
  const shipping = cart?.shipping !== undefined ? Number(cart.shipping) : (rawTotal >= 999 ? 0 : 99);

  // GST is INCLUDED in prices at 18%
  // Extract base price and GST from the total
  const taxRate = 0.18;

  // Apply discount first (discount applies to GST-inclusive prices)
  const afterDiscount = Math.max(0, rawTotal - discount);

  // Extract base and GST from the after-discount amount
  const baseAmount = afterDiscount / (1 + taxRate);
  const gstAmount = afterDiscount - baseAmount;

  // Total = afterDiscount (already has GST included) + shipping
  const total = afterDiscount + shipping;

  const itemDetails = items.map(item => {
    const price = Number(item.price) || 0;
    const qty = item.quantity || 1;
    const itemTotal = price * qty;
    return {
      ...item,
      itemTotal
    };
  });

  return (
    <div className="sticky top-32 bg-white p-6 sm:p-8 border border-stone-200 shadow-sm">
      <h2 className="text-xl font-serif text-stone-900 mb-8 uppercase tracking-wide">Order Summary</h2>

      {/* Items */}
      <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-6 pr-2 custom-scrollbar">
        {itemDetails.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="w-20 h-28 bg-stone-100 overflow-hidden shrink-0">
              <img src={item.image || '/placeholder.jpg'} alt={item.product_name} className="w-full h-full object-cover object-center" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-serif text-stone-900 truncate tracking-wide">{item.product_name}</p>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-500 uppercase tracking-widest mt-1.5">
                <span>Qty: {item.quantity}</span>
                {item.size && <span>• {item.size}</span>}
                {item.color && (
                  <span className="flex items-center gap-1.5">
                    • 
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-stone-300"
                      style={{ backgroundColor: getColorCode(item) }}
                    />
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-stone-900 mt-2">₹{item.itemTotal.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="space-y-4 pt-6 border-t border-stone-100 text-sm tracking-wide text-stone-600">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span>₹{Math.round(baseAmount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Tax (GST 18%)</span>
          <span>₹{Math.round(gstAmount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Shipping</span>
          <span>{shipping > 0 ? `₹${shipping.toFixed(2)}` : 'Complimentary'}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-stone-900">
            <span className="flex items-center gap-2">
              Discount
              {coupon?.code && <span className="text-[10px] bg-stone-100 text-stone-900 px-2 py-0.5 uppercase tracking-widest">{coupon.code}</span>}
            </span>
            <span>-₹{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-stone-200 pt-6 mt-6">
          <div className="flex justify-between items-end">
            <span className="text-sm uppercase tracking-widest text-stone-500 font-bold">Total</span>
            <span className="text-2xl font-serif text-rose-700 flex flex-col text-right">
              ₹{total.toFixed(2)}
              <span className="text-[10px] text-rose-400/80 font-sans tracking-widest uppercase mt-1">Incl. of all taxes</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-stone-100 flex flex-col gap-3">
         <div className="flex items-center gap-3 text-xs text-stone-500 uppercase tracking-wider">
            <div className="w-1 h-1 bg-stone-400 rounded-full"/> Secure, encrypted checkout
         </div>
      </div>
    </div>
  );
};

// Main Checkout Page
export default function CheckoutPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [shippingAddress, setShippingAddress] = useState({});
  const [billingAddress, setBillingAddress] = useState({});
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [addressErrors, setAddressErrors] = useState({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentOffers, setPaymentOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Coupon from Cart page (stored in sessionStorage)
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const stored = sessionStorage.getItem('appliedCoupon');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Get token from cookies
  const getToken = () => cookieStorage.getItem('token');

  // Fetch initial data (Cart, Addresses, Payment Offers) concurrently
  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        navigate('/account', { state: { from: '/checkout' } });
        return;
      }

      try {
        setLoading(true);
        setLoadingOffers(true);

        // Combine all independent fetches into parallel requests to improve loading speed
        const [cartRes, addressRes, offersRes] = await Promise.allSettled([
          api.getCart(token),
          api.getAddresses(token),
          api.getPaymentOffers(token)
        ]);

        // 1. Process Cart (Required)
        if (cartRes.status === 'fulfilled') {
          const cartData = cartRes.value;
          const cartItems = cartData.cart?.items || cartData.items || [];
          if (cartItems.length === 0) {
            navigate('/cart');
            return;
          }
          setCart(cartData.cart || cartData);
        } else {
          console.error('Failed to fetch cart:', cartRes.reason);
          navigate('/cart');
          return;
        }

        // 2. Process Addresses (Optional/Handled gracefully)
        if (addressRes.status === 'fulfilled') {
          const addressData = addressRes.value;
          const userAddresses = addressData.addresses || [];
          setSavedAddresses(userAddresses);

          const defaultAddr = userAddresses.find(a => a.is_default);
          if (defaultAddr) {
            setShippingAddress(defaultAddr);
            setSelectedAddressId(defaultAddr.id);
          }
        } else {
          console.log('No saved addresses or failed to fetch addresses');
        }

        // 3. Process Payment Offers (Optional)
        if (offersRes.status === 'fulfilled') {
          const offersData = offersRes.value;
          if (offersData && offersData.success) {
            setPaymentOffers(offersData.offers || []);
          }
        }
      } catch (error) {
        console.error('Critical checkout load error:', error);
      } finally {
        setLoading(false);
        setLoadingOffers(false);
      }
    };

    fetchData();
  }, [navigate]);

  const steps = [
    { id: 'shipping', title: 'Shipping', icon: <MapPin className="w-5 h-5" /> },
    { id: 'payment', title: 'Payment', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'review', title: 'Review', icon: <Package className="w-5 h-5" /> },
  ];



  // Validate address
  const validateAddress = () => {
    const errors = {};
    if (!shippingAddress.full_name?.trim()) errors.full_name = 'Name is required';
    if (!shippingAddress.phone?.match(/^[6-9]\d{9}$/)) errors.phone = 'Valid 10-digit phone required';
    if (!shippingAddress.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Valid email required';
    if (!shippingAddress.address_line1?.trim()) errors.address_line1 = 'Address is required';
    if (!shippingAddress.city?.trim()) errors.city = 'City is required';
    if (!shippingAddress.state) errors.state = 'State is required';
    if (!shippingAddress.postal_code?.match(/^\d{6}$/)) errors.postal_code = 'Valid 6-digit PIN required';

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 0 && !validateAddress()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    setProcessing(true);
    setError('');
    const token = getToken();

    try {
      const subtotal = cart.subtotal || cart.items?.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0) || 0;
      // Use cart.shipping if available, otherwise calculate based on cart total (same as Cart page)
      const shipping = cart?.shipping !== undefined ? Number(cart.shipping) : (subtotal >= 999 ? 0 : 99);

      // Calculate discount from applied coupon
      const discount = Number(appliedCoupon?.discount) || 0;

      // Calculate final payment amount (subtotal - discount + shipping)
      const finalTotal = Number((Math.max(0, subtotal - discount) + shipping).toFixed(2));

      // Debug logging
      console.log('💰 Payment Amount Calculation:', {
        subtotal,
        shipping,
        discount,
        couponCode: appliedCoupon?.code,
        finalTotal,
        willSendToCashfree: finalTotal
      });

      const orderData = {
        items: cart.items.map(item => ({
          productId: item.product_id || item.id,
          variantId: item.variant_id,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          ...shippingAddress,
          country: 'India',
        },
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        paymentMethod,
        // Include coupon info for backend
        couponCode: appliedCoupon?.code || null,
        couponDiscount: discount,
      };

      // If online payment, use Cashfree
      if (paymentMethod === 'online') {
        console.log('🚀 ========== STARTING CASHFREE PAYMENT FLOW ==========');
        console.log('📋 Order Data:', {
          finalTotal,
          shippingEmail: shippingAddress.email,
          shippingPhone: shippingAddress.phone
        });

        // Create Cashfree order with final discounted amount
        console.log('📤 Step 1: Creating payment intent...');
        const paymentResult = await api.createPaymentIntent({
          amount: finalTotal,  // Use discounted total, not subtotal
          currency: 'INR',
          metadata: {
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            name: shippingAddress.full_name,
            couponCode: appliedCoupon?.code || '',
            originalAmount: subtotal,
            discountAmount: discount,
          },
        }, token);

        console.log('📥 Step 1 Response - Payment Intent Result:', paymentResult);

        if (!paymentResult.success) {
          console.error('❌ Step 1 FAILED: Could not create payment intent', paymentResult);
          throw new Error(paymentResult.message || 'Failed to create payment order');
        }

        console.log('✅ Step 1 SUCCESS: Payment intent created');
        console.log('   - Order ID:', paymentResult.orderId);
        console.log('   - Session ID:', paymentResult.paymentSessionId);
        console.log('   - Environment:', paymentResult.environment);

        // Load Cashfree SDK and open checkout
        const cashfreeUrl = paymentResult.environment === 'production'
          ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
          : 'https://sdk.cashfree.com/js/v3/cashfree.js';

        // Dynamically load Cashfree SDK if not already loaded
        console.log('📤 Step 2: Loading Cashfree SDK...');
        if (!window.Cashfree) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = cashfreeUrl;
            script.onload = () => {
              console.log('✅ Step 2 SUCCESS: Cashfree SDK loaded');
              resolve();
            };
            script.onerror = () => {
              console.error('❌ Step 2 FAILED: Could not load Cashfree SDK');
              reject(new Error('Failed to load Cashfree SDK'));
            };
            document.head.appendChild(script);
          });
        } else {
          console.log('✅ Step 2 SUCCESS: Cashfree SDK already loaded');
        }

        // Initialize Cashfree
        console.log('📤 Step 3: Initializing Cashfree with mode:', paymentResult.environment);
        const cashfree = window.Cashfree({
          mode: paymentResult.environment === 'production' ? 'production' : 'sandbox',
        });
        console.log('✅ Step 3 SUCCESS: Cashfree initialized');

        // Open checkout
        console.log('📤 Step 4: Opening Cashfree checkout modal...');
        console.log('   - Payment Session ID:', paymentResult.paymentSessionId);
        const checkoutResult = await cashfree.checkout({
          paymentSessionId: paymentResult.paymentSessionId,
          redirectTarget: '_modal', // Opens in a modal popup
        });

        console.log('📥 Step 4 Response - Checkout Result (RAW):', checkoutResult);
        console.log('📦 Cashfree Checkout Result (JSON):', JSON.stringify(checkoutResult, null, 2));

        if (checkoutResult.error) {
          console.error('❌ Step 4 FAILED: Checkout returned error', checkoutResult.error);
          throw new Error(checkoutResult.error.message || 'Payment was cancelled');
        }

        // Cashfree SDK returns various messages based on payment outcome
        const paymentDetails = checkoutResult.paymentDetails || {};
        const paymentMessage = paymentDetails.paymentMessage || paymentDetails.payment_message || '';

        console.log('🔍 Step 5: Analyzing payment result...');
        console.log('   - Payment Details Object:', paymentDetails);
        console.log('   - Payment Message:', paymentMessage);
        console.log('   - All keys in paymentDetails:', Object.keys(paymentDetails));

        // Check for definite success indicators
        const isDefiniteSuccess =
          paymentMessage === 'Payment Successful' ||
          paymentMessage === 'Transaction success' ||
          paymentMessage.toLowerCase().includes('success') ||
          paymentDetails.payment_status === 'SUCCESS' ||
          paymentDetails.paymentStatus === 'SUCCESS';

        // Check for "check status" message - means payment finished, need to verify with backend
        const needsBackendVerification =
          paymentMessage.toLowerCase().includes('finished') ||
          paymentMessage.toLowerCase().includes('check status');

        // Check for explicit failure
        const isPaymentFailed =
          paymentMessage.toLowerCase().includes('failed') ||
          paymentMessage.toLowerCase().includes('cancelled') ||
          paymentMessage.toLowerCase().includes('canceled');

        console.log('📊 Step 5 Analysis Results:');
        console.log('   - isDefiniteSuccess:', isDefiniteSuccess);
        console.log('   - needsBackendVerification:', needsBackendVerification);
        console.log('   - isPaymentFailed:', isPaymentFailed);

        // If payment failed explicitly, throw error
        if (isPaymentFailed) {
          console.error('❌ Step 5 RESULT: Payment failed explicitly');
          throw new Error('Payment failed. Please try again.');
        }

        // Determine which path to take
        const shouldVerify = isDefiniteSuccess || needsBackendVerification;
        console.log('🔀 Decision: shouldVerify with backend =', shouldVerify);

        // If success OR needs verification, verify with backend
        if (shouldVerify) {
          console.log('� Step 6: Verifying payment with backend...');
          console.log('   - Order ID:', paymentResult.orderId);

          const verifyResult = await api.verifyPayment(paymentResult.orderId, token);

          console.log('� Step 6 Response - Backend Verification Result:', verifyResult);
          console.log('   - Status:', verifyResult.status);
          console.log('   - Success:', verifyResult.success);

          if (verifyResult.status === 'PAID' || verifyResult.success) {
            console.log('✅ Step 6 SUCCESS: Payment verified!');
            orderData.paymentIntentId = paymentResult.orderId;
          } else {
            console.error('❌ Step 6 FAILED: Backend says not paid');
            console.error('   - verifyResult.status:', verifyResult.status);
            console.error('   - Full response:', verifyResult);
            throw new Error(`Payment verification failed (Status: ${verifyResult.status}). Please contact support.`);
          }
        } else if (checkoutResult.error) {
          console.error('❌ Checkout returned error object:', checkoutResult.error);
          throw new Error(checkoutResult.error.message || 'Payment was cancelled');
        } else {
          // Unknown state - still try to verify with backend as fallback
          console.warn('⚠️ Step 6 (FALLBACK): Unknown payment state, attempting backend verification...');
          console.log('   - checkoutResult:', checkoutResult);
          console.log('   - paymentMessage was:', paymentMessage);

          const verifyResult = await api.verifyPayment(paymentResult.orderId, token);

          console.log('� Fallback Verification Result:', verifyResult);
          console.log('   - Status:', verifyResult.status);
          console.log('   - Success:', verifyResult.success);

          if (verifyResult.status === 'PAID' || verifyResult.success) {
            console.log('✅ Fallback SUCCESS: Payment verified!');
            orderData.paymentIntentId = paymentResult.orderId;
          } else {
            console.error('❌ Fallback FAILED: Backend verification failed');
            console.error('   - Checkout Result:', checkoutResult);
            console.error('   - Verify Result:', verifyResult);
            console.error('   - This is where the error is thrown!');
            throw new Error('Payment could not be verified. If money was deducted, please contact support.');
          }
        }

        console.log('🎉 ========== CASHFREE PAYMENT FLOW COMPLETE ==========');
      }

      const result = await api.createOrder(orderData, token);

      // Clear cart and redirect to success
      await api.clearCart(token);
      navigate(`/order-success/${result.order.id}`, {
        state: { order: result.order }
      });
    } catch (error) {
      console.error('Place order error:', error);
      setError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 md:px-8 py-12 md:py-24 max-w-7xl">
          <div className="h-10 w-48 bg-stone-200 animate-pulse mb-12" />
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="h-96 w-full bg-stone-200 animate-pulse" />
            </div>
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="h-80 w-full bg-stone-200 animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-800 font-sans flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-20 max-w-7xl pb-32 lg:pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200 pb-6 md:pb-8 mb-8 md:mb-10 gap-4">
          <h1 className="text-3xl md:text-5xl font-serif text-stone-900 tracking-wide flex items-baseline gap-3">
            Secure Checkout
          </h1>
          <button
            onClick={() => currentStep > 0 ? setCurrentStep(prev => prev - 1) : navigate('/cart')}
            className="text-xs text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors flex items-center gap-2 self-start md:self-auto mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep > 0 ? 'Back' : 'Back to Cart'}
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 mt-8 md:mt-16">
          {/* Main Content */}
          <div className="lg:col-span-7 xl:col-span-8 min-w-0">
            <div className="bg-white border border-stone-200 p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden">
              {/* Step 0: Shipping Address */}
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-xl font-serif text-stone-900 mb-8 flex items-center gap-3 tracking-wide">
                    <MapPin strokeWidth={1.5} className="w-5 h-5 text-stone-900" />
                    Shipping Address
                  </h2>

                  {/* Saved Addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                        <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                          Saved Addresses
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(null);
                            setShippingAddress({});
                          }}
                          className="text-[10px] text-stone-900 font-bold uppercase tracking-widest hover:underline flex items-center gap-1.5"
                        >
                          <span className="text-sm leading-none">+</span> Add New
                        </button>
                      </div>

                      <div className="grid gap-4">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setShippingAddress(addr);
                              setAddressErrors({});
                            }}
                            className={`
                              relative p-5 border cursor-pointer transition-all duration-300
                              ${selectedAddressId === addr.id
                                ? 'border-rose-400 bg-rose-50/20 shadow-md ring-1 ring-rose-400/50'
                                : 'border-stone-200 hover:border-rose-200 bg-white'
                              }
                            `}
                          >
                            {/* Selection Indicator */}
                            <div className={`
                              absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300
                              ${selectedAddressId === addr.id
                                ? 'border-rose-600 bg-rose-600 scale-110 shadow-sm'
                                : 'border-stone-300 bg-white'
                              }
                            `}>
                              {selectedAddressId === addr.id && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>

                            {/* Address Details */}
                            <div className="pr-10 break-words">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <p className="font-bold tracking-wide text-stone-900">{addr.full_name}</p>
                                {addr.is_default && (
                                  <span className="text-[9px] px-2 py-0.5 bg-stone-100 text-stone-600 font-bold uppercase tracking-widest">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-stone-600 mb-0.5">{addr.address_line1}</p>
                              {addr.address_line2 && (
                                <p className="text-sm text-stone-600 mb-0.5">{addr.address_line2}</p>
                              )}
                              <p className="text-sm text-stone-600 mb-2">
                                {addr.city}, {addr.state} - {addr.postal_code}
                              </p>
                              <p className="text-sm text-stone-500 mt-2 break-all font-medium">
                                {addr.phone} <span className="mx-2">•</span> {addr.email}
                              </p>
                            </div>

                            {/* Mark as Default Button */}
                            {!addr.is_default && selectedAddressId === addr.id && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const token = getToken();
                                    await api.setDefaultAddress(addr.id, token);
                                    // Refresh addresses
                                    const updated = await api.getAddresses(token);
                                    setSavedAddresses(updated.addresses || []);
                                  } catch (err) {
                                    console.error('Failed to set default:', err);
                                  }
                                }}
                                className="mt-4 text-[10px] uppercase tracking-widest text-rose-600 font-bold hover:text-rose-800 transition-colors"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Address Form */}
                  {(savedAddresses.length === 0 || selectedAddressId === null) && (
                    <div className={savedAddresses.length > 0 ? "pt-6 border-t border-stone-200" : ""}>
                      {savedAddresses.length > 0 && (
                        <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-6">
                          Add New Address
                        </h3>
                      )}
                      <AddressForm
                        address={shippingAddress}
                        onChange={setShippingAddress}
                        errors={addressErrors}
                      />

                      {/* Save Address Options */}
                      <div className="mt-6 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={saveAsDefault}
                            onChange={(e) => setSaveAsDefault(e.target.checked)}
                            className="w-4 h-4 text-stone-900 rounded-none border-stone-300 focus:ring-stone-900"
                          />
                          <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">Set as default address</span>
                        </label>

                        {/* Save Address Button */}
                        <button
                          type="button"
                          disabled={savingAddress}
                          onClick={async () => {
                            if (!validateAddress()) return;

                            setSavingAddress(true);
                            try {
                              const token = getToken();
                              const addressData = {
                                ...shippingAddress,
                                country: 'India',
                                is_default: saveAsDefault
                              };

                              const result = await api.addAddress(addressData, token);

                              // Refresh saved addresses
                              const updated = await api.getAddresses(token);
                              setSavedAddresses(updated.addresses || []);

                              // Select the newly added address
                              const newAddr = result.address || result;
                              if (newAddr?.id) {
                                setSelectedAddressId(newAddr.id);
                                setShippingAddress(newAddr);
                              }

                              setAddressErrors({});
                            } catch (err) {
                              console.error('Failed to save address:', err);
                              setError('Failed to save address: ' + (err.message || 'Unknown error'));
                            } finally {
                              setSavingAddress(false);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-900 py-4 px-6 text-xs uppercase tracking-widest font-bold hover:bg-stone-200 transition-colors disabled:opacity-50"
                        >
                          {savingAddress ? 'Saving...' : 'Save New Address'}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    className="w-full mt-8 flex items-center justify-center gap-3 bg-rose-700 text-white py-4 sm:py-5 px-6 text-xs sm:text-sm uppercase tracking-widest font-bold hover:bg-rose-800 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Continue to Payment
                    <ChevronRight strokeWidth={2.5} className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Step 1: Payment */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-xl font-serif text-stone-900 mb-8 flex items-center gap-3 tracking-wide">
                    <CreditCard strokeWidth={1.5} className="w-5 h-5 text-stone-900" />
                    Payment Method
                  </h2>

                  <div className="space-y-4">
                    {/* Online Payment Option */}
                    <label className={`
                      flex flex-wrap sm:flex-nowrap items-center gap-4 p-5 border cursor-pointer transition-all duration-300
                      ${paymentMethod === 'online' ? 'border-rose-400 bg-rose-50/20 shadow-md ring-1 ring-rose-400/50' : 'border-stone-200 hover:border-rose-200 bg-white'}
                    `}>
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-rose-600 border-stone-300 focus:ring-rose-500 bg-white"
                      />
                      <div className="flex-1">
                        <p className="font-bold tracking-wide text-stone-900">Pay Online (Cashfree)</p>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">UPI, Cards, Wallets, Net Banking</p>
                      </div>
                      <div className="flex gap-2.5 items-center">
                        <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-1 uppercase tracking-widest font-bold rounded-sm border border-stone-200 shadow-sm">UPI</span>
                        {/* Visa logo — inline SVG */}
                        <svg className="h-4 object-contain drop-shadow-sm" viewBox="0 0 750 471" xmlns="http://www.w3.org/2000/svg">
                          <rect width="750" height="471" rx="40" fill="#1a1f71"/>
                          <text x="375" y="310" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="210" fill="white" letterSpacing="-8">VISA</text>
                        </svg>
                        {/* Mastercard logo — inline SVG */}
                        <svg className="h-4 object-contain drop-shadow-sm" viewBox="0 0 131.39 86.9" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="43.45" cy="43.45" r="43.45" fill="#EB001B"/>
                          <circle cx="87.94" cy="43.45" r="43.45" fill="#F79E1B"/>
                          <path d="M65.7 16.16a43.4 43.4 0 0 1 0 54.58 43.4 43.4 0 0 1 0-54.58z" fill="#FF5F00"/>
                        </svg>
                      </div>
                    </label>

                    {/* Payment Offers Display */}
                    {paymentMethod === 'online' && (
                      <div className="ml-6 mt-4 mb-6 pl-4 border-l-2 border-stone-200">
                        {loadingOffers ? (
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold animate-pulse">Checking for offers...</p>
                        ) : paymentOffers.length > 0 ? (
                          <div className="space-y-3 animate-fadeIn">
                            <p className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1.5 tracking-widest">
                              Available Bank Offers
                            </p>
                            {paymentOffers.map((offer, idx) => (
                              <div key={offer.offer_id || idx} className="bg-white border border-stone-200 p-4 shadow-sm hover:border-stone-300 transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <p className="font-bold text-stone-900 text-sm tracking-wide">
                                      {offer.offer_meta?.offer_title || offer.offer_code}
                                    </p>
                                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                                      {offer.offer_meta?.offer_description || 'Apply this offer on the payment page for extra discount.'}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {(offer.offer_meta?.offer_code || offer.offer_code) && (
                                      <span className="inline-block bg-stone-50 text-stone-900 text-[10px] font-mono tracking-widest uppercase font-bold px-2 py-1 border border-stone-200">
                                        {offer.offer_meta?.offer_code || offer.offer_code}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-1.5 text-[10px] lowercase text-stone-400 font-medium">
                                  <AlertCircle strokeWidth={2} className="w-3 h-3" />
                                  <span>Offer applied automatically at payment gateway</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] tracking-widest uppercase text-stone-400 font-bold">No additional bank offers at this time.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Billing Address */}
                  <div className="mt-8 pt-8 border-t border-stone-100">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={sameAsShipping}
                        onChange={(e) => setSameAsShipping(e.target.checked)}
                        className="w-4 h-4 text-stone-900 rounded-none border-stone-300 focus:ring-stone-900"
                      />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 group-hover:text-stone-900 transition-colors">Billing address matches shipping</span>
                    </label>
                  </div>

                  {/* Payment Method Validation Warning */}
                  {!paymentMethod && (
                    <div className="mt-6 p-4 bg-stone-50 border border-stone-200 flex items-center gap-3 text-stone-500">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="text-xs uppercase tracking-widest font-bold">Please select a payment method</span>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    disabled={!paymentMethod}
                    className="w-full mt-8 flex items-center justify-center gap-3 bg-rose-700 text-white py-4 sm:py-5 px-6 text-xs sm:text-sm uppercase tracking-widest font-bold hover:bg-rose-800 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                  >
                    Review Order
                    <ChevronRight strokeWidth={2.5} className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Review */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-xl font-serif text-stone-900 mb-8 flex items-center gap-3 tracking-wide">
                    <Package strokeWidth={1.5} className="w-5 h-5 text-stone-900" />
                    Review Your Order
                  </h2>

                  {/* Shipping Info */}
                  <div className="bg-stone-50 border border-stone-200 p-6 mb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-bold tracking-wide text-stone-900 mb-1">{shippingAddress.full_name}</p>
                        <p className="text-sm text-stone-600 mb-0.5">{shippingAddress.address_line1}</p>
                        {shippingAddress.address_line2 && (
                          <p className="text-sm text-stone-600 mb-0.5">{shippingAddress.address_line2}</p>
                        )}
                        <p className="text-sm text-stone-600 mb-2">
                          {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postal_code}
                        </p>
                        <p className="text-sm text-stone-500 font-medium">Phone: {shippingAddress.phone}</p>
                      </div>
                      <span className="text-[9px] bg-stone-200 text-stone-700 px-2 py-1 uppercase tracking-widest font-bold shrink-0">Shipping</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-stone-50 border border-stone-200 p-6 mb-4">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold tracking-wide text-stone-900 mb-1">
                          {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                        </p>
                        <p className="text-sm text-stone-600">
                          {paymentMethod === 'cod' ? 'Pay when you receive' : 'Cards, UPI, Net Banking'}
                        </p>
                      </div>
                      <span className="text-[9px] bg-stone-200 text-stone-700 px-2 py-1 uppercase tracking-widest font-bold shrink-0">Payment</span>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 mb-6 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={processing}
                    className="w-full mt-6 flex items-center justify-center gap-3 bg-rose-700 text-white py-4 sm:py-5 px-6 text-xs sm:text-sm uppercase tracking-widest font-bold hover:bg-rose-800 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                  >
                    {processing ? 'Processing...' : (paymentMethod === 'cod' ? 'Place Order' : 'Pay & Place Order')}
                    {!processing && <Lock strokeWidth={2.5} className="w-4 h-4" />}
                  </button>

                  <p className="text-center text-[10px] uppercase tracking-widest text-stone-400 font-bold mt-6">
                    By placing your order, you agree to our Terms of Service and Privacy Policy
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 min-w-0">
            <OrderSummary cart={cart} coupon={appliedCoupon} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

