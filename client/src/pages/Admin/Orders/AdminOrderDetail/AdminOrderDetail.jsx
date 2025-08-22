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
import './adminorderdetail.css';

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
      const response = await api.get(`/admin/orders/${id}`);
      
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

  const handlePaymentVerification = async (approved) => {
    const adminNotes = approved ? 'Payment verified and approved' : 'Payment rejected - invalid or insufficient proof';
    
    try {
      const response = await api.put(`/admin/orders/${id}/verify-payment`, {
        approved,
        adminNotes
      });
      
      if (response.data.success) {
        toast.success(approved ? 'Payment approved successfully' : 'Payment rejected');
        await fetchOrderDetails();
      } else {
        throw new Error(response.data.message || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error(error.response?.data?.message || 'Failed to verify payment');
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

          {/* Payment Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Payment Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="payment-info">
                <div className="mb-3">
                  <strong>Payment Method: </strong>
                  <Badge bg="info">
                    {order.paymentInfo?.method === 'bank_transfer' ? 'Bank Transfer' : 
                     order.paymentInfo?.method === 'cod' ? 'Cash on Delivery' : 
                     order.paymentInfo?.method || 'N/A'}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <strong>Payment Status: </strong>
                  <Badge bg={order.paymentInfo?.status === 'completed' ? 'success' : 
                            order.paymentInfo?.status === 'verification_pending' ? 'warning' : 'secondary'}>
                    {order.paymentInfo?.status === 'verification_pending' ? 'Pending Verification' : 
                     order.paymentInfo?.status === 'completed' ? 'Verified & Completed' : 
                     order.paymentInfo?.status || 'Pending'}
                  </Badge>
                </div>
                
                {/* Bank Transfer Payment Verification */}
                {order.paymentInfo?.method === 'bank_transfer' && (
                  <div className="bank-transfer-verification">
                    
                    <div className="mb-3">
                      <strong>Payment Screenshot:</strong>
                      {order.paymentInfo?.paymentScreenshot ? (
                        <div className="mt-2">
                          
                          {order.paymentInfo.paymentScreenshot.path && (
                            <div>
                              <img 
                                src={`${import.meta.env.VITE_API_BASE_URL}/${order.paymentInfo.paymentScreenshot.path}`}
                                alt="Payment Screenshot"
                                className="payment-screenshot"
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '400px', 
                                  border: '2px solid #ddd', 
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/${order.paymentInfo.paymentScreenshot.path}`, '_blank')}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div style={{display: 'none', padding: '20px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px'}}>
                                Failed to load image from: {import.meta.env.VITE_API_BASE_URL}/{order.paymentInfo.paymentScreenshot.path}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="alert alert-warning mt-2">
                          No payment screenshot found
                        </div>
                      )}
                    </div>
                    
                    {order.paymentInfo?.status === 'verification_pending' && (
                      <div className="verification-actions mb-3">
                        <Alert variant="warning" className="mb-3">
                          <strong>Action Required:</strong> Please verify the payment screenshot and approve or reject the payment.
                        </Alert>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="success" 
                            size="lg"
                            onClick={() => handlePaymentVerification(true)}
                          >
                            <FaCheckCircle className="me-2" />
                            Approve Payment
                          </Button>
                          <Button 
                            variant="danger" 
                            size="lg"
                            onClick={() => handlePaymentVerification(false)}
                          >
                            <FaTimesCircle className="me-2" />
                            Reject Payment
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {order.paymentInfo.verifiedAt && (
                      <div className="mb-2">
                        <strong>Verification Details:</strong>
                        <div className="mt-1">
                          <small className="text-muted">
                            Verified on: {new Date(order.paymentInfo.verifiedAt).toLocaleString()}
                            {order.paymentInfo.verifiedBy && (
                              <><br />Verified by: {order.paymentInfo.verifiedBy.name || `Admin ID ${order.paymentInfo.verifiedBy}`}</>
                            )}
                          </small>
                        </div>
                      </div>
                    )}
                    
                    {order.paymentInfo.adminNotes && (
                      <div className="mt-2">
                        <strong>Admin Notes:</strong>
                        <div className="mt-1 p-2 bg-light rounded">
                          <small>{order.paymentInfo.adminNotes}</small>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                    <td className="text-capitalize">
                      {order.paymentInfo?.method === 'bank_transfer' ? 'Bank Transfer' : 
                       order.paymentInfo?.method === 'cod' ? 'Cash on Delivery' :
                       order.paymentInfo?.method || 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-top">
                    <td><strong>Total Amount:</strong></td>
                    <td>
                      <h5 className="text-success mb-0">
                        <FaRupeeSign />{order.pricing?.total?.toFixed(2) || order.total || '0.00'}
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

