import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
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

  // Auto redirect if already authenticated
  useEffect(() => {
    if (user && token) {
      const from = location.state?.from || '/account'
      navigate(from, { replace: true })
    }
  }, [user, token, navigate, location])

  // OTP Countdown Timer
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
      setOtpTimer(120)
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
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Minimalist Brand Top Bar */}
      <header className="w-full border-b border-stone-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Store</span>
          </Link>

          <Link to="/" className="flex items-center">
            <img
              src="https://res.cloudinary.com/dsgktwwae/image/upload/v1773397047/WhatsApp_Image_2026-03-13_at_11.39.26_wepbgx.jpg"
              alt="Shagun Gallery"
              className="h-10 sm:h-11 object-contain mix-blend-multiply"
            />
          </Link>

          <Link
            to="/contact"
            className="text-xs uppercase tracking-widest font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            Help
          </Link>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-[420px]"
        >
          {/* Crisp Clean White Card */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            {/* Header Text */}
            <div className="text-center mb-7">
              <h1 className="text-2xl sm:text-[28px] font-serif text-stone-900 tracking-tight leading-tight">
                {authMode === 'login' && 'Welcome Back'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'forgot_email' && 'Forgot Password'}
                {authMode === 'forgot_otp' && 'Verify Code'}
                {authMode === 'forgot_reset' && 'Set New Password'}
              </h1>
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400 mt-2 font-medium">
                {authMode === 'login' && 'Access your exclusive collections'}
                {authMode === 'signup' && 'Join for an elevated shopping experience'}
                {authMode === 'forgot_email' && 'Enter your email for account recovery'}
                {authMode === 'forgot_otp' && `Code sent to ${forgotEmail}`}
                {authMode === 'forgot_reset' && 'Create your new credentials'}
              </p>
            </div>

            {/* Clean Tab Switcher: Sign In / Sign Up */}
            {(authMode === 'login' || authMode === 'signup') && (
              <div className="flex border-b border-stone-100 mb-7">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 pb-3 text-xs uppercase tracking-widest font-semibold transition-all relative ${
                    authMode === 'login'
                      ? 'text-stone-900'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Sign In
                  {authMode === 'login' && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900"
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 pb-3 text-xs uppercase tracking-widest font-semibold transition-all relative ${
                    authMode === 'signup'
                      ? 'text-stone-900'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Sign Up
                  {authMode === 'signup' && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900"
                    />
                  )}
                </button>
              </div>
            )}

            {/* Back to Sign In Link for Forgot Password */}
            {!['login', 'signup'].includes(authMode) && (
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-medium text-stone-400 hover:text-stone-900 transition-colors mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            )}

            {/* Animated Form State */}
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {/* SIGN IN & SIGN UP FORM */}
                {(authMode === 'login' || authMode === 'signup') && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {authMode === 'signup' && (
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                          Full Name
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                        Email address
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-stone-600">
                          Password
                        </label>
                        {authMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => {
                              setForgotEmail(formData.email)
                              setAuthMode('forgot_email')
                            }}
                            className="text-[11px] font-medium text-stone-500 hover:text-stone-900 transition-colors"
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
                          className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all pr-14"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-wider uppercase text-stone-400 hover:text-stone-900 transition-colors py-1"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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

                {/* FORGOT PASSWORD: STEP 1 */}
                {authMode === 'forgot_email' && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                        Email address
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="name@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Sending...' : 'Send Recovery Code'}
                    </button>
                  </form>
                )}

                {/* FORGOT PASSWORD: STEP 2 (OTP) */}
                {authMode === 'forgot_otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5 text-center">
                        Verification Code
                      </label>
                      <input
                        required
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-2xl text-center font-mono tracking-[0.4em] text-stone-900 placeholder:text-stone-300 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                      <span>Expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span>
                      {otpTimer === 0 && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-stone-900 underline font-semibold hover:text-black"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </form>
                )}

                {/* FORGOT PASSWORD: STEP 3 (NEW PASSWORD) */}
                {authMode === 'forgot_reset' && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                        New Password
                      </label>
                      <input
                        required
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Minimalist Trust Badge */}
            <div className="mt-7 pt-5 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
              <span>SSL Secure & Private</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
