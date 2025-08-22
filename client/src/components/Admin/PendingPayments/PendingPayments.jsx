import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Table, Alert, Spinner } from 'react-bootstrap';
import { FaClock, FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const PendingPayments = () => {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/orders?paymentStatus=verification_pending&limit=5');
      
      if (response.data.success) {
        setPendingOrders(response.data.orders || []);
      }
    } catch (err) {
      setError('Failed to fetch pending payments');
      console.error('Error fetching pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <FaClock className="me-2" />
            Pending Payment Verifications
          </h5>
        </Card.Header>
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" />
          <p className="mt-2 mb-0">Loading...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaClock className="me-2" />
          Pending Payment Verifications
          {pendingOrders.length > 0 && (
            <Badge bg="warning" className="ms-2">
              {pendingOrders.length}
            </Badge>
          )}
        </h5>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => navigate('/admin/orders?filter=verification_pending')}
        >
          View All
        </Button>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {pendingOrders.length === 0 ? (
          <div className="text-center text-muted">
            <FaCheckCircle size={48} className="mb-3 opacity-50" />
            <p>No pending payment verifications</p>
          </div>
        ) : (
          <Table responsive size="sm" className="mb-0">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <code>{order.orderNumber}</code>
                  </td>
                  <td>{order.user?.name || 'N/A'}</td>
                  <td>₹{order.pricing?.total || 0}</td>
                  <td>
                    <small>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleViewOrder(order._id)}
                    >
                      <FaEye className="me-1" />
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default PendingPayments;