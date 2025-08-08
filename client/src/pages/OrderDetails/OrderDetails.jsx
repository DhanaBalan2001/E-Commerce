import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBox, FaTruck, FaCheckCircle } from 'react-icons/fa';
import { orderService } from '../../services';
import './orderdetails.css';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(orderId);
      console.log('Full Order Response:', response); // Debug log
      console.log('Order Data:', response.order); // Debug log
      console.log('Order Address Fields:', {
        deliveryAddress: response.order?.deliveryAddress,
        shippingAddress: response.order?.shippingAddress,
        address: response.order?.address,
        shipping: response.order?.shipping,
        user: response.order?.user
      }); // Debug log
      setOrder(response.order);
    } catch (error) {
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'confirmed': 'info',
      'processing': 'primary',
      'shipped': 'secondary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  // Enhanced helper function to get delivery address from different possible structures
  const getDeliveryAddress = (order) => {
    console.log('Getting delivery address from order:', order); // Debug log
    
    // Check all possible address locations
    const possibleAddresses = [
      order?.deliveryAddress,
      order?.shippingAddress,
      order?.address,
      order?.shipping?.address,
      order?.customerInfo?.address,
      order?.billing?.address,
      order?.user?.address
    ];

    // Find the first non-null address
    const address = possibleAddresses.find(addr => addr && typeof addr === 'object');
    
    console.log('Found address:', address); // Debug log
    return address;
  };

  // Helper function to get customer name
  const getCustomerName = (order) => {
    const address = getDeliveryAddress(order);
    
    // Try to get name from various sources
    const possibleNames = [
      address?.fullName,
      address?.name,
      `${address?.firstName || ''} ${address?.lastName || ''}`.trim(),
      order?.user?.name,
      order?.customerInfo?.name,
      order?.billing?.name,
      order?.customer?.name
    ];

    const name = possibleNames.find(n => n && n.trim() !== '');
    console.log('Found customer name:', name); // Debug log
    return name || 'Name not provided';
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading order details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/orders')}>
          <FaArrowLeft className="me-2" />
          Back to Orders
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Order not found</Alert>
        <Button variant="primary" onClick={() => navigate('/orders')}>
          <FaArrowLeft className="me-2" />
          Back to Orders
        </Button>
      </Container>
    );
  }

  const deliveryAddress = getDeliveryAddress(order);
  const customerName = getCustomerName(order);

  return (
    <div className="order-details-page">
      <Container className="py-4">
        {/* Header */}
        <div className="order-details-header mb-4">
          <Button 
            variant="outline-primary" 
            onClick={() => navigate('/orders')}
            className="mb-3"
          >
            <FaArrowLeft className="me-2" />
            Back to Orders
          </Button>
          
          <Row className="align-items-center">
            <Col>
              <h2>Order Details</h2>
              <p className="text-muted mb-0">
                Order #{order.orderNumber || order._id?.slice(-8) || 'N/A'}
              </p>
            </Col>
            <Col xs="auto">
              <Badge bg={getStatusColor(order.status)} className="status-badge">
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
              </Badge>
            </Col>
          </Row>
        </div>

        <Row>
          {/* Order Information */}
          <Col lg={8} className="mb-4">
            {/* Order Items */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <FaBox className="me-2" />
                  Order Items ({order.items?.length || 0})
                </h5>
              </Card.Header>
              <Card.Body>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <Row className="align-items-center">
                        <Col md={2}>
                          {item.product?.images?.[0] ? (
                            <img
                              src={item.product.images[0].data || item.product.images[0]}
                              alt={item.product.name}
                              className="item-image"
                              onError={(e) => {
                                e.target.src = '/images/placeholder-product.jpg';
                              }}
                            />
                          ) : (
                            <div className="no-image-placeholder">
                              No Image
                            </div>
                          )}
                        </Col>
                        <Col md={6}>
                          <h6>{item.product?.name || item.name || 'Product Name'}</h6>
                          <p className="text-muted mb-0">
                            Price: {formatPrice(item.price || 0)}
                          </p>
                        </Col>
                        <Col md={2} className="text-center">
                          <span className="quantity">Qty: {item.quantity || 1}</span>
                        </Col>
                        <Col md={2} className="text-end">
                          <strong>{formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
                        </Col>
                      </Row>
                      {index < order.items.length - 1 && <hr />}
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No items found in this order.</p>
                )}
              </Card.Body>
            </Card>

            {/* Delivery Address */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <FaMapMarkerAlt className="me-2" />
                  Delivery Address
                </h5>
              </Card.Header>
              <Card.Body>
                {deliveryAddress ? (
                  <>
                    <address>
                      <strong>{customerName}</strong><br />
                      
                      {/* Street Address */}
                      {(deliveryAddress.street || deliveryAddress.addressLine1 || deliveryAddress.line1 || deliveryAddress.address1) && (
                        <>
                          {deliveryAddress.street || deliveryAddress.addressLine1 || deliveryAddress.line1 || deliveryAddress.address1}<br />
                        </>
                      )}
                      
                      {/* Address Line 2 */}
                      {(deliveryAddress.addressLine2 || deliveryAddress.line2 || deliveryAddress.address2) && (
                        <>
                          {deliveryAddress.addressLine2 || deliveryAddress.line2 || deliveryAddress.address2}<br />
                        </>
                      )}
                      
                      {/* City, State, Postal Code */}
                      {(deliveryAddress.city || deliveryAddress.state || deliveryAddress.zipCode || deliveryAddress.postalCode || deliveryAddress.pincode) && (
                        <>
                          {deliveryAddress.city && `${deliveryAddress.city}`}
                          {deliveryAddress.city && (deliveryAddress.state || deliveryAddress.zipCode || deliveryAddress.postalCode || deliveryAddress.pincode) && ', '}
                          {deliveryAddress.state && `${deliveryAddress.state} `}
                          {(deliveryAddress.zipCode || deliveryAddress.postalCode || deliveryAddress.pincode) && `${deliveryAddress.zipCode || deliveryAddress.postalCode || deliveryAddress.pincode}`}
                          <br />
                        </>
                      )}
                      
                      {/* Country */}
                      {deliveryAddress.country && (
                        <>
                          {deliveryAddress.country}
                        </>
                      )}
                    </address>
                    
                    {/* Phone */}
                    {(deliveryAddress.phone || deliveryAddress.phoneNumber || order.user?.phoneNumber) && (
                      <p className="mb-1">
                        <FaPhone className="me-2" />
                        {deliveryAddress.phone || deliveryAddress.phoneNumber || order.user?.phoneNumber}
                      </p>
                    )}
                    
                    {/* Email */}
                    {(deliveryAddress.email || order.user?.email) && (
                      <p className="mb-0">
                        <FaEnvelope className="me-2" />
                        {deliveryAddress.email || order.user?.email}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-muted">
                    <p><strong>Customer:</strong> {customerName}</p>
                    <p>No delivery address information available.</p>
                    <small>This might be a pickup order or the address data is missing from the order.</small>
                    
                    {/* Show user email if available */}
                    {order.user?.email && (
                      <p className="mt-2">
                        <FaEnvelope className="me-2" />
                        {order.user.email}
                      </p>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Order Timeline */}
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <FaTruck className="me-2" />
                  Order Timeline
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="order-timeline">
                  <div className="timeline-item active">
                    <div className="timeline-icon">
                      <FaCheckCircle />
                    </div>
                    <div className="timeline-content">
                      <h6>Order Placed</h6>
                      <p className="text-muted">
                        {order.createdAt ? formatDate(order.createdAt) : 'Date not available'}
                      </p>
                    </div>
                  </div>
                  
                  {order.status && order.status !== 'pending' && (
                    <div className="timeline-item active">
                      <div className="timeline-icon">
                        <FaCheckCircle />
                      </div>
                      <div className="timeline-content">
                        <h6>Order Confirmed</h6>
                        <p className="text-muted">
                          {order.updatedAt ? formatDate(order.updatedAt) : 'Date not available'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {order.status && ['processing', 'shipped', 'delivered'].includes(order.status) && (
                    <div className="timeline-item active">
                      <div className="timeline-icon">
                        <FaCheckCircle />
                      </div>
                      <div className="timeline-content">
                        <h6>Processing</h6>
                        <p className="text-muted">Your order is being prepared</p>
                      </div>
                    </div>
                  )}
                  
                  {order.status && ['shipped', 'delivered'].includes(order.status) && (
                    <div className="timeline-item active">
                      <div className="timeline-icon">
                        <FaCheckCircle />
                      </div>
                      <div className="timeline-content">
                        <h6>Shipped</h6>
                        <p className="text-muted">Your order is on the way</p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'delivered' && (
                    <div className="timeline-item active">
                      <div className="timeline-icon">
                        <FaCheckCircle />
                      </div>
                      <div className="timeline-content">
                        <h6>Delivered</h6>
                        <p className="text-muted">Order delivered successfully</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Order Summary */}
          <Col lg={4}>
            <Card className="order-summary-card">
              <Card.Header>
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <Card.Body>
                                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.subtotal || order.total || 0)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>{formatPrice(order.shippingCost || order.shipping || 0)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>{formatPrice(order.tax || 0)}</span>
                </div>
                <hr />
                <div className="summary-row total-row">
                  <strong>Total:</strong>
                  <strong>{formatPrice(order.total || order.totalAmount || 0)}</strong>
                </div>
                
                <div className="mt-3">
                  <small className="text-muted">
                    <FaCalendar className="me-1" />
                    Ordered on {order.createdAt ? formatDate(order.createdAt) : 'Date not available'}
                  </small>
                </div>
                
                <div className="mt-2">
                  <small className="text-muted">
                    Payment Method: {order.paymentMethod || order.payment?.method || 'Cash on Delivery'}
                  </small>
                </div>
                
                {order.trackingNumber && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Tracking: {order.trackingNumber}
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OrderDetails;

