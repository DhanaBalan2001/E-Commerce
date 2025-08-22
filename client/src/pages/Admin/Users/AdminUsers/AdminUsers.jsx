import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  Badge,
  Pagination,
  Spinner,
  Alert,
  Modal,
  ListGroup
} from 'react-bootstrap';
import { 
  FaEye, 
  FaSearch, 
  FaSync,

  FaUserCheck,
  FaUserTimes
} from 'react-icons/fa';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../services/api';
import './adminusers.css';

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

const AdminUsers = () => {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userStats, setUserStats] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await api.get(`/admin/users?${queryParams}`, { timeout: 10000 });
      const data = response.data;
      
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/admin/users/stats', { timeout: 8000 });
      setUserStats(response.data || {});
    } catch (error) {
      setUserStats({});
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
    if (window.innerWidth <= 768) {
      setShowMobileFilters(false);
    }
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      page: 1,
      limit: 10
    });
  };



  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
        fetchUserStats();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="admin-users">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">Users Management</h1>
          </div>
          <Button variant="outline-primary" onClick={fetchUsers} className="refresh-btn">
            <FaSync className="me-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <button 
        className="mobile-filter-toggle"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <FaSearch />
        <span>{showMobileFilters ? 'Hide Filters' : 'Show Filters'}</span>
      </button>

      {/* Filters */}
      <div className="filters-card">
        <div className={`filters-content ${showMobileFilters ? 'show' : ''}`}>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Search Users</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Name, email..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  <FaSearch className="search-icon" />
                </div>
              </Form.Group>
            </Col>
            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <MobileDropdown
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                  placeholder="All Status"
                >
                </MobileDropdown>
              </Form.Group>
            </Col>
            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Per Page</Form.Label>
                <MobileDropdown
                  value={filters.limit}
                  onChange={(value) => handleFilterChange('limit', parseInt(value))}
                  options={[
                    { value: 10, label: '10' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' }
                  ]}
                  placeholder="Per Page"
                >
                </MobileDropdown>
              </Form.Group>
            </Col>
            <Col md={2} className="mb-3 d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters}>
                Clear
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col md={3} sm={6} xs={6}>
          <Card className="stats-card text-center h-100">
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <h3 className="text-primary mb-2">{userStats.total || 0}</h3>
              <p className="text-muted mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={6}>
          <Card className="stats-card text-center h-100">
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <h3 className="text-success mb-2">{userStats.active || 0}</h3>
              <p className="text-muted mb-0">Active Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={6}>
          <Card className="stats-card text-center h-100">
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <h3 className="text-info mb-2">{userStats.newThisMonth || 0}</h3>
              <p className="text-muted mb-0">New This Month</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={6}>
          <Card className="stats-card text-center h-100">
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <h3 className="text-warning mb-2">{userStats.withOrders || 0}</h3>
              <p className="text-muted mb-0">With Orders</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>



      {/* Users Table */}
      <div className="users-table-card">
        <div className="table-header">
          <h5 className="table-title">Users List</h5>
          <small className="table-subtitle">Showing {users.length} of {totalUsers} users</small>
        </div>
        <div className="table-body">

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <Alert variant="info" className="m-4">
              <h5>No Users Found</h5>
              <p>No users match your current filters.</p>
              <Button variant="outline-info" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Alert>
          ) : (
            <>
            {/* Desktop Table */}
            <Table responsive hover className="mb-0 users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div>
                        <div className="fw-semibold">{user.name || 'N/A'}</div>
                        <small className="text-muted">ID: {user._id}</small>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber || user.phone || 'N/A'}</td>
                    <td>
                      {user.addresses && user.addresses.length > 0 ? (
                        <div>
                          <div className="fw-semibold">{user.addresses[0].street}</div>
                          <small className="text-muted">
                            {user.addresses[0].city}, {user.addresses[0].state} - {user.addresses[0].pincode}
                            {user.addresses[0].landmark && `, Near ${user.addresses[0].landmark}`}
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted">No address</span>
                      )}
                    </td>
                    <td>
                      <Badge bg="secondary">
                        {user.orderCount || 0} orders
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {/* Mobile Cards */}
            <div className="mobile-users-grid">
              {users.map((user) => (
                <div key={user._id} className="mobile-user-card">
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-title">{user.name || 'N/A'}</div>
                      <div className="mobile-card-id">ID: {user._id}</div>
                    </div>
                    <Badge bg="secondary">
                      {user.orderCount || 0} orders
                    </Badge>
                  </div>
                  
                  <div className="mobile-card-body">
                    <div className="mobile-card-field mobile-field-left">
                      <div className="mobile-field-label">Email</div>
                      <div className="mobile-field-value">{user.email}</div>
                    </div>
                    
                    <div className="mobile-card-field mobile-field-right">
                      <div className="mobile-field-label">Phone</div>
                      <div className="mobile-field-value">{user.phoneNumber || user.phone || 'N/A'}</div>
                    </div>
                    
                    <div className="mobile-card-field mobile-card-field-full">
                      <div className="mobile-field-label">Address</div>
                      <div className="mobile-field-value">
                        {user.addresses && user.addresses.length > 0 ? (
                          <p style={{textAlign: 'center', margin: 0, fontSize: '0.75rem', textAlignLast: 'center', lineHeight: '1.4'}} className="text-muted">
                            {user.addresses[0].street} {user.addresses[0].city}, {user.addresses[0].state} - {user.addresses[0].pincode}
                            {user.addresses[0].landmark && `, Near ${user.addresses[0].landmark}`}
                          </p>
                        ) : (
                          <span className="text-muted">No address</span>
                        )}
                      </div>
                    </div>
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
                    page === filters.page - 3 ||
                    page === filters.page + 3
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
    </div>
  );
};

export default AdminUsers;

