import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const token = searchParams.get('token')
    const userId = searchParams.get('user_id')

    if (!token || !userId) {
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }

    authApi
      .verifyEmail({ token, userId })
      .then((res) => {
        setStatus('success')
        setMessage(res.message || 'Email verified successfully.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.message || 'Verification failed.')
      })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-xl">
        <h1 className="text-3xl font-bold mb-4">Email Verification</h1>
        <div
          className={`rounded-xl border p-6 ${
            status === 'success'
              ? 'border-green-200 bg-green-50'
              : status === 'error'
              ? 'border-red-200 bg-red-50'
              : 'border-pink-100 bg-pink-50'
          }`}
        >
          <p className="mb-4 text-gray-800">{message}</p>
          <Link
            to="/account"
            className="inline-flex items-center justify-center rounded-full bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            Go to login
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
