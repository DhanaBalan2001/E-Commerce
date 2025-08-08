import { useState, useCallback, useEffect } from 'react';
import { cartService } from '../services';
import { useAppContext } from '../context/AppContext';

export const useCart = () => {
  // Always call useAppContext at the top level
  const appContext = useAppContext();
  const { user, isAuthenticated } = appContext || {};
  
  // Always initialize all state hooks in the same order
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [addToCartError, setAddToCartError] = useState(null);
  const [updateCartLoading, setUpdateCartLoading] = useState(false);
  const [updateCartError, setUpdateCartError] = useState(null);
  const [removeFromCartLoading, setRemoveFromCartLoading] = useState(false);
  const [removeFromCartError, setRemoveFromCartError] = useState(null);
  const [clearCartLoading, setClearCartLoading] = useState(false);
  const [clearCartError, setClearCartError] = useState(null);

  // Always define fetchCart callback
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCart(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await cartService.getCart();
      setCart(response);
    } catch (err) {
      setError(err.message || 'Failed to fetch cart');
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Always call useEffect
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Always define all callbacks
  const addToCart = useCallback(async (productData) => {
    if (!user) {
      const error = new Error('Please login to add items to cart');
      setAddToCartError(error.message);
      throw error;
    }
    
    try {
      setAddToCartLoading(true);
      setAddToCartError(null);
      const result = await cartService.addToCart(productData.productId, productData.quantity);
      await fetchCart();
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to add to cart';
      setAddToCartError(errorMessage);
      throw err;
    } finally {
      setAddToCartLoading(false);
    }
  }, [user, fetchCart]);

  const updateCartItem = useCallback(async (itemData) => {
    if (!user) {
      const error = new Error('Please login to update cart');
      setUpdateCartError(error.message);
      throw error;
    }
    
    // Optimistic update - update UI immediately
    const previousCart = cart;
    if (cart && cart.items) {
      const updatedItems = cart.items.map(item => 
        item.product._id === itemData.productId 
          ? { ...item, quantity: itemData.quantity }
          : item
      );
      const updatedCart = {
        ...cart,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      };
      setCart(updatedCart);
    }
    
    try {
      setUpdateCartLoading(true);
      setUpdateCartError(null);
      const result = await cartService.updateCartItem(itemData.productId, itemData.quantity);
      // Fetch fresh data to ensure consistency
      await fetchCart();
      return result;
    } catch (err) {
      // Revert optimistic update on error
      setCart(previousCart);
      const errorMessage = err.message || 'Failed to update cart';
      setUpdateCartError(errorMessage);
      throw err;
    } finally {
      setUpdateCartLoading(false);
    }
  }, [user, cart, fetchCart]);

  const removeFromCart = useCallback(async (itemId) => {
    if (!user) {
      const error = new Error('Please login to remove items from cart');
      setRemoveFromCartError(error.message);
      throw error;
    }
    
    // Optimistic update - remove item immediately from UI
    const previousCart = cart;
    if (cart && cart.items) {
      const updatedItems = cart.items.filter(item => item.product._id !== itemId);
      const updatedCart = {
        ...cart,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      };
      setCart(updatedCart);
    }
    
    try {
      setRemoveFromCartLoading(true);
      setRemoveFromCartError(null);
      const result = await cartService.removeFromCart(itemId);
      // Fetch fresh data to ensure consistency
      await fetchCart();
      return result;
    } catch (err) {
      // Revert optimistic update on error
      setCart(previousCart);
      const errorMessage = err.message || 'Failed to remove from cart';
      setRemoveFromCartError(errorMessage);
      throw err;
    } finally {
      setRemoveFromCartLoading(false);
    }
  }, [user, cart, fetchCart]);

  const clearCart = useCallback(async () => {
    if (!user) {
      const error = new Error('Please login to clear cart');
      setClearCartError(error.message);
      throw error;
    }
    
    try {
      setClearCartLoading(true);
      setClearCartError(null);
      const result = await cartService.clearCart();
      await fetchCart();
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to clear cart';
      setClearCartError(errorMessage);
      throw err;
    } finally {
      setClearCartLoading(false);
    }
  }, [user, fetchCart]);

  // Always return the same object structure
  return {
    data: cart,
    cart,
    loading,
    error,
    execute: fetchCart,
    addToCart: {
      mutate: addToCart,
      loading: addToCartLoading,
      error: addToCartError
    },
    updateCartItem: {
      mutate: updateCartItem,
      loading: updateCartLoading,
      error: updateCartError
    },
    removeFromCart: {
      mutate: removeFromCart,
      loading: removeFromCartLoading,
      error: removeFromCartError
    },
    clearCart: {
      mutate: clearCart,
      loading: clearCartLoading,
      error: clearCartError
    },
    addToCartLoading,
    isAuthenticated: !!user
  };
};

export const useCartCount = () => {
  const { cart } = useCart();
  return cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
};
