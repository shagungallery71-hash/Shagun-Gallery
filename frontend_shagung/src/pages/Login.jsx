import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ChevronRight, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastContext'
import { authApi } from '../api/auth'

export default function Login({ defaultMode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, signIn, signUp } = useAuth()
  const { showToast } = useToast()

  // Query parameter support (e.g. /login?mode=signup)
  const searchParams = new URLSearchParams(location.search)
  const queryMode = searchParams.get('mode')
  const initialMode = queryMode === 'signup' ? 'signup' : defaultMode

  const [authMode, setAuthMode] = useState(initialMode) // 'login' | 'signup' | 'forgot_email' | 'forgot_otp' | 'forgot_reset'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  // Forgot password flow state
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)

  // If already authenticated, redirect to /account
  useEffect(() => {
    if (user && token) {
      const from = location.state?.from || '/account'
      navigate(from, { replace: true })
    }
  }, [user, token, navigate, location])

  // Timer for OTP
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpTimer])

  // Submit Sign In / Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (authMode === 'login') {
        await signIn({
          email: formData.email.trim(),
          password: formData.password,
        })
        showToast('Welcome back! Successfully signed in.', 'success')
        const from = location.state?.from || '/account'
        navigate(from, { replace: true })
      } else {
        await signUp({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        })
        showToast('Account created successfully! Signing you in...', 'success')
        // Automatically sign in after signup
        await signIn({
          email: formData.email.trim(),
          password: formData.password,
        })
        navigate('/account', { replace: true })
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed. Please check credentials.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Send Recovery OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgetPassword({ email: forgotEmail.trim() })
      showToast('Recovery code sent to your email.', 'info')
      setAuthMode('forgot_otp')
      setOtpTimer(120) // 2 minutes
    } catch (err) {
      showToast(err.message || 'Failed to send recovery code.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Verify Recovery OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.verifyOtp({ email: forgotEmail.trim(), otp: otp.trim() })
      showToast('Code verified. Set your new password.', 'success')
      setAuthMode('forgot_reset')
    } catch (err) {
      showToast(err.message || 'Invalid recovery code.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Reset Password Submit
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.resetPassword({
        email: forgotEmail.trim(),
        otp: otp.trim(),
        newPassword,
      })
      showToast('Password updated successfully! Please sign in.', 'success')
      setAuthMode('login')
      setFormData((prev) => ({ ...prev, email: forgotEmail, password: '' }))
      setForgotEmail('')
      setOtp('')
      setNewPassword('')
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle decorative background gradients */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-rose-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-100/35 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative z-10"
        >
          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-xl border border-neutral-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] rounded-3xl overflow-hidden transition-all">
            {/* Top luxury accent line */}
            <div className="h-[3px] w-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-700" />

            <div className="p-8 sm:p-10">
              {/* Brand Logo & Header */}
              <div className="text-center mb-8">
                <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 text-amber-300 mb-5 shadow-lg shadow-neutral-900/10 hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6" strokeWidth={1.75} />
                </Link>

                <h1 className="text-2xl sm:text-3xl font-serif text-neutral-900 tracking-tight font-normal">
                  {authMode === 'login' && 'Welcome Back'}
                  {authMode === 'signup' && 'Create Account'}
                  {authMode === 'forgot_email' && 'Forgot Password'}
                  {authMode === 'forgot_otp' && 'Verify Code'}
                  {authMode === 'forgot_reset' && 'Set New Password'}
                </h1>

                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mt-2 font-medium">
                  {authMode === 'login' && 'Access your exclusive collections'}
                  {authMode === 'signup' && 'Join for an elevated experience'}
                  {authMode === 'forgot_email' && 'Enter your email for recovery'}
                  {authMode === 'forgot_otp' && `Code sent to ${forgotEmail}`}
                  {authMode === 'forgot_reset' && 'Create your new credentials'}
                </p>
              </div>

              {/* Tab Switcher: Sign In / Sign Up */}
              {(authMode === 'login' || authMode === 'signup') && (
                <div className="flex border-b border-neutral-100 mb-8 relative">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-widest transition-all ${
                      authMode === 'login'
                        ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-px'
                        : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-widest transition-all ${
                      authMode === 'signup'
                        ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-px'
                        : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Back to Sign In Link for Forgot Password flows */}
              {!['login', 'signup'].includes(authMode) && (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors mb-6"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              )}

              {/* Animated Forms Container */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={authMode}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* SIGN IN / SIGN UP FORM */}
                  {(authMode === 'login' || authMode === 'signup') && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {authMode === 'signup' && (
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1.5">
                            Full Name
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1.5">
                          Email address
                        </label>
                        <input
                          required
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[11px] uppercase tracking-wider font-semibold text-neutral-600">
                            Password
                          </label>
                          {authMode === 'login' && (
                            <button
                              type="button"
                              onClick={() => {
                                setForgotEmail(formData.email)
                                setAuthMode('forgot_email')
                              }}
                              className="text-[11px] font-medium text-rose-700 hover:text-rose-900 tracking-wide transition-colors"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            required
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all pr-16"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 tracking-wider transition-colors px-1 py-1"
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-neutral-900 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-neutral-900/10 hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                        {loading
                          ? 'Please wait...'
                          : authMode === 'login'
                          ? 'Sign In'
                          : 'Create Account'}
                      </button>
                    </form>
                  )}

                  {/* FORGOT PASSWORD: STEP 1 (EMAIL) */}
                  {authMode === 'forgot_email' && (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1.5">
                          Email address
                        </label>
                        <input
                          required
                          type="email"
                          placeholder="name@example.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-neutral-900 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-neutral-900/10 hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Sending...' : 'Send Recovery Code'}
                      </button>
                    </form>
                  )}

                  {/* FORGOT PASSWORD: STEP 2 (OTP VERIFY) */}
                  {authMode === 'forgot_otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1.5 text-center">
                          Verification Code
                        </label>
                        <input
                          required
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full px-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl text-2xl text-center font-mono tracking-[0.5em] text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all"
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
                        <span>Expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span>
                        {otpTimer === 0 && (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-neutral-900 underline font-semibold hover:text-black"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-neutral-900 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-neutral-900/10 hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </form>
                  )}

                  {/* FORGOT PASSWORD: STEP 3 (NEW PASSWORD) */}
                  {authMode === 'forgot_reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1.5">
                          New Password
                        </label>
                        <input
                          required
                          type="password"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-neutral-900 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-neutral-900/10 hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Updating...' : 'Set New Password'}
                      </button>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Secure Trust Badge */}
              <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  🔒 256-Bit SSL Encrypted & Private
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
