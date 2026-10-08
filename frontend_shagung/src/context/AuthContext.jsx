import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { authApi } from '../api/auth'
import { resetSessionState } from '../api/client'
import { cookieStorage } from '../utils/cookieStorage'

const AuthContext = createContext(null)

const STORAGE_USER_KEY = 'auth:user'
const STORAGE_TOKEN_KEY = 'token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Clear session helper
  const clearSession = useCallback(() => {
    console.log('Clearing session...')
    setUser(null)
    setToken(null)
    try {
      cookieStorage.removeItem(STORAGE_USER_KEY)
      cookieStorage.removeItem(STORAGE_TOKEN_KEY)
    } catch (e) { /* ignore */ }
    // Dispatch logout event for other components
    window.dispatchEvent(new Event('auth-logout'))
  }, [])

  // Load user from cookies on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const rawUser = cookieStorage.getItem(STORAGE_USER_KEY)
        const rawToken = cookieStorage.getItem(STORAGE_TOKEN_KEY)

        if (rawUser && rawToken) {
          const parsedUser = JSON.parse(rawUser)
          setUser(parsedUser)
          setToken(rawToken)
          console.log('Session loaded from cookies:', parsedUser.email)
        } else {
          // console.log('No session found in cookies')
        }
      } catch (e) {
        console.error('Error loading session:', e)
        // Clear corrupted data
        clearSession()
      }
      setLoading(false)
    }

    loadSession()
  }, [clearSession])

  // Listen for auth-expired event (401 from API) and auto-logout
  useEffect(() => {
    const handleAuthExpired = () => {
      console.log('Auth expired event received - clearing session')
      clearSession()
    }

    window.addEventListener('auth-expired', handleAuthExpired)
    return () => window.removeEventListener('auth-expired', handleAuthExpired)
  }, [clearSession])

  // Persist user to cookies when state changes
  useEffect(() => {
    // Don't persist during initial loading
    if (loading) return

    try {
      if (user && token) {
        cookieStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
        cookieStorage.setItem(STORAGE_TOKEN_KEY, token)
        console.log('Session persisted to cookies')
      }
    } catch (e) {
      console.error('Error persisting session:', e)
    }
  }, [user, token, loading])

  async function signIn({ email, password }) {
    const data = await authApi.login({ email, password })
    const backendUser = data.user || {}
    const authUser = {
      id: backendUser.id,
      email: backendUser.email || email,
      name:
        backendUser.username ||
        backendUser.name ||
        (backendUser.email || email || '').split('@')[0],
      role: backendUser.role,
    }

    // Reset session invalid flag before setting new token
    resetSessionState()

    // Set state
    setUser(authUser)
    setToken(data.token)

    // Dispatch event so CartContext can react
    window.dispatchEvent(new Event('auth-login'))

    console.log('User signed in:', authUser.email)
    return authUser
  }

  async function signUp({ name, email, password }) {
    return authApi.register({ username: name, email, password })
  }

  async function sendForgotPassword(email) {
    return authApi.forgetPassword({ email })
  }

  async function createAdmin({ username, email, password }) {
    return authApi.createAdmin({ username, email, password }, token)
  }

  async function deleteUser({ email }) {
    return authApi.deleteUser({ email }, token)
  }

  function signOut() {
    console.log('User signing out...')
    clearSession()
  }

  // Check if session is valid (helper for components)
  const isAuthenticated = useMemo(() => {
    return !loading && !!user && !!token
  }, [loading, user, token])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      signIn,
      signUp,
      signOut,
      sendForgotPassword,
      createAdmin,
      deleteUser,
      clearSession
    }),
    [user, token, loading, isAuthenticated, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

