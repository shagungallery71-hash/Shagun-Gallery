import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import { cookieStorage } from '../../utils/cookieStorage';

// Thunks
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const token = cookieStorage.getItem('token');
            if (!token) return null; // Indicate guest mode

            const data = await api.getCart(token);
            return data.cart?.items || data.items || [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async ({ product, quantity = 1, variantId }, { dispatch, getState, rejectWithValue }) => {
        const token = cookieStorage.getItem('token');

        try {
            if (token) {
                const response = await api.addToCart({
                    productId: product.id,
                    variantId,
                    quantity
                }, token);
                
                // Fetch latest cart from server to maintain sync
                dispatch(fetchCart());
                
                return { isAuth: true };
            } else {
                // Guest: Return item to be added to local state
                return {
                    product_id: product.id,
                    id: product.id, // Guest uses product id as id
                    name: product.name,
                    price: product.price,
                    image: product.image || product.primary_image,
                    quantity,
                    qty: quantity,
                    variant_id: variantId,
                    size: product.size || 'M',
                    color: product.color,
                    color_code: product.color_code
                };
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateCartItem = createAsyncThunk(
    'cart/updateCartItem',
    async ({ id, quantity }, { rejectWithValue }) => {
        const token = cookieStorage.getItem('token');
        try {
            if (token) {
                // id MUST be cart_items.id
                await api.updateCartItem(id, quantity, token);
                return { id, quantity };
            } else {
                return { id, quantity }; // Guest update
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const removeFromCart = createAsyncThunk(
    'cart/removeFromCart',
    async (id, { rejectWithValue }) => {
        const token = cookieStorage.getItem('token');
        try {
            if (token) {
                // id MUST be cart_items.id
                await api.removeFromCart(id, token);
                return id;
            } else {
                return id; // Guest remove
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const clearCart = createAsyncThunk(
    'cart/clearCart',
    async (_, { rejectWithValue }) => {
        const token = cookieStorage.getItem('token');
        try {
            if (token) {
                await api.clearCart(token);
            }
            return;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const mergeGuestCart = createAsyncThunk(
    'cart/mergeGuestCart',
    async (guestItems, { dispatch }) => {
        const token = cookieStorage.getItem('token');
        if (!token || !guestItems.length) return;

        console.log('Redux: Merging guest cart...', guestItems);
        await Promise.all(guestItems.map(item =>
            api.addToCart({
                productId: item.product_id || item.id,
                quantity: item.qty || item.quantity || 1,
                variantId: item.variant_id
            }, token).catch(e => console.error('Merge error', e))
        ));
        // After merge, fetch fresh cart
        dispatch(fetchCart());
    }
);

// Helper to save to local storage (for guest)
const saveToLocal = (items) => {
    const token = cookieStorage.getItem('token');
    if (!token) {
        cookieStorage.setItem('cart', JSON.stringify(items));
    }
};

const initialState = {
    items: JSON.parse(cookieStorage.getItem('cart') || '[]'),
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        // Synchronous actions if needed (e.g. clear local only)
        resetCart: (state) => {
            state.items = [];
            state.status = 'idle';
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchCart.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (action.payload === null) {
                    return; // Retain guest cart items
                }
                
                // Map API items to unified structure
                state.items = action.payload.map(item => ({
                    id: item.id, // cart_items.id
                    product_id: item.product_id, // useful ref
                    name: item.product_name || item.name,
                    price: parseFloat(item.price) || 0,
                    image: item.image || '/placeholder.jpg',
                    size: item.size,
                    color: item.color,
                    color_code: item.color_code,
                    qty: item.quantity || item.qty || 1,
                    variant_id: item.variant_id,
                }));
                // If logged in, clear local storage guest cart
                if (cookieStorage.getItem('token')) {
                    cookieStorage.removeItem('cart');
                }
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                // Fallback to local if fetch fails? Maybe not.
            })

            // Add
            .addCase(addToCart.fulfilled, (state, action) => {
                const newItem = action.payload;
                
                // If authenticated, we just dispatched fetchCart(), so array syncs on its own
                if (newItem.isAuth) return;

                const existingItem = state.items.find(i =>
                    (i.product_id === newItem.product_id || i.id === newItem.id) &&
                    i.variant_id === newItem.variant_id
                );

                if (existingItem) {
                    existingItem.qty += newItem.quantity || newItem.qty || 1;
                } else {
                    // Normalize structure
                    state.items.push({
                        ...newItem,
                        qty: newItem.quantity || newItem.qty || 1,
                        // Ensure id field is set correctly based on guest/auth
                        id: newItem.id || newItem.product_id,
                        product_id: newItem.product_id || newItem.id,
                        size: newItem.size,
                        color: newItem.color,
                        color_code: newItem.color_code
                    });
                }
                saveToLocal(state.items);
            })

            // Update
            .addCase(updateCartItem.pending, (state, action) => {
                // Optimistic update could go here if we passed new qty in meta
                const { id, quantity } = action.meta.arg;
                const item = state.items.find(i => i.id === id || i.product_id === id);
                if (item) item.qty = quantity;
            })
            .addCase(updateCartItem.rejected, (state, action) => {
                // Revert? Complex without previous state tracking.
                // For now, allow fetchCart to resolve discrepancies or simple reload
            })
            .addCase(updateCartItem.fulfilled, (state, action) => {
                const { id, quantity } = action.payload;
                const item = state.items.find(i => i.id === id || i.product_id === id);
                if (item) item.qty = quantity;
                saveToLocal(state.items);
            })

            // Remove
            .addCase(removeFromCart.pending, (state, action) => {
                // Optimistic
                const id = action.meta.arg;
                state.items = state.items.filter(i => i.id !== id && i.product_id !== id);
            })
            .addCase(removeFromCart.fulfilled, (state, action) => {
                // Already removed optimistically
                // checking id
                saveToLocal(state.items);
            })

            // Clear
            .addCase(clearCart.fulfilled, (state) => {
                state.items = [];
                saveToLocal([]);
            });
    },
});

export const { resetCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartStatus = (state) => state.cart.status;
export const selectCartTotalQty = (state) => state.cart.items.reduce((acc, item) => acc + (item.qty || 0), 0);
export const selectCartSubtotal = (state) => state.cart.items.reduce((acc, item) => acc + (item.qty || 0) * (item.price || 0), 0);

export default cartSlice.reducer;
