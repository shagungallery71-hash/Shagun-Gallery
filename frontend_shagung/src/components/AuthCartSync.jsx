import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { fetchCart } from '../store/slices/cartSlice';

const AuthCartSync = () => {
    const { token } = useAuth();
    const dispatch = useDispatch();

    useEffect(() => {
        if (token) {
            dispatch(fetchCart());
        }
    }, [token, dispatch]);

    return null;
};

export default AuthCartSync;
