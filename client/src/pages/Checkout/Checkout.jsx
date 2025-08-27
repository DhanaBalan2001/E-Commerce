import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { cartService, orderService, authService } from '../../services';
import { getImageUrl } from '../../utils/imageUrl';
import './checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppContext();

  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    phoneNumber: ''
  });
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadCheckoutData();
    autoFillFromContext();
  }, [isAuthenticated, navigate, location.state, user]);

  const autoFillFromContext = () => {
    if (user?.phoneNumber) {
      setShippingAddress(prev => ({
        ...prev,
        phoneNumber: user.phoneNumber
      }));
    }
  };

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to get data from navigation state first
      if (location.state?.fromCart && location.state?.cartItems) {
        setCartItems(location.state.cartItems);
        setCartTotal(location.state.cartTotal);
        setLoading(false);
        return;
      }

      // Try to get data from localStorage backup
      const checkoutData = localStorage.getItem('checkoutData');
      if (checkoutData) {
        const parsedData = JSON.parse(checkoutData);
        const isRecent = Date.now() - parsedData.timestamp < 5 * 60 * 1000; // 5 minutes
        
        if (isRecent && parsedData.cartItems?.length > 0) {
          setCartItems(parsedData.cartItems);
          setCartTotal(parsedData.cartTotal);
          setLoading(false);
          return;
        }
      }

      // Fallback: Fetch fresh cart data from server
      const response = await cartService.getCart();
      
      if (response.cart && response.cart.length > 0) {
        setCartItems(response.cart);
        setCartTotal(response.cartTotal || 0);
      } else {
        navigate('/cart');
        return;
      }

    } catch (err) {
      setError('Failed to load checkout data. Redirecting to cart...');
      setTimeout(() => navigate('/cart'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const calculateTotals = () => {
    const subtotal = cartTotal;
    const tax = 0;
    const shipping = 0;
    const total = subtotal;
    
    return { subtotal, tax, shipping, total };
  };

  const validateAddress = () => {
    const { street, city, state, pincode, phoneNumber } = shippingAddress;
    
    if (!street.trim()) {
      setError('Please enter your street address');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!city.trim()) {
      setError('Please enter your city');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!state.trim()) {
      setError('Please enter your state');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!pincode.trim() || !/^[1-9][0-9]{5}$/.test(pincode)) {
      setError('Please enter a valid 6-digit pincode');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!phoneNumber.trim() || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    
    return true;
  };

  const handlePayNow = async () => {
    try {
      setError('');
      setPlacingOrder(true);

      if (!validateAddress()) {
        setPlacingOrder(false);
        return;
      }

      const { subtotal, tax, shipping, total } = calculateTotals();
      
      const orderData = {
        items: cartItems.map(item => {
          if (item.bundleInfo?.bundleId) {
            return {
              bundleId: item.bundleInfo.bundleId,
              quantity: item.quantity,
              type: 'bundle'
            };
          } else if (item.giftBoxInfo?.giftBoxId) {
            return {
              giftBoxId: item.giftBoxInfo.giftBoxId,
              quantity: item.quantity,
              type: 'giftbox'
            };
          } else {
            return {
              product: item.product._id,
              quantity: item.quantity,
              type: 'product'
            };
          }
        }),
        shippingAddress,
        paymentMethod: 'bank_transfer'
      };

      // Navigate to bank details page
      navigate('/bank-details', {
        state: {
          orderData,
          orderTotal: total
        }
      });

    } catch (err) {
      setError(err.message || 'Failed to proceed. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" size="lg">
          <span className="visually-hidden">Loading checkout...</span>
        </Spinner>
        <p className="mt-3">Loading checkout...</p>
      </Container>
    );
  }

  if (error && !cartItems.length) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/cart')}>
            Go Back to Cart
          </Button>
        </Alert>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          <h4>No Items to Checkout</h4>
          <p>Your cart appears to be empty.</p>
          <Button variant="primary" onClick={() => navigate('/cart')}>
            Go to Cart
          </Button>
        </Alert>
      </Container>
    );
  }

  const { subtotal, tax, shipping, total } = calculateTotals();

  return (
    <div className="checkout-page">
      <Container className="py-4">
        <div className="checkout-header mb-4">
          <h2>Checkout</h2>
          <p className="text-muted">Review your order and complete your purchase</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Row>
          {/* Checkout Form */}
          <Col lg={8} className="mb-4">
            {/* Delivery Address Section */}
            <Card className="checkout-section mb-4">
              <Card.Header>
                <h5 className="mb-0">1. Delivery Address</h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row>
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Street Address *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter your full address"
                          value={shippingAddress.street}
                          onChange={(e) => handleAddressChange('street', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>City *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter city"
                          value={shippingAddress.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>State *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter state"
                          value={shippingAddress.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Pincode *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="6-digit pincode"
                          value={shippingAddress.pincode}
                          onChange={(e) => handleAddressChange('pincode', e.target.value)}
                          maxLength="6"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Phone Number *</Form.Label>
                        <Form.Control
                          type="tel"
                          placeholder="10-digit phone number"
                          value={shippingAddress.phoneNumber}
                          onChange={(e) => handleAddressChange('phoneNumber', e.target.value)}
                          maxLength="10"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Landmark (Optional)</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Nearby landmark"
                          value={shippingAddress.landmark}
                          onChange={(e) => handleAddressChange('landmark', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>



            {/* Order Items Review */}
            <Card className="checkout-section mb-4">
              <Card.Header>
                <h5 className="mb-0">2. Order Items ({cartItems.length} items)</h5>
              </Card.Header>
              <Card.Body>
                <div className="order-items">
                  {cartItems.map((item, index) => {
                    // Handle different item types
                    let itemName, itemPrice, itemTotal, itemImage;
                    
                    if (item.bundleInfo?.bundleId) {
                      itemName = item.bundleInfo.bundleName;
                      itemPrice = item.bundleInfo.bundlePrice;
                      itemTotal = item.bundleInfo.bundlePrice * item.quantity;
                      itemImage = null; // Bundles don't have images
                    } else if (item.giftBoxInfo?.giftBoxId) {
                      itemName = item.giftBoxInfo.giftBoxName;
                      itemPrice = item.giftBoxInfo.giftBoxPrice;
                      itemTotal = item.giftBoxInfo.giftBoxPrice * item.quantity;
                      itemImage = null; // Gift boxes don't have images
                    } else {
                      itemName = item.product?.name || 'Unknown Product';
                      itemPrice = item.product?.price || 0;
                      itemTotal = (item.product?.price || 0) * item.quantity;
                      itemImage = item.product?.images?.[0];
                    }
                    
                    return (
                      <div key={item._id || index} className="order-item mb-3">
                        <Row className="align-items-center">
                          <Col xs={3} md={2}>
                            <div className="item-image">
                              {itemImage ? (
                                <img
                                  src={getImageUrl(itemImage.url)}
                                  alt={itemName}
                                  className="checkout-item-image"
                                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                                  onError={(e) => {
                                    e.target.src = '/placeholder-image.svg';
                                  }}
                                />
                              ) : (
                                <div className="no-image-placeholder-small" style={{ width: '60px', height: '60px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '24px' }}>
                                  {item.bundleInfo ? '📦' : item.giftBoxInfo ? '🎁' : 'No Image'}
                                </div>
                              )}
                            </div>
                          </Col>
                          <Col xs={5} md={6}>
                            <div className="item-details">
                              <h6 className="item-name mb-1">{itemName}</h6>
                              <p className="item-price mb-0 text-muted">₹{itemPrice} each</p>
                              <small className="text-muted d-block d-md-none">Qty: {item.quantity}</small>
                            </div>
                          </Col>
                          <Col xs={2} className="text-center d-none d-md-block">
                            <span className="item-quantity">Qty: {item.quantity}</span>
                          </Col>
                          <Col xs={4} md={2} className="text-end">
                            <strong>₹{itemTotal.toFixed(2)}</strong>
                          </Col>
                        </Row>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Order Summary */}
          <Col lg={4}>
            <Card className="order-summary-card sticky-top">
              <Card.Header>
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <Card.Body>
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
                
                <div className="summary-row total-row" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                  <span className="summary-label"><strong>Total:</strong></span>
                  <span className="summary-value"><strong>{formatCurrency(total)}</strong></span>
                </div>
                
                {/* Complimentary Gifts Notice */}
                {cartTotal >= 3000 && (
                  <div className="complimentary-gifts-notice" style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px',
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
                    marginBottom: '15px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    🎁 Purchase above ₹3000 and get complimentary gifts!
                  </div>
                )}
              </Card.Body>
              <Card.Footer>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  onClick={handlePayNow}
                  disabled={placingOrder}
                >
                  {placingOrder ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Processing...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={() => navigate('/cart')}
                  disabled={placingOrder}
                >
                  Back to Cart
                </Button>
                <div className="order-info mt-3">
                  <small className="text-muted">
                    By placing your order, you agree to our Terms & Conditions
                  </small>
                </div>
              </Card.Footer>
            </Card>

           
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Checkout;

