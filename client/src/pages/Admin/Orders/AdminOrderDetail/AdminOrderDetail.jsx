import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Badge, 
  Button, 
  Table,
  Alert,
  Spinner,
  Modal,
  Form
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaUser,
  FaMapMarkerAlt,
  FaBox,
  FaRupeeSign,
  FaClock,
  FaCheckCircle,
  FaShippingFast,
  FaTimesCircle
} from 'react-icons/fa';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../services/api';
import './AdminOrderDetail.css';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching order details for ID:', id);
      
      const response = await api.get(`/admin/orders/${id}`);
      console.log('Order details response:', response.data);
      
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        throw new Error(response.data.message || 'Order not found');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      const response = await api.put(`/admin/orders/${id}/status`, { status: newStatus });
      
      if (response.data.success) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        toast.success('Order status updated successfully');
        setShowStatusModal(false);
        setNewStatus('');
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', icon: FaClock, text: 'Pending' },
      confirmed: { variant: 'info', icon: FaCheckCircle, text: 'Confirmed' },
      processing: { variant: 'primary', icon: FaClock, text: 'Processing' },
      shipped: { variant: 'success', icon: FaShippingFast, text: 'Shipped' },
      delivered: { variant: 'success', icon: FaCheckCircle, text: 'Delivered' },
      cancelled: { variant: 'danger', icon: FaTimesCircle, text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge bg={config.variant} className="status-badge">
        <Icon className="me-1" />
        {config.text}
      </Badge>
    );
  };

  const calculateItemTotal = (item) => {
    return (item.price * item.quantity).toFixed(2);
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading order details...</p>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container fluid>
        <Alert variant="danger">
          <h5>Order Not Found</h5>
          <p>The order you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline-danger" onClick={() => navigate('/admin/orders')}>
            Back to Orders
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-order-detail">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
             <h2>Order #{order.orderNumber}</h2>
              <div className="d-flex align-items-center gap-2 mt-2">
                {getStatusBadge(order.status)}
                <Badge bg={order.paymentInfo?.status === 'completed' ? 'success' : 'warning'}>
                  Payment: {order.paymentInfo?.status || 'pending'}
                </Badge>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setNewStatus(order.status);
                  setShowStatusModal(true);
                }}
              >
                <FaEdit className="me-2" />
                Update Status
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Order Information */}
        <Col lg={8}>
          {/* Order Items */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaBox className="me-2" />
                Order Items ({order.items?.length || 0})
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div>
                            <h6 className="mb-0">{item.product?.name || item.name || 'Product Name'}</h6>
                            <small className="text-muted">
                              Category: {item.product?.category?.name || 'Uncategorized'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <FaRupeeSign />{item.price}
                      </td>
                      <td>
                        <Badge bg="secondary">{item.quantity}</Badge>
                      </td>
                      <td>
                        <strong><FaRupeeSign />{calculateItemTotal(item)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Shipping Address */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaMapMarkerAlt className="me-2" />
                Shipping Address
              </h5>
            </Card.Header>
            <Card.Body>
              {order.shippingAddress ? (
                <div className="shipping-address-details">
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Full Name:</strong></td>
                        <td>{order.user?.name || order.shippingAddress.name || 'N/A'}</td>
                      </tr>

                      <tr>
                        <td><strong>Street/Area:</strong></td>
                        <td>{order.shippingAddress.street || order.shippingAddress.area || order.shippingAddress.address || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Landmark:</strong></td>
                        <td>{order.shippingAddress.landmark || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>City:</strong></td>
                        <td>{order.shippingAddress.city || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>State:</strong></td>
                        <td>{order.shippingAddress.state || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>PIN Code:</strong></td>
                        <td>{order.shippingAddress.pincode || order.shippingAddress.zipCode || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Phone Number:</strong></td>
                        <td>{order.shippingAddress.phoneNumber || order.shippingAddress.phone || 'N/A'}</td>
                      </tr>
                      {order.shippingAddress.alternatePhone && (
                        <tr>
                          <td><strong>Alternate Phone:</strong></td>
                          <td>{order.shippingAddress.alternatePhone}</td>
                        </tr>
                      )}
                      <tr>
                        <td><strong>Address Type:</strong></td>
                        <td>
                          <Badge bg={order.shippingAddress.type === 'home' ? 'success' : 'primary'}>
                            {order.shippingAddress.type || 'Home'}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                  
                  <div className="mt-3 p-2 bg-light rounded">
                    <strong>Complete Address:</strong>
                    <p className="mb-0 mt-1">
                      {order.user?.name || order.shippingAddress.name}<br/>
                      {order.shippingAddress.doorNo || order.shippingAddress.houseNo}, {order.shippingAddress.street || order.shippingAddress.area || order.shippingAddress.address}<br/>
                      {order.shippingAddress.landmark && `Near ${order.shippingAddress.landmark}, `}
                      {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br/>
                      Phone: {order.shippingAddress.phoneNumber || order.shippingAddress.phone}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted">No shipping address available</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Order Summary */}
        <Col lg={4}>
          {/* Customer Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Customer Information
              </h5>
            </Card.Header>
            <Card.Body>
              <Table borderless size="sm">
                <tbody>
                  <tr>
                    <td><strong>Name:</strong></td>
                    <td>{order.user?.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Email:</strong></td>
                    <td>{order.user?.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Phone:</strong></td>
                    <td>{order.user?.phone || order.user?.phoneNumber || order.shippingAddress?.phoneNumber || order.shippingAddress?.phone || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Customer ID:</strong></td>
                    <td><code>{order.user?._id || 'N/A'}</code></td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Order Summary */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>Order Date:</strong></td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Order Time:</strong></td>
                    <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Payment Method:</strong></td>
                    <td className="text-capitalize">{order.paymentInfo?.method || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Payment ID:</strong></td>
                    <td>
                      {order.paymentInfo?.razorpayPaymentId ? (
                        <code>{order.paymentInfo.razorpayPaymentId}</code>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                  <tr className="border-top">
                    <td><strong>Total Amount:</strong></td>
                    <td>
                      <h5 className="text-success mb-0">
                        <FaRupeeSign />{order.pricing?.total || order.total}
                      </h5>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Order Timeline */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Timeline</h5>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-marker bg-success"></div>
                  <div className="timeline-content">
                    <h6>Order Placed</h6>
                    <small className="text-muted">
                      {new Date(order.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>
                
                {order.status !== 'pending' && (
                  <div className="timeline-item">
                    <div className="timeline-marker bg-info"></div>
                    <div className="timeline-content">
                      <h6>Status: {order.status}</h6>
                      <small className="text-muted">
                        {new Date(order.updatedAt).toLocaleString()}
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="mb-3">Select New Status</Form.Label>
            <div className="status-options">
              {[
                { value: 'pending', label: 'Pending', color: 'warning' },
                { value: 'confirmed', label: 'Confirmed', color: 'info' },
                { value: 'processing', label: 'Processing', color: 'primary' },
                { value: 'shipped', label: 'Shipped', color: 'success' },
                { value: 'delivered', label: 'Delivered', color: 'success' },
                { value: 'cancelled', label: 'Cancelled', color: 'danger' }
              ].map((status) => (
                <div key={status.value} className="status-option mb-2">
                  <Form.Check
                    type="radio"
                    id={`status-${status.value}`}
                    name="orderStatus"
                    value={status.value}
                    checked={newStatus === status.value}
                    onChange={(e) => setNewStatus(e.target.value)}
                    label={
                      <Badge bg={status.color} className="status-badge-option">
                        {status.label}
                      </Badge>
                    }
                  />
                </div>
              ))}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStatusUpdate}
            disabled={updating || !newStatus}
          >
                        {updating ? (
              <>
                <Spinner size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOrderDetail;

