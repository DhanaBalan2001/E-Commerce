import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowLeft, FaLock } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import { cartService } from '../../services';
import ConfirmModal from '../../components/common/ConfirmModal';
import CrackerLoader from '../../components/common/CrackerLoader';
import './cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  
  const { isAuthenticated, updateCartCount } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login'); // Changed from '/auth/login' to '/login'
      return;
    }
    loadCart();
  }, [isAuthenticated, navigate]);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await cartService.getCart();
      setCartItems(response.cart || []);
      setCartTotal(response.cartTotal || 0);
      updateCartCount(response.itemCount || 0);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError(error.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    // Optimistic update - update UI immediately
    const previousCartItems = [...cartItems];
    const previousCartTotal = cartTotal;
    
    const updatedItems = cartItems.map(item => 
      item.product._id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    setCartItems(updatedItems);
    setCartTotal(newTotal);
    
    try {
      setUpdating(true);
      setError('');
      await cartService.updateCartItem(productId, newQuantity);
      // Update cart count in context
      updateCartCount(updatedItems.reduce((sum, item) => sum + item.quantity, 0));
    } catch (error) {
      // Revert optimistic update on error
      setCartItems(previousCartItems);
      setCartTotal(previousCartTotal);
      console.error('Error updating quantity:', error);
      setError(error.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    // Optimistic update - remove item immediately from UI
    const previousCartItems = [...cartItems];
    const previousCartTotal = cartTotal;
    
    const updatedItems = cartItems.filter(item => item.product._id !== productId);
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    setCartItems(updatedItems);
    setCartTotal(newTotal);
    
    // Show success notification
    const removedItem = cartItems.find(item => item.product._id === productId);
    setSuccessMessage(`${removedItem?.product?.name || 'Item'} removed from cart`);
    
    // Scroll to top to show notification
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => setSuccessMessage(''), 3000);
    
    try {
      setUpdating(true);
      setError('');
      await cartService.removeFromCart(productId);
      // Update cart count in context
      updateCartCount(updatedItems.reduce((sum, item) => sum + item.quantity, 0));
    } catch (error) {
      // Revert optimistic update on error
      setCartItems(previousCartItems);
      setCartTotal(previousCartTotal);
      console.error('Error removing item:', error);
      setError(error.message || 'Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCartClick = () => {
    setShowClearModal(true);
  };

  const handleClearCartConfirm = async () => {
    try {
      setUpdating(true);
      setError('');
      await cartService.clearCart();
      await loadCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError(error.message || 'Failed to clear cart');
    } finally {
      setUpdating(false);
      setShowClearModal(false);
    }
  };

  const handleCheckout = async () => {
    console.log('🛒 Checkout button clicked');
    console.log('📊 Cart items:', cartItems.length);
    console.log('💰 Cart total:', cartTotal);
    console.log('🔐 Is authenticated:', isAuthenticated);
    console.log('🌐 Current URL:', window.location.href);
    
    // Validate authentication
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Validate cart
    if (cartItems.length === 0) {
      console.log('❌ Cart is empty');
      setError('Your cart is empty. Please add items before checkout.');
      return;
    }
    
    if (cartTotal <= 0) {
      console.log('❌ Cart total is zero or negative');
      setError('Invalid cart total. Please refresh and try again.');
      return;
    }
    
    // Check stock availability
    const outOfStockItems = cartItems.filter(item => 
      !item.product || item.product.stock < item.quantity
    );
    
    if (outOfStockItems.length > 0) {
      console.log('❌ Some items are out of stock:', outOfStockItems);
      setError('Some items in your cart are out of stock. Please update quantities or remove them.');
      return;
    }
    
    console.log('✅ All validations passed, navigating to checkout');
    
    try {
      // Store cart data in localStorage as backup
      localStorage.setItem('checkoutData', JSON.stringify({
        cartItems,
        cartTotal,
        timestamp: Date.now()
      }));
      
      // Navigate to checkout
      navigate('/checkout', { 
        state: { 
          cartItems, 
          cartTotal,
          fromCart: true 
        },
        replace: false
      });
      
      console.log('✅ Navigation to checkout initiated');
      
      // Debug: Check URL after a short delay
      setTimeout(() => {
        console.log('📍 Current URL after navigation:', window.location.href);
      }, 100);
      
    } catch (navError) {
      console.error('❌ Navigation error:', navError);
      setError('Failed to navigate to checkout. Please try again.');
    }
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const calculateItemTotal = (price, quantity) => {
    return (price * quantity).toFixed(2);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="cart-page d-flex align-items-center justify-content-center" style={{minHeight: '60vh'}}>
        <CrackerLoader size="lg" text="Loading your cart..." />
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Page Header */}
      <div className="cart-header">
        <Container>
          <div className="cart-header-content">
            <h1 className="cart-page-title">
              <FaShoppingCart className="me-3" />
              Shopping Cart
            </h1>
            <p className="cart-page-subtitle">
              Review your items and proceed to checkout
            </p>
            <div className="cart-breadcrumb">
              <Link to="/" className="breadcrumb-link">Home</Link>
              <span className="breadcrumb-separator">›</span>
              <Link to="/products" className="breadcrumb-link">Products</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Cart</span>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {/* Success Alert */}
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}
        
        {/* Empty Cart State */}
        {cartItems.length === 0 ? (
          <div className="empty-cart fade-in">
            <div className="empty-cart-icon">
              <FaShoppingCart />
            </div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleContinueShopping}
              className="mt-3"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <Row>
            {/* Cart Items */}
            <Col lg={8} md={12}>
              <div className="cart-items-header mb-3">
                <h4>Cart Items ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</h4>
              </div>
              
              {/* Cart Actions */}
              <div className="cart-actions fade-in mb-3">
                <Row>
                  <Col>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleContinueShopping}
                      className="continue-shopping-btn w-100"
                      disabled={updating}
                    >
                      <FaArrowLeft className="me-2" />
                      Browse
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleClearCartClick}
                      className="clear-cart-btn w-100"
                      disabled={updating || cartItems.length === 0}
                    >
                      <FaTrash className="me-2" />
                      Clear
                    </Button>
                  </Col>
                </Row>
              </div>
              
              <Row>
                {cartItems.map((item, index) => (
                  <Col lg={6} md={6} xs={6} key={item._id} className="mb-4">
                    <Card className="cart-item-card h-100">
                      <div className="cart-product-image-container">
                        {item.product?.images?.[0] ? (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL}${item.product.images[0].url}`}
                            alt={item.product?.name?.length > 20 ? item.product.name.substring(0, 20) + '...' : item.product?.name}
                            className="cart-product-image"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.svg';
                            }}
                          />
                        ) : (
                          <div className="no-image-placeholder">
                            No Image Available
                          </div>
                        )}
                      </div>
                      
                      <Card.Body className="d-flex flex-column p-2">
                        <Card.Title className="h6 mb-1 cart-product-title">
                          <Link 
                            to={`/products/${item.product?._id}`}
                            className="text-decoration-none text-dark"
                          >
                            {item.product?.name || 'Unknown Product'}
                          </Link>
                        </Card.Title>
                        
                        <div className="product-price mb-1 cart-product-price">
                          <strong>{formatCurrency(item.product?.price || 0)}</strong>
                        </div>
                        
                        <div className="quantity-controls mb-2 cart-quantity-controls">
                          <button
                            className="quantity-btn mobile-btn-small"
                            onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updating}
                            aria-label="Decrease quantity"
                          >
                            <FaMinus />
                          </button>
                          <input
                            type="number"
                            className="quantity-input cart-quantity-input"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value);
                              if (newQuantity > 0) {
                                handleUpdateQuantity(item.product._id, newQuantity);
                              }
                            }}
                            min="1"
                            max={item.product?.stock || 999}
                            disabled={updating}
                          />
                          <button
                            className="quantity-btn mobile-btn-small"
                            onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                            disabled={item.quantity >= (item.product?.stock || 999) || updating}
                            aria-label="Increase quantity"
                          >
                            <FaPlus />
                          </button>
                        </div>
                        
                        <div className="cart-item-actions">
                          <Row>
                            <Col>
                              <div className="item-total text-center mb-1 cart-item-total">
                                <strong>{formatCurrency(calculateItemTotal(item.product?.price || 0, item.quantity))}</strong>
                              </div>
                            </Col>
                          </Row>
                          <Row>
                            <Col>
                              <button
                                className="remove-btn w-100 mobile-btn-small"
                                onClick={() => handleRemoveItem(item.product._id)}
                                disabled={updating}
                                aria-label="Remove item from cart"
                              >
                                <FaTrash className="me-1" />
                                Remove
                              </button>
                            </Col>
                          </Row>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              
             
            </Col>
            
            {/* Order Summary */}
            <Col lg={4} md={12}>
              <div className="order-summary-card slide-in-right">
                <h4 className="order-summary-title">Order Summary</h4>
                
                {/* Summary Details */}
                <div className="summary-row">
                  <span className="summary-label">Subtotal:</span>
                  <span className="summary-value">{formatCurrency(cartTotal)}</span>
                </div>
                
                <div className="summary-row">
                  <span className="summary-label">Shipping:</span>
                  <span className="summary-value">
                    {cartTotal >= 500 ? 'Free' : formatCurrency(50)}
                  </span>
                </div>
                
                <div className="summary-row">
                  <span className="summary-label">Tax (18%):</span>
                  <span className="summary-value">
                    {formatCurrency(cartTotal * 0.18)}
                  </span>
                </div>
                
                <div className="summary-row total-row">
                  <span className="summary-label">Total:</span>
                  <span className="summary-value">
                    {formatCurrency(
                      cartTotal + 
                      (cartTotal >= 500 ? 0 : 50) + 
                      (cartTotal * 0.18)
                    )}
                  </span>
                </div>
                
                {/* Free Shipping Notice */}
                {cartTotal < 500 && (
                  <div className="free-shipping-notice">
                    Add {formatCurrency(500 - cartTotal)} more for free shipping!
                  </div>
                )}
                
                {/* Checkout Button */}
                <Button
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || updating}
                  size="lg"
                >
                  <FaLock className="me-2" />
                  Proceed to Checkout
                </Button>


                
                 {/* Security Notice */}
                <div className="secure-checkout">
                  <i className="fas fa-shield-alt"></i>
                  Secure checkout with SSL encryption
                </div>
                
              </div>
            </Col>
          </Row>
        )}
      </Container>
      
      <ConfirmModal
        show={showClearModal}
        onHide={() => setShowClearModal(false)}
        onConfirm={handleClearCartConfirm}
        title="Clear Cart"
        message="Are you sure you want to clear your cart? This will remove all items."
        confirmText="Clear Cart"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Cart;

