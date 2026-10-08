import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { api } from '../api/client'
import { cookieStorage } from '../utils/cookieStorage'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return action.payload || []
    case 'ADD': {
      const { item, qty = 1 } = action.payload
      const idx = state.findIndex(
        (i) => i.product_id === (item.product_id || item.id) && (i.size || '') === (item.size || '')
      )
      if (idx >= 0) {
        const copy = state.slice()
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty }
        return copy
      }
      // For new local items, use product_id as id since we don't have a backend ID yet
      return [...state, { ...item, id: item.id || item.product_id, product_id: item.product_id || item.id, qty }]
    }
    case 'REMOVE': {
      const { id, size } = action.payload
      // Filter by id (cart_item id) if it exists, otherwise check product_id for guest usage
      return state.filter((i) => !((i.id === id || i.product_id === id) && (i.size || '') === (size || '')))
    }
    case 'SET_QTY': {
      const { id, size, qty } = action.payload
      return state.map((i) =>
        (i.id === id || i.product_id === id) && (i.size || '') === (size || '') ? { ...i, qty } : i
      )
    }
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  const [loading, setLoading] = useState(true)

  // Helper to fetch and format cart from API
  const fetchApiCart = async () => {
    const token = cookieStorage.getItem('token')
    if (!token) return

    try {
      const data = await api.getCart(token)
      console.log('CartContext: Fetched from API', data)
      const cartItems = data.cart?.items || data.items || []

      const formattedItems = cartItems.map(item => ({
        id: item.id,                 // cart_items.id (Critical for DELETE/UPDATE)
        product_id: item.product_id,  // products.id (For navigation/reference)
        name: item.product_name || item.name,
        price: parseFloat(item.price) || 0,
        image: item.image || '/placeholder.jpg',
        size: item.size || 'M',
        qty: item.quantity || item.qty || 1,
        variant_id: item.variant_id,
      }))

      dispatch({ type: 'INIT', payload: formattedItems })
    } catch (e) {
      console.error('Failed to fetch API cart:', e)
    }
  }

  // Load initial data
  useEffect(() => {
    const initCart = async () => {
      const token = cookieStorage.getItem('token')
      if (token) {
        // Logged in: fetch from API
        await fetchApiCart()
      } else {
        // Guest: no persistence
      }
      setLoading(false)
    }
    initCart()
  }, [])

  // Listen for login/logout events from AuthContext
  useEffect(() => {
    const handleLogin = async () => {
      console.log('Auth login detected - fetching API cart')
      await fetchApiCart()
    }

    const handleLogout = () => {
      console.log('Auth logout detected - clearing cart')
      dispatch({ type: 'CLEAR' }) // Clear state
    }

    window.addEventListener('auth-login', handleLogin)
    window.addEventListener('auth-logout', handleLogout)

    return () => {
      window.removeEventListener('auth-login', handleLogin)
      window.removeEventListener('auth-logout', handleLogout)
    }
  }, [])



  const totalQty = useMemo(() => items.reduce((s, i) => s + (i.qty || 0), 0), [items])
  const subtotal = useMemo(() => items.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0), [items])

  const value = useMemo(() => ({
    items,
    totalQty,
    subtotal,
    dispatch,
    loading,
    refreshCart: fetchApiCart
  }), [items, totalQty, subtotal, loading])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
