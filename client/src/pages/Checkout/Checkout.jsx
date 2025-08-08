import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { cartService, orderService } from '../../services';
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

  useEffect(() => {
    console.log('🛒 Checkout component mounted');
    console.log('📍 Location state:', location.state);
    console.log('🔐 Is authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    loadCheckoutData();
  }, [isAuthenticated, navigate, location.state]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to get data from navigation state first
      if (location.state?.fromCart && location.state?.cartItems) {
        console.log('✅ Using cart data from navigation state');
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
          console.log('✅ Using cart data from localStorage backup');
          setCartItems(parsedData.cartItems);
          setCartTotal(parsedData.cartTotal);
          setLoading(false);
          return;
        }
      }

      // Fallback: Fetch fresh cart data from server
      console.log('🔄 Fetching fresh cart data from server');
      const response = await cartService.getCart();
      
      if (response.cart && response.cart.length > 0) {
        console.log('✅ Fresh cart data loaded');
        setCartItems(response.cart);
        setCartTotal(response.cartTotal || 0);
      } else {
        console.log('❌ No cart items found, redirecting to cart');
        navigate('/cart');
        return;
      }

    } catch (err) {
      console.error('❌ Error loading checkout data:', err);
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
    const tax = subtotal * 0.18;
    const shipping = subtotal >= 500 ? 0 : 50;
    const total = subtotal + tax + shipping;
    
    return { subtotal, tax, shipping, total };
  };

  const validateAddress = () => {
    const { street, city, state, pincode, phoneNumber } = shippingAddress;
    
    if (!street.trim()) {
      setError('Please enter your street address');
      return false;
    }
    if (!city.trim()) {
      setError('Please enter your city');
      return false;
    }
    if (!state.trim()) {
      setError('Please enter your state');
      return false;
    }
    if (!pincode.trim() || !/^[1-9][0-9]{5}$/.test(pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }
    if (!phoneNumber.trim() || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    return true;
  };

  const handlePayOnline = async () => {
    try {
      setError('');
      setPlacingOrder(true);

      console.log('🚀 Starting online payment process');

      // Validate address
      if (!validateAddress()) {
        setPlacingOrder(false);
        return;
      }

      const { total } = calculateTotals();

      // Initialize Razorpay
      const options = {
        key: 'rzp_test_9WseLWo2O8lk0C', // Replace with your Razorpay key
        amount: Math.round(total * 100), // Amount in paise
        currency: 'INR',
        name: 'Crackers Store',
        description: 'Order Payment',
        image: '/logo.png',
        handler: async function (response) {
          console.log('✅ Payment successful:', response);
          
          // Prepare order data
          const orderData = {
            items: cartItems.map(item => ({
              product: item.product._id,
              quantity: item.quantity
            })),
            shippingAddress,
            paymentMethod: 'online',
            paymentId: response.razorpay_payment_id
          };

          try {
            // Create order after successful payment
            const orderResponse = await orderService.createOrder(orderData);
            
            // Clear checkout data
            localStorage.removeItem('checkoutData');
            
            // Show success message
            alert('🎉 Payment successful! Order placed successfully!');
            
            // Redirect to orders page
            navigate('/orders', { 
              state: { 
                orderPlaced: true, 
                orderNumber: orderResponse.order?.orderNumber 
              } 
            });
          } catch (err) {
            console.error('❌ Error creating order after payment:', err);
            setError('Payment successful but failed to create order. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: shippingAddress.phoneNumber || ''
        },
        theme: {
          color: '#ff6b35'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('❌ Error initiating payment:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
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
                  {cartItems.map((item, index) => (
                    <div key={item._id || index} className="order-item mb-3">
                      <Row className="align-items-center">
                        <Col xs={3} md={2}>
                          <div className="item-image">
                            {item.product?.images?.[0] ? (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL}${item.product.images[0].url}`}
                                alt={item.product.name}
                                className="checkout-item-image"
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.svg';
                                }}
                              />
                            ) : (
                              <div className="no-image-placeholder-small" style={{ width: '60px', height: '60px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '10px' }}>
                                No Image
                              </div>
                            )}
                          </div>
                        </Col>
                        <Col xs={5} md={6}>
                          <div className="item-details">
                            <h6 className="item-name mb-1">{item.product?.name || 'Unknown Product'}</h6>
                            <p className="item-price mb-0 text-muted">₹{item.product?.price || 0} each</p>
                            <small className="text-muted d-block d-md-none">Qty: {item.quantity}</small>
                          </div>
                        </Col>
                        <Col xs={2} className="text-center d-none d-md-block">
                          <span className="item-quantity">Qty: {item.quantity}</span>
                        </Col>
                        <Col xs={4} md={2} className="text-end">
                          <strong>₹{((item.product?.price || 0) * item.quantity).toFixed(2)}</strong>
                        </Col>
                      </Row>
                    </div>
                  ))}
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
                <div className="summary-row d-flex justify-content-between mb-2">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="summary-row d-flex justify-content-between mb-2">
                  <span>Tax (18% GST)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                                <div className="summary-row d-flex justify-content-between mb-2">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-success">FREE</span>
                    ) : (
                      formatCurrency(shipping)
                    )}
                  </span>
                </div>
                <hr />
                <div className="summary-row d-flex justify-content-between mb-3">
                  <strong>Total Amount</strong>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              </Card.Body>
              <Card.Footer>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  onClick={handlePayOnline}
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
                    'Pay Online'
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

