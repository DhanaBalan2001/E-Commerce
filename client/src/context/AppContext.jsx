import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import { cartService } from '../services/cartService';

const AppContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  cartCount: 0,
  loading: true,
  error: null
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'SET_CART_COUNT':
      return {
        ...state,
        cartCount: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        cartCount: 0,
        loading: false,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Throttle logic to avoid spamming /cart API
let lastCartFetchTime = 0;
const CART_FETCH_INTERVAL = 3000; // 3 seconds

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadCartCount = async () => {
    const now = Date.now();
    if (now - lastCartFetchTime < CART_FETCH_INTERVAL) return; // Prevent frequent calls
    lastCartFetchTime = now;

    try {
      if (!authService.isAuthenticated()) {
        dispatch({ type: 'SET_CART_COUNT', payload: 0 });
        return;
      }

      const cartData = await cartService.getCart();
      dispatch({ type: 'SET_CART_COUNT', payload: cartData.itemCount || 0 });
    } catch (error) {
      dispatch({ type: 'SET_CART_COUNT', payload: 0 });
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();

        if (isAuthenticated && user) {
          dispatch({ type: 'SET_USER', payload: user });
          await loadCartCount();
        } else {
          dispatch({ type: 'SET_USER', payload: null });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize app' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeApp();
  }, []);

  const login = async (userData) => {
    try {
      dispatch({ type: 'SET_USER', payload: userData });
      await loadCartCount();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to complete login' });
    }
  };

  const logout = (reason = 'manual') => {
    try {

      authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    try {
      const currentUser = authService.getCurrentUser();
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: 'UPDATE_USER', payload: userData });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update user data' });
    }
  };

  const updateCartCount = (count) => {
    dispatch({ type: 'SET_CART_COUNT', payload: count });
  };

  const refreshUser = async () => {
    try {
      if (!authService.isAuthenticated()) return;

      const response = await authService.getProfile();
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        dispatch({ type: 'SET_USER', payload: response.user });
      }
    } catch (error) {
      if (error.status === 401) {
        logout();
      }
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const checkAuth = () => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();

    if (!isAuthenticated || !user) {
      dispatch({ type: 'LOGOUT' });
      return false;
    }

    return true;
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    updateCartCount,
    loadCartCount,
    refreshUser,
    clearError,
    checkAuth,
    isLoggedIn: state.isAuthenticated,
    userName: state.user?.name || '',
    userEmail: state.user?.email || ''
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export { AppProvider, useAppContext, useAuth, useCart };

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

const useAuth = () => {
  const { isAuthenticated, user, login, logout, checkAuth } = useAppContext();
  return {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth,
    isLoggedIn: isAuthenticated
  };
}

const useCart = () => {
  const { cartCount, updateCartCount, loadCartCount } = useAppContext();
  return {
    cartCount,
    updateCartCount,
    loadCartCount,
    hasItems: cartCount > 0
  };
}
