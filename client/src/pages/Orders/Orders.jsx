import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal, Form, ListGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaShoppingBag, 
  FaEye,
  FaCalendarAlt,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaBox,
  FaReceipt,
  FaRedo,
  FaBan,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import { orderService } from '../../services';
import ConfirmModal from '../../components/common/ConfirmModal';
import './orders.css';

const Orders = () => {
 
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const { isAuthenticated, user } = useAppContext();
  const navigate = useNavigate();

 
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    loadOrders();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // TEMPORARY SAMPLE DATA - REMOVE AFTER TESTING
      const sampleOrders = [
        {
          _id: '1',
          orderNumber: 'ORD001',
          status: 'delivered',
          createdAt: new Date('2024-01-15').toISOString(),
          items: [
            {
              product: { name: 'Sparklers Pack', images: [{ url: '/images/sparklers.jpg' }] },
              quantity: 2,
              price: 150
            },
            {
              product: { name: 'Rocket Set', images: [{ url: '/images/rockets.jpg' }] },
              quantity: 1,
              price: 300
            }
          ],
          shippingAddress: {
            name: 'John Doe',
            street: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            phone: '+91 9876543210'
          },
          shippingCost: 50,
          taxAmount: 90,
          paymentMethod: 'Online Payment',
          paymentStatus: 'paid'
        },
        {
          _id: '2',
          orderNumber: 'ORD002',
          status: 'processing',
          createdAt: new Date('2024-01-20').toISOString(),
          items: [
            {
              product: { name: 'Flower Pots', images: [{ url: '/images/flowerpots.jpg' }] },
              quantity: 3,
              price: 200
            }
          ],
          shippingAddress: {
            name: 'Jane Smith',
            street: '456 Park Avenue',
            city: 'Delhi',
            state: 'Delhi',
            zipCode: '110001',
            phone: '+91 9876543211'
          },
          shippingCost: 0,
          taxAmount: 108,
          paymentMethod: 'Cash on Delivery',
          paymentStatus: 'pending'
        },
        {
          _id: '3',
          orderNumber: 'ORD003',
          status: 'pending',
          createdAt: new Date().toISOString(),
          items: [
            {
              product: { name: 'Aerial Shots', images: [{ url: '/images/aerial.jpg' }] },
              quantity: 1,
              price: 500
            }
          ],
          shippingAddress: {
            name: 'Mike Johnson',
            street: '789 Oak Street',
            city: 'Bangalore',
            state: 'Karnataka',
            zipCode: '560001',
            phone: '+91 9876543212'
          },
          shippingCost: 75,
          taxAmount: 90,
          paymentMethod: 'Online Payment',
          paymentStatus: 'pending'
        }
      ];
      
      // Use sample data instead of API call
      setOrders(sampleOrders);
      
      // Uncomment below for real API call
      // const response = await orderService.getUserOrders();
      // setOrders(response.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  
  const handleCancelOrderClick = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const handleCancelOrderConfirm = async () => {
    try {
      setActionLoading(true);
      // MOCK: Update order status to cancelled
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderToCancel ? { ...order, status: 'cancelled' } : order
        )
      );
      setShowOrderModal(false);
      setError('');
    } catch (error) {
      console.error('Error canceling order:', error);
      setError(error.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
      setShowCancelModal(false);
      setOrderToCancel(null);
    }
  };

 
  const handleReorder = async (orderId) => {
    try {
      setActionLoading(true);
      // MOCK: Simulate adding items to cart
      const order = orders.find(o => o._id === orderId);
      if (order) {
        console.log('Reordering items:', order.items);
        // In real implementation, add items to cart via API
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      setError(error.message || 'Failed to reorder items');
    } finally {
      setActionLoading(false);
    }
  };


  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => 
          item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { variant: 'warning', icon: FaClock },
      'confirmed': { variant: 'info', icon: FaCheckCircle },
      'processing': { variant: 'primary', icon: FaBox },
      'shipped': { variant: 'secondary', icon: FaTruck },
      'delivered': { variant: 'success', icon: FaCheckCircle },
      'cancelled': { variant: 'danger', icon: FaTimesCircle }
    };
    return statusMap[status] || { variant: 'secondary', icon: FaClock };
  };

 
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };


  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };


  const calculateOrderTotal = (order) => {
    const subtotal = order.items?.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0) || 0;
    const shipping = order.shippingCost || 0;
    const tax = order.taxAmount || 0;
    return subtotal + shipping + tax;
  };

  
  const showOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };


  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

 
  return (
    <div className="orders-page">
      {/* Page Header */}
      <div className="orders-header">
        <Container>
          <div className="orders-header-content">
            <h1 className="orders-page-title">
              <FaShoppingBag className="me-3" />
              My Orders
            </h1>
            <p className="orders-page-subtitle">
              Track and manage your order history
            </p>
            <div className="orders-breadcrumb justify-content-center">
              <Link to="/" className="breadcrumb-link">Home</Link>
              <span className="breadcrumb-separator">›</span>
              <Link to="/profile" className="breadcrumb-link">Account</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Orders</span>
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

        {/* Filters and Search */}
        <Row className="mb-4">
          <Col lg={8} md={6} sm={12}>
            <div className="search-container">
              <Form.Control
                type="text"
                placeholder="Search orders by order number or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </Col>
          <Col lg={4} md={6} sm={12}>
            <div className="filter-container">
              {isMobile ? (
                <>
                  <Form.Control
                    type="text"
                    value={statusFilter === 'all' ? 'All Orders' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    placeholder="All Orders"
                    readOnly
                    onClick={() => setShowFilterModal(true)}
                    className="filter-select"
                    style={{ cursor: 'pointer' }}
                  />
                </>
              ) : (
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              )}
            </div>
          </Col>
        </Row>

        {/* Orders Summary */}
        <Row className="mb-4">
          <Col xs={6} sm={6} md={6} lg={3} className="mb-3">
            <div className="summary-card">
              <div className="summary-icon total">
                <FaShoppingBag />
              </div>
              <div className="summary-content">
                <h3>{orders.length}</h3>
                <p>Total Orders</p>
              </div>
            </div>
          </Col>
          <Col xs={6} sm={6} md={6} lg={3} className="mb-3">
            <div className="summary-card">
              <div className="summary-icon delivered">
                <FaCheckCircle />
              </div>
              <div className="summary-content">
                <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
                <p>Delivered</p>
              </div>
            </div>
          </Col>
          <Col xs={6} sm={6} md={6} lg={3} className="mb-3">
            <div className="summary-card">
              <div className="summary-icon processing">
                <FaTruck />
              </div>
              <div className="summary-content">
                <h3>{orders.filter(o => ['processing', 'shipped'].includes(o.status)).length}</h3>
                <p>In Transit</p>
              </div>
            </div>
          </Col>
          <Col xs={6} sm={6} md={6} lg={3} className="mb-3">
            <div className="summary-card">
              <div className="summary-icon cancelled">
                <FaTimesCircle />
              </div>
              <div className="summary-content">
                <h3>{orders.filter(o => o.status === 'cancelled').length}</h3>
                <p>Cancelled</p>
              </div>
            </div>
          </Col>
        </Row>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="empty-orders fade-in">
            <div className="empty-orders-icon">
              <FaShoppingBag />
            </div>
            <h3>
              {orders.length === 0 ? 'No orders yet' : 'No orders found'}
            </h3>
            <p>
              {orders.length === 0 
                ? "You haven't placed any orders yet. Start shopping to see your orders here."
                : "No orders match your current search criteria."
              }
            </p>
            {orders.length === 0 && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/products')}
                className="mt-3"
              >
                Start Shopping
              </Button>
            )}
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order, index) => {
              const statusInfo = getStatusBadge(order.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={order._id} className={`order-card fade-in ${index === 0 ? 'first-order' : ''}`}>
                  <Card.Body>
                    <Row className="align-items-center">
                      {/* Order Info */}
                      <Col lg={3} md={6} sm={12} className="mb-3 mb-lg-0">
                        <div className="order-info">
                          <h5 className="order-number">
                            #{order.orderNumber || order._id.slice(-8)}
                          </h5>
                          <p className="order-date">
                            <FaCalendarAlt className="me-2" />
                            {formatDate(order.createdAt)}
                          </p>
                          <div className="order-items-count">
                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </Col>

                      {/* Order Status */}
                      <Col lg={2} md={6} sm={12} className="mb-3 mb-lg-0">
                        <div className="order-status">
                          <Badge bg={statusInfo.variant} className="status-badge">
                            <StatusIcon className="me-2" />
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </Badge>
                        </div>
                      </Col>

                      {/* Order Total */}
                      <Col lg={2} md={6} sm={12} className="mb-3 mb-lg-0">
                        <div className="order-total">
                          <h5>{formatCurrency(calculateOrderTotal(order))}</h5>
                          <p className="text-muted">Total Amount</p>
                        </div>
                      </Col>

                                          {/* Delivery Address */}
                      <Col lg={3} md={6} sm={12} className="mb-3 mb-lg-0">
                        <div className="delivery-address">
                          <FaMapMarkerAlt className="me-2 text-muted" />
                          <div>
                            <p className="address-line">
                              {order.shippingAddress?.street || 'N/A'}
                            </p>
                            <p className="address-city">
                              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
                            </p>
                          </div>
                        </div>
                      </Col>

                      {/* Order Actions */}
                      <Col lg={2} md={12} sm={12}>
                        <div className="order-actions">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => showOrderDetails(order)}
                            className="action-btn mb-2"
                          >
                            <FaEye className="me-1" />
                            View Details
                          </Button>
                          
                          {order.status === 'pending' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleCancelOrderClick(order._id)}
                              disabled={actionLoading}
                              className="action-btn mb-2"
                            >
                              <FaBan className="me-1" />
                              Cancel
                            </Button>
                          )}
                          
                          {['delivered', 'cancelled'].includes(order.status) && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleReorder(order._id)}
                              disabled={actionLoading}
                              className="action-btn"
                            >
                              <FaRedo className="me-1" />
                              Reorder
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>

                    {/* Order Items Preview */}
                    <Row className="mt-3">
                      <Col>
                        <div className="order-items-preview">
                          <h6 className="mb-2">Items:</h6>
                          <div className="items-grid">
                            {order.items?.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="item-preview">
                                {item.product?.images?.[0] && (
                                  <img
                                    src={item.product.images[0].url || '/images/placeholder-product.jpg'}
                                    alt={item.product.name}
                                    className="item-image"
                                    onError={(e) => {
                                      e.target.src = '/images/placeholder-product.jpg';
                                    }}
                                  />
                                )}
                                <div className="item-details">
                                  <p className="item-name">{item.product?.name || 'Unknown Product'}</p>
                                  <p className="item-quantity">Qty: {item.quantity}</p>
                                  <p className="item-price">{formatCurrency(item.price)}</p>
                                </div>
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                              <div className="more-items">
                                +{order.items.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}

        {/* Order Details Modal */}
        <Modal 
          show={showOrderModal} 
          onHide={() => setShowOrderModal(false)}
          size="lg"
          className="order-details-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaReceipt className="me-2" />
              Order Details - #{selectedOrder?.orderNumber || selectedOrder?._id?.slice(-8)}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedOrder && (
              <div className="order-details-content">
                {/* Order Status and Date */}
                <Row className="mb-4">
                  <Col md={6}>
                    <div className="detail-section">
                      <h6>Order Status</h6>
                      <Badge bg={getStatusBadge(selectedOrder.status).variant} className="status-badge-large">
                        {React.createElement(getStatusBadge(selectedOrder.status).icon, { className: "me-2" })}
                        {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-section">
                      <h6>Order Date</h6>
                      <p>{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                  </Col>
                </Row>

                {/* Shipping Address */}
                <Row className="mb-4">
                  <Col md={6}>
                    <div className="detail-section">
                      <h6>
                        <FaMapMarkerAlt className="me-2" />
                        Shipping Address
                      </h6>
                      <div className="address-details">
                        <p>{selectedOrder.shippingAddress?.name}</p>
                        <p>{selectedOrder.shippingAddress?.street}</p>
                        <p>
                          {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}
                        </p>
                        <p>
                          <FaPhone className="me-2" />
                          {selectedOrder.shippingAddress?.phone}
                        </p>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-section">
                      <h6>Payment Method</h6>
                      <p>{selectedOrder.paymentMethod || 'Cash on Delivery'}</p>
                      <h6 className="mt-3">Payment Status</h6>
                      <Badge bg={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {selectedOrder.paymentStatus || 'Pending'}
                      </Badge>
                    </div>
                  </Col>
                </Row>

                {/* Order Items */}
                <div className="detail-section mb-4">
                  <h6>Order Items</h6>
                  <div className="modal-items-list">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="modal-item">
                        <Row className="align-items-center">
                          <Col xs={3} sm={2}>
                            {item.product?.images?.[0] && (
                              <img
                                src={item.product.images[0].url || '/images/placeholder-product.jpg'}
                                alt={item.product.name}
                                className="modal-item-image"
                                onError={(e) => {
                                  e.target.src = '/images/placeholder-product.jpg';
                                }}
                              />
                            )}
                          </Col>
                          <Col xs={9} sm={6}>
                            <h6 className="modal-item-name">{item.product?.name || 'Unknown Product'}</h6>
                            <p className="modal-item-details">
                              Quantity: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </Col>
                          <Col sm={4} className="text-end">
                            <strong>{formatCurrency(item.price * item.quantity)}</strong>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="detail-section">
                  <h6>Order Summary</h6>
                  <div className="order-summary-details">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping:</span>
                      <span>{formatCurrency(selectedOrder.shippingCost || 0)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Tax:</span>
                      <span>{formatCurrency(selectedOrder.taxAmount || 0)}</span>
                    </div>
                    <div className="summary-row total-row">
                      <span><strong>Total:</strong></span>
                      <span><strong>{formatCurrency(calculateOrderTotal(selectedOrder))}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Tracking Information */}
                {selectedOrder.trackingNumber && (
                  <div className="detail-section mt-4">
                    <h6>
                      <FaTruck className="me-2" />
                      Tracking Information
                    </h6>
                    <p>Tracking Number: <strong>{selectedOrder.trackingNumber}</strong></p>
                    <p>Carrier: {selectedOrder.carrier || 'Standard Delivery'}</p>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={`${isMobile ? 'mobile-modal-footer' : ''}`}>
            <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
              Close
            </Button>
            {selectedOrder?.status === 'pending' && (
              <Button
                variant="danger"
                onClick={() => handleCancelOrderClick(selectedOrder._id)}
                disabled={actionLoading}
              >
                <FaBan className="me-2" />
                Cancel Order
              </Button>
            )}
            {['delivered', 'cancelled'].includes(selectedOrder?.status) && (
              <Button
                variant="success"
                onClick={() => handleReorder(selectedOrder._id)}
                disabled={actionLoading}
              >
                <FaRedo className="me-2" />
                Reorder
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Filter Modal for Mobile */}
        <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Filter Orders</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 0 }}>
            <ListGroup variant="flush">
              {[
                { value: 'all', label: 'All Orders' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'processing', label: 'Processing' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' }
              ].map((option, index) => (
                <ListGroup.Item
                  key={index}
                  action
                  onClick={() => {
                    setStatusFilter(option.value);
                    setShowFilterModal(false);
                  }}
                  active={option.value === statusFilter}
                >
                  {option.label}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Modal.Body>
        </Modal>
        
        <ConfirmModal
          show={showCancelModal}
          onHide={() => setShowCancelModal(false)}
          onConfirm={handleCancelOrderConfirm}
          title="Cancel Order"
          message="Are you sure you want to cancel this order? This action cannot be undone."
          confirmText="Cancel Order"
          cancelText="Keep Order"
          variant="danger"
        />
      </Container>
    </div>
  );
};


export default Orders;



