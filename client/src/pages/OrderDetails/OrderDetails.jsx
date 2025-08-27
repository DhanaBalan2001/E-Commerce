import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBox, FaTruck, FaCheckCircle } from 'react-icons/fa';
import { orderService } from '../../services';
import { getImageUrl } from '../../utils/imageUrl';
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

  return (
    <Container className="py-4" style={{marginTop: '80px'}}>
      <Button variant="outline-primary" onClick={() => navigate('/orders')} className="mb-3">
        <FaArrowLeft className="me-2" /> Back to Orders
      </Button>
      
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h3>Order #{order.orderNumber}</h3>
            <div>
              <Badge bg={order.status === 'confirmed' ? 'success' : 'warning'} className="me-2">
                {order.status}
              </Badge>
              <Badge bg={order.paymentInfo?.status === 'completed' ? 'success' : 'danger'}>
                Payment: {order.paymentInfo?.status === 'completed' ? 'paid' : 'not paid'}
              </Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <h5>Items:</h5>
              {order.items?.map((item, idx) => (
                <div key={idx} className="mb-2">
                  <strong>{item.name}</strong> - Qty: {item.quantity} - ₹{item.price}
                </div>
              ))}
              
              <h5 className="mt-4">Shipping Address:</h5>
              <p>
                {order.shippingAddress?.street}<br/>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
              </p>
            </Col>
            <Col md={4}>
              <h5>Order Summary:</h5>
              <h5>Total: ₹{order.pricing?.total}</h5>
              <p>Payment: {order.paymentInfo?.method}</p>
              <p>Status: {order.paymentInfo?.status}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderDetails;

