import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useToast } from '../components/ToastContext'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()
  const { showToast } = useToast()

  const token = searchParams.get('token')
  const userId = searchParams.get('user_id')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!token || !userId) {
      setError('Invalid or missing reset link.')
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      console.log('🔵 Resetting password with:', { token: token.substring(0, 10) + '...', userId })
      const res = await authApi.resetPassword({ token, userId, newPassword: password })
      console.log('✅ Reset success:', res)
      const msg = res.message || 'Password reset successfully.'
      setSuccessMessage(msg)
      showToast(msg, 'success')
      setTimeout(() => navigate('/account'), 1500)
    } catch (err) {
      console.error('❌ Reset error:', err)
      const msg = err?.message || 'Failed to reset password.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-xl">
        <h1 className="text-3xl font-bold mb-4">Reset Password</h1>
        <div className="bg-white border border-pink-100 rounded-xl p-6">
          {!token || !userId ? (
            <p className="text-red-600 text-sm">Invalid reset link.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-sm text-red-600">{error}</div>}
              {successMessage && <div className="text-sm text-green-600">{successMessage}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-60"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}
          <div className="mt-4 text-sm">
            <span className="text-gray-600">Remembered your password? </span>
            <Link to="/account" className="text-pink-600 hover:underline">
              Go to login
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
