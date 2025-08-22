import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  Badge,
  Dropdown,
  Pagination,
  Spinner,
  Alert,
  InputGroup,
  Modal,
  ListGroup
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaEye, 
  FaEdit, 
  FaSearch, 
  FaFilter,
  FaDownload,
  FaSync,
  FaShippingFast,
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from 'react-icons/fa';
import { useToast } from '../../../../context/ToastContext';
import { useGlobalRefresh } from '../../../../hooks/useGlobalRefresh';
import api from '../../../../services/api'; 
import './adminorders.css';

const MobileDropdown = ({ value, onChange, options, placeholder }) => {
  const [showModal, setShowModal] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  const isMobile = window.innerWidth <= 768;
  
  if (!isMobile) {
    return (
      <Form.Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option, index) => (
          <option key={index} value={option.value}>{option.label}</option>
        ))}
      </Form.Select>
    );
  }
  
  return (
    <>
      <Form.Control
        type="text"
        value={selectedOption?.label || ''}
        placeholder={placeholder}
        readOnly
        onClick={() => setShowModal(true)}
        style={{ cursor: 'pointer' }}
      />
      
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{placeholder}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            {options.map((option, index) => (
              <ListGroup.Item
                key={index}
                action
                onClick={() => {
                  onChange(option.value);
                  setShowModal(false);
                }}
                active={option.value === value}
              >
                {option.label}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </>
  );
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await api.get(`/admin/orders?${queryParams}`, { timeout: 10000 });
      const data = response.data;
      
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.total || 0);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);
  
  // Use global refresh hook
  useGlobalRefresh(fetchOrders);

  const handleStatusUpdate = async (orderId, newStatus) => {

    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus }, { timeout: 8000 });
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const [processingPayments, setProcessingPayments] = useState(new Set());

  const handlePaymentVerification = async (orderId, approved) => {
    if (processingPayments.has(orderId)) return;
    
    setProcessingPayments(prev => new Set(prev).add(orderId));
    
    try {
      const adminNotes = approved ? 'Payment verified and approved' : 'Payment rejected';
      await api.put(`/admin/orders/${orderId}/verify-payment`, {
        approved,
        adminNotes
      }, { timeout: 5000 });
      
      toast.success(approved ? 'Payment approved successfully' : 'Payment rejected');
      
      // Update order locally for immediate UI feedback
      setOrders(prev => prev.map(order => 
        order._id === orderId 
          ? { ...order, paymentInfo: { ...order.paymentInfo, status: approved ? 'completed' : 'failed' } }
          : order
      ));
      
    } catch (error) {
      toast.error('Failed to verify payment');
    } finally {
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // ... rest of your component remains the same
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
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

  const exportOrders = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== 'limit') queryParams.append(key, value);
      });
      
      const response = await api.get(`/admin/orders/export?${queryParams}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Orders exported successfully');
    } catch (error) {
      toast.error('Failed to export orders');
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 10
    });
  };

  return (
    <Container fluid className="admin-orders">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">Orders Management</h1>
          </div>
          <div className="header-actions">
            <Button 
              variant="outline-primary" 
              onClick={exportOrders}
              className="header-btn"
            >
              <FaDownload />
              <span>Export</span>
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={fetchOrders}
              className="header-btn"
            >
              <FaSync />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <button 
        className="mobile-filter-toggle"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <FaFilter />
        <span>{showMobileFilters ? 'Hide Filters' : 'Show Filters'}</span>
      </button>

      {/* Filters */}
      <div className="filters-card">
        <div className={`filters-content ${showMobileFilters ? 'show' : ''}`}>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search Orders</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Order number, customer..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <MobileDropdown
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'processing', label: 'Processing' },
                    { value: 'shipped', label: 'Shipped' },
                    { value: 'delivered', label: 'Delivered' },
                    { value: 'cancelled', label: 'Cancelled' }
                  ]}
                  placeholder="All Status"
                >
                </MobileDropdown>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Payment Status</Form.Label>
                <MobileDropdown
                  value={filters.paymentStatus}
                  onChange={(value) => handleFilterChange('paymentStatus', value)}
                  options={[
                    { value: '', label: 'All Payments' },
                    { value: 'verification_pending', label: 'Needs Verification' },
                    { value: 'completed', label: 'Verified' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'failed', label: 'Failed' }
                  ]}
                  placeholder="All Payments"
                >
                </MobileDropdown>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Per Page</Form.Label>
                <MobileDropdown
                  value={filters.limit}
                  onChange={(value) => handleFilterChange('limit', parseInt(value))}
                  options={[
                    { value: 10, label: '10' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' }
                  ]}
                  placeholder="Per Page"
                >
                </MobileDropdown>
              </Form.Group>
            </Col>
            <Col md={1} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters}>
                Clear
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-card">
        <div className="table-header">
          <h5 className="table-title">Orders List</h5>
          <small className="table-subtitle">Showing {orders.length} of {totalOrders} orders</small>
        </div>
        <div className="table-body">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <Alert variant="info" className="m-4">
              <h5>No Orders Found</h5>
              <p>No orders match your current filters.</p>
              <Button variant="outline-info" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Alert>
          ) : (
            <>
            {/* Desktop Table */}
            <Table responsive hover className="mb-0 orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link 
                        to={`/admin/orders/${order._id}`}
                        className="text-decoration-none fw-bold"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold">{order.user?.name || 'N/A'}</div>
                        <small className="text-muted">{order.user?.email || 'N/A'}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <small className="text-muted">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </small>
                      </div>
                    </td>
                    <td>
                      <Badge bg="secondary">
                        {order.items?.length || 0} items
                      </Badge>
                    </td>
                    <td>
                      <strong>₹{order.pricing?.total || order.total || 0}</strong>
                    </td>
                    <td>
                      {getStatusBadge(order.status)}
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <Badge 
                          bg={order.paymentInfo?.status === 'completed' ? 'success' : 
                              order.paymentInfo?.status === 'verification_pending' ? 'warning' : 'secondary'}
                        >
                          {order.paymentInfo?.status === 'verification_pending' ? 'Needs Verification' :
                           order.paymentInfo?.status === 'completed' ? 'Verified' :
                           order.paymentInfo?.status || 'pending'}
                        </Badge>
                        {order.paymentInfo?.method === 'bank_transfer' && 
                         order.paymentInfo?.status === 'verification_pending' && (
                          <div className="d-flex gap-1">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handlePaymentVerification(order._id, true)}
                              disabled={processingPayments.has(order._id)}
                              title="Approve Payment"
                            >
                              {processingPayments.has(order._id) ? <Spinner size="sm" /> : '✓'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handlePaymentVerification(order._id, false)}
                              disabled={processingPayments.has(order._id)}
                              title="Reject Payment"
                            >
                              {processingPayments.has(order._id) ? <Spinner size="sm" /> : '✗'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                          onClick={() => navigate(`/admin/orders/${order._id}`)}
                        >
                          <FaEye />
                        </Button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {/* Mobile Cards */}
            <div className="mobile-orders-grid">
              {orders.map((order) => (
                <div key={order._id} className="mobile-order-card">
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-title">
                        <Link 
                          to={`/admin/orders/${order._id}`}
                          className="text-decoration-none fw-bold"
                        >
                          #{order.orderNumber}
                        </Link>
                      </div>
                      <div className="mobile-card-customer">{order.user?.name || 'N/A'}</div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="mobile-card-body">
                    <div className="mobile-card-field mobile-field-left">
                      <div className="mobile-field-label">Date</div>
                      <div className="mobile-field-value">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="mobile-card-field mobile-field-right">
                      <div className="mobile-field-label">Items</div>
                      <div className="mobile-field-value">
                        <Badge bg="secondary" className="badge">
                          {order.items?.length || 0} items
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field mobile-field-left">
                      <div className="mobile-field-label">Total</div>
                      <div className="mobile-field-value">
                        <strong>₹{order.pricing?.total || order.total || 0}</strong>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field mobile-field-right">
                      <div className="mobile-field-label">Payment</div>
                      <div className="mobile-field-value">
                        <Badge 
                          bg={order.paymentInfo?.status === 'completed' ? 'success' : 
                              order.paymentInfo?.status === 'verification_pending' ? 'warning' : 'secondary'}
                          className="badge"
                        >
                          {order.paymentInfo?.status === 'verification_pending' ? 'Needs Verification' :
                           order.paymentInfo?.status === 'completed' ? 'Verified' :
                           order.paymentInfo?.status || 'pending'}
                        </Badge>
                        {order.paymentInfo?.method === 'bank_transfer' && 
                         order.paymentInfo?.status === 'verification_pending' && (
                          <div className="d-flex gap-1 mt-1">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handlePaymentVerification(order._id, true)}
                              disabled={processingPayments.has(order._id)}
                            >
                              {processingPayments.has(order._id) ? <Spinner size="sm" /> : 'Approve'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handlePaymentVerification(order._id, false)}
                              disabled={processingPayments.has(order._id)}
                            >
                              {processingPayments.has(order._id) ? <Spinner size="sm" /> : 'Reject'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mobile-card-actions">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                    >
                      <FaEye /> View
                    </Button>

                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-wrapper">
            <Pagination className="pagination">
                <Pagination.First
                  disabled={filters.page === 1}
                  onClick={() => handlePageChange(1)}
                />
                <Pagination.Prev
                  disabled={filters.page === 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                />
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= filters.page - 2 && page <= filters.page + 2)
                  ) {
                    return (
                      <Pagination.Item
                        key={page}
                        active={page === filters.page}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Pagination.Item>
                    );
                  } else if (
                    page === filters.page - 3 ||                     page === filters.page + 3
                  ) {
                    return <Pagination.Ellipsis key={page} />;
                  }
                  return null;
                })}
                
                <Pagination.Next
                  disabled={filters.page === totalPages}
                  onClick={() => handlePageChange(filters.page + 1)}
                />
                <Pagination.Last
                  disabled={filters.page === totalPages}
                  onClick={() => handlePageChange(totalPages)}
                />
              </Pagination>
          </div>
        )}
      </div>
    </Container>
  );
};

export default AdminOrders;

