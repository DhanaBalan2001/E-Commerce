import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowLeft, FaLock } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import { cartService } from '../../services';
import ConfirmModal from '../../components/common/ConfirmModal';
import CrackerLoader from '../../components/common/CrackerLoader';
import { getImageUrl } from '../../utils/imageUrl';
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
      setError(error.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };
  


  const handleUpdateBundleQuantity = async (cartItemId, newQuantity, type) => {
    if (newQuantity < 1) return;
    
    // Find the cart item
    const cartItem = cartItems.find(item => item._id === cartItemId);
    if (!cartItem) return;
    
    // Optimistic update
    const previousCartItems = [...cartItems];
    const previousCartTotal = cartTotal;
    
    const updatedItems = cartItems.map(item => 
      item._id === cartItemId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    const newTotal = updatedItems.reduce((sum, item) => {
      if (item.bundleInfo?.bundlePrice) {
        return sum + (item.bundleInfo.bundlePrice * item.quantity);
      } else if (item.giftBoxInfo?.giftBoxPrice) {
        return sum + (item.giftBoxInfo.giftBoxPrice * item.quantity);
      }
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    setCartItems(updatedItems);
    setCartTotal(newTotal);
    
    try {
      setUpdating(true);
      setError('');
      
      if (type === 'bundle') {
        await cartService.updateBundleQuantity(cartItem.bundleInfo.bundleId, newQuantity);
      } else if (type === 'giftbox') {
        await cartService.updateGiftBoxQuantity(cartItem.giftBoxInfo.giftBoxId, newQuantity);
      }
      
      // Update cart count
      const newItemCount = updatedItems.reduce((sum, item) => {
        if (item.bundleInfo?.bundleId || item.giftBoxInfo?.giftBoxId) {
          return sum + 1;
        }
        return sum + item.quantity;
      }, 0);
      updateCartCount(newItemCount);
    } catch (error) {
      // Revert on error
      setCartItems(previousCartItems);
      setCartTotal(previousCartTotal);
      setError(error.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    // Find the cart item to get productId
    const cartItem = cartItems.find(item => item._id === cartItemId);
    if (!cartItem) return;
    
    // Optimistic update - update UI immediately
    const previousCartItems = [...cartItems];
    const previousCartTotal = cartTotal;
    
    const updatedItems = cartItems.map(item => 
      item._id === cartItemId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    const newTotal = updatedItems.reduce((sum, item) => {
      if (item.bundleInfo?.bundlePrice) {
        return sum + item.bundleInfo.bundlePrice;
      } else if (item.giftBoxInfo?.giftBoxPrice) {
        return sum + item.giftBoxInfo.giftBoxPrice;
      }
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    setCartItems(updatedItems);
    setCartTotal(newTotal);
    
    try {
      setUpdating(true);
      setError('');
      await cartService.updateCartItem(cartItem.product._id, newQuantity);
      // Update cart count in context
      const newItemCount = updatedItems.reduce((sum, item) => {
        if (item.bundleInfo?.bundleId || item.giftBoxInfo?.giftBoxId) {
          return sum + 1; // Count bundle/gift box as 1 item
        }
        return sum + item.quantity; // Count regular products by quantity
      }, 0);
      updateCartCount(newItemCount);
    } catch (error) {
      // Revert optimistic update on error
      setCartItems(previousCartItems);
      setCartTotal(previousCartTotal);
      setError(error.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    // Find the cart item to get productId and name
    const cartItem = cartItems.find(item => item._id === cartItemId);
    if (!cartItem) return;
    
    // Optimistic update - remove item immediately from UI
    const previousCartItems = [...cartItems];
    const previousCartTotal = cartTotal;
    
    const updatedItems = cartItems.filter(item => item._id !== cartItemId);
    const newTotal = updatedItems.reduce((sum, item) => {
      if (item.bundleInfo?.bundlePrice) {
        return sum + item.bundleInfo.bundlePrice;
      } else if (item.giftBoxInfo?.giftBoxPrice) {
        return sum + item.giftBoxInfo.giftBoxPrice;
      }
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    setCartItems(updatedItems);
    setCartTotal(newTotal);
    
    // Show success notification
    const itemName = cartItem?.product?.name || cartItem?.bundleInfo?.bundleName || cartItem?.giftBoxInfo?.giftBoxName || 'Item';
    setSuccessMessage(`${itemName} removed from cart`);
    
    // Scroll to top to show notification
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => setSuccessMessage(''), 3000);
    
    try {
      setUpdating(true);
      setError('');
      
      // Check if it's a bundle, gift box, or regular product
      if (cartItem.bundleInfo?.isBundle) {
        await cartService.removeBundleFromCart(cartItem.bundleInfo.bundleId);
      } else if (cartItem.giftBoxInfo?.isGiftBox) {
        await cartService.removeGiftBoxFromCart(cartItem.giftBoxInfo.giftBoxId);
      } else {
        await cartService.removeFromCart(cartItem.product._id);
      }
      
      // Update cart count in context
      const newItemCount = updatedItems.reduce((sum, item) => {
        if (item.bundleInfo?.bundleId || item.giftBoxInfo?.giftBoxId) {
          return sum + 1; // Count bundle/gift box as 1 item
        }
        return sum + item.quantity; // Count regular products by quantity
      }, 0);
      updateCartCount(newItemCount);
    } catch (error) {
      // Revert optimistic update on error
      setCartItems(previousCartItems);
      setCartTotal(previousCartTotal);
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
      setError(error.message || 'Failed to clear cart');
    } finally {
      setUpdating(false);
      setShowClearModal(false);
    }
  };

  const handleCheckout = async () => {
    // Validate authentication
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Validate cart
    if (cartItems.length === 0) {
      setError('Your cart is empty. Please add items before checkout.');
      return;
    }
    
    if (cartTotal <= 0) {
      setError('Invalid cart total. Please refresh and try again.');
      return;
    }
    
    // Check stock availability (only for regular products, not bundles/gift boxes)
    const outOfStockItems = cartItems.filter(item => {
      // Skip stock check for bundles and gift boxes
      if (item.bundleInfo?.bundleId || item.giftBoxInfo?.giftBoxId) {
        return false;
      }
      // Check stock only for regular products
      return !item.product || item.product.stock < item.quantity;
    });
    
    if (outOfStockItems.length > 0) {
      setError('Some items in your cart are out of stock. Please update quantities or remove them.');
      return;
    }
    
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
      
    } catch (navError) {
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
              <div className="cart-items-header mb-3" style={{marginTop: '5px'}}>
                <h4>Cart Items ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</h4>
              </div>
              
              {/* Cart Actions */}
              <div className="cart-actions fade-in mb-2">
                <div className="d-flex justify-content-between">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleContinueShopping}
                    disabled={updating}
                    style={{minWidth: '100px'}}
                  >
                    <FaArrowLeft className="me-2" />
                    Browse
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleClearCartClick}
                    disabled={updating || cartItems.length === 0}
                    style={{minWidth: '100px'}}
                  >
                    <FaTrash className="me-2" />
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Desktop Table Layout */}
              <div className="d-none d-lg-block">
                {(() => {
                  // Group items by bundle and gift boxes
                  const bundleGroups = {};
                  const individualItems = [];
                  
                  cartItems.forEach(item => {
                    if (item.bundleInfo?.bundleId) {
                      const bundleId = item.bundleInfo.bundleId;
                      if (!bundleGroups[bundleId]) {
                        bundleGroups[bundleId] = {
                          bundleInfo: item.bundleInfo,
                          items: []
                        };
                      }
                      bundleGroups[bundleId].items.push(item);
                    } else if (item.giftBoxInfo?.giftBoxId) {
                      const giftBoxId = item.giftBoxInfo.giftBoxId;
                      if (!bundleGroups[giftBoxId]) {
                        bundleGroups[giftBoxId] = {
                          giftBoxInfo: item.giftBoxInfo,
                          items: []
                        };
                      }
                      bundleGroups[giftBoxId].items.push(item);
                    } else {
                      individualItems.push(item);
                    }
                  });
                  
                  return (
                    <>
                      {/* Bundle Groups */}
                      {Object.values(bundleGroups).map((bundle, index) => (
                        <Card key={`bundle-${index}`} className="cart-item-card mb-3">
                          <Card.Header className="bg-primary text-white p-3">
                            <Row className="align-items-center">
                              <Col xs={5}>
                                <h6 className="mb-0">
                                  {bundle.bundleInfo ? `📦 Fund` : `🎁 Gift Boxes`}
                                </h6>
                              </Col>
                              <Col xs={3} className="text-center">
                                <div className="d-flex align-items-center justify-content-center">
                                  <button
                                    className="btn btn-outline-light btn-sm"
                                    onClick={() => handleUpdateBundleQuantity(bundle.items[0]._id, (bundle.items[0]?.quantity || 1) - 1, bundle.bundleInfo ? 'bundle' : 'giftbox')}
                                    disabled={(bundle.items[0]?.quantity || 1) <= 1 || updating}
                                    style={{width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                  >
                                    <FaMinus size={10} />
                                  </button>
                                  <span className="mx-2 text-white" style={{minWidth: '30px', textAlign: 'center'}}>{bundle.items[0]?.quantity || 1}</span>
                                  <button
                                    className="btn btn-outline-light btn-sm"
                                    onClick={() => handleUpdateBundleQuantity(bundle.items[0]._id, (bundle.items[0]?.quantity || 1) + 1, bundle.bundleInfo ? 'bundle' : 'giftbox')}
                                    disabled={updating}
                                    style={{width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                  >
                                    <FaPlus size={10} />
                                  </button>
                                </div>
                              </Col>
                              <Col xs={3} className="text-end">
                                <strong>{formatCurrency(((bundle.bundleInfo?.bundlePrice || bundle.giftBoxInfo?.giftBoxPrice) || 0) * (bundle.items[0]?.quantity || 1))}</strong>
                              </Col>
                              <Col xs={1} className="text-end">
                                <button
                                  className="btn btn-outline-light btn-sm"
                                  onClick={() => handleRemoveItem(bundle.items[0]._id)}
                                  disabled={updating}
                                  title={bundle.bundleInfo ? "Remove Bundle" : "Remove Gift Box"}
                                  style={{padding: '2px 6px'}}
                                >
                                  <FaTrash size={12} />
                                </button>
                              </Col>
                            </Row>
                          </Card.Header>
                          <Card.Body className="p-0">
                            <div className="table-responsive">
                              <table className="table table-sm mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th style={{width: '80%', padding: '8px 12px', fontSize: '12px'}}>Item Name</th>
                                    <th style={{width: '20%', padding: '8px 12px', fontSize: '12px', textAlign: 'center'}}>Quantity</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bundle.items.map((item) => (
                                    <tr key={item._id}>
                                      <td style={{padding: '8px 12px', fontSize: '13px'}}>
                                        {bundle.giftBoxInfo ? bundle.giftBoxInfo.giftBoxName : (bundle.bundleInfo ? bundle.bundleInfo.bundleName : (item.product?.name || 'Bundle Item'))}
                                      </td>
                                      <td style={{padding: '8px 12px', fontSize: '13px', textAlign: 'center'}}>{item.quantity}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                      
                      {/* Individual Items */}
                      {individualItems.map((item) => (
                        <Card key={item._id} className="cart-item-card mb-3">
                          <Card.Body className="p-3">
                            <Row className="align-items-center">
                              <Col xs={2}>
                                {item.product?.images?.[0] ? (
                                  <img
                                    src={getImageUrl(item.product.images[0].url)}
                                    alt={item.product?.name}
                                    style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}}
                                  />
                                ) : (
                                  <div style={{width: '80px', height: '80px', backgroundColor: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'}}>
                                    No Image
                                  </div>
                                )}
                              </Col>
                              <Col xs={4}>
                                <h6 className="mb-1">
                                  <Link 
                                    to={`/products/${item.product?._id}`}
                                    className="text-decoration-none text-dark"
                                  >
                                    {item.product?.name || 'Unknown Product'}
                                  </Link>
                                </h6>
                                <div className="text-muted">
                                  <strong>{formatCurrency(item.product?.price || 0)}</strong> each
                                </div>
                              </Col>
                              <Col xs={3}>
                                <div className="d-flex align-items-center">
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || updating}
                                    style={{width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                  >
                                    <FaMinus size={12} />
                                  </button>
                                  <input
                                    type="number"
                                    className="form-control mx-2 text-center"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseInt(e.target.value);
                                      if (newQuantity > 0) {
                                        handleUpdateQuantity(item._id, newQuantity);
                                      }
                                    }}
                                    min="1"
                                    max={item.product?.stock || 999}
                                    disabled={updating}
                                    style={{width: '60px'}}
                                  />
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                    disabled={item.quantity >= (item.product?.stock || 999) || updating}
                                    style={{width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                  >
                                    <FaPlus size={12} />
                                  </button>
                                </div>
                              </Col>
                              <Col xs={2}>
                                <div className="text-center">
                                  <strong>{formatCurrency(calculateItemTotal(item.product?.price || 0, item.quantity))}</strong>
                                </div>
                              </Col>
                              <Col xs={1}>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleRemoveItem(item._id)}
                                  disabled={updating}
                                  title="Remove item"
                                >
                                  <FaTrash />
                                </button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </>
                  );
                })()}
              </div>
              
              {/* Mobile Card Layout */}
              <div className="d-lg-none">
                {(() => {
                  // Group items by bundle for mobile
                  const bundleGroups = {};
                  const individualItems = [];
                  
                  cartItems.forEach(item => {
                    if (item.bundleInfo?.bundleId) {
                      const bundleId = item.bundleInfo.bundleId;
                      if (!bundleGroups[bundleId]) {
                        bundleGroups[bundleId] = {
                          bundleInfo: item.bundleInfo,
                          items: []
                        };
                      }
                      bundleGroups[bundleId].items.push(item);
                    } else if (item.giftBoxInfo?.giftBoxId) {
                      const giftBoxId = item.giftBoxInfo.giftBoxId;
                      if (!bundleGroups[giftBoxId]) {
                        bundleGroups[giftBoxId] = {
                          giftBoxInfo: item.giftBoxInfo,
                          items: []
                        };
                      }
                      bundleGroups[giftBoxId].items.push(item);
                    } else {
                      individualItems.push(item);
                    }
                  });
                  
                  return (
                    <>
                      {/* Bundle Groups Mobile */}
                      {Object.values(bundleGroups).map((bundle, index) => (
                        <Card key={`bundle-mobile-${index}`} className="cart-item-card mb-3">
                          <Card.Header className="bg-primary text-white p-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0 small">
                                  {bundle.bundleInfo ? `📦 Bundle` : `🎁 Gift Boxes`}
                                </h6>
                              </div>
                              <div className="text-end">
                                <strong>{formatCurrency(((bundle.bundleInfo?.bundlePrice || bundle.giftBoxInfo?.giftBoxPrice) || 0) * (bundle.items[0]?.quantity || 1))}</strong>
                              </div>
                            </div>
                          </Card.Header>
                          <Card.Body className="p-2">
                            <div className="table-responsive">
                              <table className="table table-sm mb-2">
                                <tbody>
                                  {bundle.items.map((item) => (
                                    <tr key={item._id}>
                                      <td style={{padding: '4px 8px', fontSize: '12px', border: 'none'}}>
                                        {bundle.giftBoxInfo ? bundle.giftBoxInfo.giftBoxName : (bundle.bundleInfo ? bundle.bundleInfo.bundleName : (item.product?.name || 'Bundle Item'))}
                                      </td>
                                      <td style={{padding: '4px 8px', fontSize: '12px', textAlign: 'center', border: 'none'}}>
                                        <span className="badge bg-secondary">{item.quantity}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="d-flex justify-content-center align-items-center mb-2">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleUpdateBundleQuantity(bundle.items[0]._id, (bundle.items[0]?.quantity || 1) - 1, bundle.bundleInfo ? 'bundle' : 'giftbox')}
                                disabled={(bundle.items[0]?.quantity || 1) <= 1 || updating}
                                style={{width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                              >
                                <FaMinus size={10} />
                              </button>
                              <span className="mx-2" style={{minWidth: '30px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold'}}>{bundle.items[0]?.quantity || 1}</span>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleUpdateBundleQuantity(bundle.items[0]._id, (bundle.items[0]?.quantity || 1) + 1, bundle.bundleInfo ? 'bundle' : 'giftbox')}
                                disabled={updating}
                                style={{width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                              >
                                <FaPlus size={10} />
                              </button>
                            </div>
                            <div className="text-center">
                              <button
                                className="btn btn-outline-danger btn-sm w-100"
                                onClick={() => handleRemoveItem(bundle.items[0]._id)}
                                disabled={updating}
                                style={{fontSize: '12px'}}
                              >
                                {bundle.bundleInfo ? 'Remove Bundle' : 'Remove Gift Box'}
                              </button>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                      
                      {/* Individual Items Mobile */}
                      <Row>
                        {individualItems.map((item) => (
                          <Col lg={6} md={6} xs={6} key={item._id} className="mb-4">
                            <Card className="cart-item-card h-100">
                              <div className="cart-product-image-container">
                                {item.product?.images?.[0] ? (
                                  <img
                                    src={getImageUrl(item.product.images[0].url)}
                                    alt={item.product?.name}
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
                                    onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || updating}
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
                                        handleUpdateQuantity(item._id, newQuantity);
                                      }
                                    }}
                                    min="1"
                                    max={item.product?.stock || 999}
                                    disabled={updating}
                                  />
                                  <button
                                    className="quantity-btn mobile-btn-small"
                                    onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                    disabled={item.quantity >= (item.product?.stock || 999) || updating}
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
                                        onClick={() => handleRemoveItem(item._id)}
                                        disabled={updating}
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
                    </>
                  );
                })()}
              </div>
              
             
            </Col>
            
            {/* Order Summary */}
            <Col lg={4} md={12}>
              <div className="order-summary-card slide-in-right" style={{marginTop: '140px'}}>
                <h4 className="order-summary-title">Order Summary</h4>
                
                {/* Product Details Table */}
                <div className="table-responsive mb-3">
                  <table className="table table-sm" style={{fontSize: '12px'}}>
                    <thead>
                      <tr>
                        <th style={{padding: '8px 4px', border: 'none', fontWeight: '600'}}>Product</th>
                        <th style={{padding: '8px 4px', border: 'none', fontWeight: '600', textAlign: 'center'}}>Price</th>
                        <th style={{padding: '8px 4px', border: 'none', fontWeight: '600', textAlign: 'center'}}>Qty</th>
                        <th style={{padding: '8px 4px', border: 'none', fontWeight: '600', textAlign: 'right'}}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, index) => {
                        if (item.bundleInfo?.bundleId) {
                          const totalAmount = item.bundleInfo.bundlePrice * item.quantity;
                          return (
                            <tr key={`bundle-${index}`}>
                              <td style={{padding: '6px 4px', border: 'none'}}>{item.bundleInfo.bundleName}</td>
                              <td style={{padding: '6px 4px', border: 'none', textAlign: 'center'}}>{formatCurrency(item.bundleInfo.bundlePrice)}</td>
                              <td style={{padding: '6px 4px', border: 'none', textAlign: 'center'}}>{item.quantity}</td>
                              <td style={{padding: '6px 4px', border: 'none', textAlign: 'right', fontWeight: '600'}}>{formatCurrency(totalAmount)}</td>
                            </tr>
                          );
                        } else if (item.giftBoxInfo?.giftBoxId) {
                          const totalAmount = item.giftBoxInfo.giftBoxPrice * item.quantity;
                          return (
                            <tr key={`giftbox-${index}`}>
                              <td style={{padding: '6px 4px', border: 'none'}}>{item.giftBoxInfo.giftBoxName}</td>
                              <td style={{padding: '6px 4px', border: 'none', textAlign: 'center'}}>{formatCurrency(item.giftBoxInfo.giftBoxPrice)}</td>
                              <td style={{padding: '6px 4px', border: 'none', textAlign: 'center'}}>{item.quantity}</td>
                              <td style={{padding: '6px 4px', border: 'none', textAlign: 'right', fontWeight: '600'}}>{formatCurrency(totalAmount)}</td>
                            </tr>
                          );
                        } else {
                          const totalAmount = (item.product?.price || 0) * item.quantity;
                          return (
                            <tr key={`product-${index}`}>
                              <td style={{padding: '6px 4px', border: 'none'}}>{item.product?.name || 'Product'}</td>
                              <td style={{padding: '6px 4px', border: 'none', textAlign: 'center'}}>{formatCurrency(item.product?.price || 0)}</td>
                              <td style={{padding: '6px 4px', border: 'none', textAlign: 'center'}}>{item.quantity}</td>
                              <td style={{padding: '6px 4px', border: 'none', textAlign: 'right', fontWeight: '600'}}>{formatCurrency(totalAmount)}</td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="summary-row total-row">
                  <span className="summary-label">Total:</span>
                  <span className="summary-value">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                
                {/* Complimentary Gifts Notice */}
                {cartTotal >= 3000 && (
                  <div className="complimentary-gifts-notice" style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '10px',
                    borderRadius: '5px',
                    marginTop: '10px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    🎁 Congratulations! You get complimentary gifts with this order!
                  </div>
                )}
                
                {cartTotal < 3000 && (
                  <div className="complimentary-gifts-notice" style={{
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    padding: '10px',
                    borderRadius: '5px',
                    marginTop: '10px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    🎁 Purchase above ₹3000 and get complimentary gifts!
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

