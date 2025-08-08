import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav, Tab, Badge, Modal, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { authService, addressService, orderService } from '../../services';
import ConfirmModal from '../../components/common/ConfirmModal';
import './profile.css';

const Profile = () => {
  const { user, updateUser, logout } = useAppContext();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showAddressTypeModal, setShowAddressTypeModal] = useState(false);
  const [showDeleteAddressModal, setShowDeleteAddressModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  // API calls using custom hook
  const {
    data: addressesData,
    loading: addressesLoading,
    refetch: refetchAddresses
  } = useApi(addressService.getAddresses, [], { immediate: true });

  const {
    data: ordersData,
    loading: ordersLoading,
    refetch: refetchOrders
  } = useApi(() => orderService.getUserOrders({ limit: 5 }), [], { immediate: true });

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: ''
  });

  // Address form state
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    type: 'home',
    isDefault: false
  });

  const addresses = addressesData?.addresses || [];
  const orders = ordersData?.orders || [];

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.updateProfile(profileData);
      updateUser(response.user);
      toast.success('Profile updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress._id, addressData);
        toast.success('Address updated successfully!');
        setEditingAddress(null);
      } else {
        await addressService.addAddress(addressData);
        toast.success('Address added successfully!');
      }
      
      setShowAddressForm(false);
      resetAddressForm();
      refetchAddresses(); // Refresh addresses list
    } catch (error) {
      toast.error(error.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setAddressData({
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      type: address.type,
      isDefault: address.isDefault
    });
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddressClick = (addressId) => {
    setAddressToDelete(addressId);
    setShowDeleteAddressModal(true);
  };

  const handleDeleteAddressConfirm = async () => {
    try {
      await addressService.deleteAddress(addressToDelete);
      toast.success('Address deleted successfully!');
      refetchAddresses(); // Refresh addresses list
    } catch (error) {
      toast.error(error.message || 'Failed to delete address');
    } finally {
      setShowDeleteAddressModal(false);
      setAddressToDelete(null);
    }
  };

  // Add this missing function
  const handleCancelOrder = async (orderId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (reason) {
      try {
        await orderService.cancelOrder(orderId, reason);
        toast.success('Order cancelled successfully!');
        refetchOrders(); // Refresh orders list
      } catch (error) {
        toast.error(error.message || 'Failed to cancel order');
      }
    }
  };

  const resetAddressForm = () => {
    setAddressData({
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      type: 'home',
      isDefault: false
    });
    setEditingAddress(null);
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    resetAddressForm();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    toast.success('Logged out successfully!');
    setShowLogoutModal(false);
  };

  return (
    <div className="profile-page">
        {/* Page Header */}
      <div className="profile-header">
        <Container>
          <Row>
            <Col>
              <div className="profile-header-content">
                <h1 className="profile-page-title">My Account</h1>
                <p className="profile-page-subtitle">
                  Manage your profile, addresses, orders, and account settings
                </p>
                <div className="profile-breadcrumb">
                  <Link to="/" className="breadcrumb-link">Home</Link>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-current">My Account</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <Container className="py-4">
        <Row>
          {/* Sidebar */}
          <Col lg={3} className="mb-4">
            <Card className="profile-sidebar">
              <Card.Body>
                <div className="profile-avatar text-center mb-3">
                  <div className="avatar-circle">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <h5 className="mt-2 mb-1">{user?.name}</h5>
                  <small className="text">{user?.email}</small>
                </div>
                
                <Nav variant="pills" className="flex-column profile-nav">
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'profile'}
                      onClick={() => setActiveTab('profile')}
                    >
                      👤 Profile Information
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'addresses'}
                      onClick={() => setActiveTab('addresses')}
                    >
                      📍 Addresses
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'orders'}
                      onClick={() => setActiveTab('orders')}
                    >
                      📦 Recent Orders
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'security'}
                      onClick={() => setActiveTab('security')}
                    >
                      🔒 Security
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={9}>
            <Tab.Content>
              {/* Profile Information Tab */}
              <Tab.Pane active={activeTab === 'profile'}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Profile Information</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleProfileSubmit}>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Full Name *</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={profileData.name}
                              onChange={handleProfileChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={profileData.email}
                              disabled
                              className="bg-light"
                            />
                            <Form.Text className="text-muted">
                              Email cannot be changed
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phoneNumber"
                              value={profileData.phoneNumber}
                              onChange={handleProfileChange}
                              pattern="[6-9][0-9]{9}"
                              placeholder="Enter 10-digit mobile number"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Date of Birth</Form.Label>
                            <Form.Control
                              type="date"
                              name="dateOfBirth"
                              value={profileData.dateOfBirth}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>

                      </Row>
                      
                      <div className="d-flex justify-content-end">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Updating...
                            </>
                          ) : (
                            'Update Profile'
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Addresses Tab */}
              <Tab.Pane active={activeTab === 'addresses'}>
                <Card>
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Saved Addresses</h5>
                      <Button
                        variant="primary"
                        onClick={() => setShowAddressForm(true)}
                        disabled={showAddressForm}
                      >
                        Add New Address
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {/* Add/Edit Address Form */}
                    {showAddressForm && (
                      <div className="address-form mb-4">
                        <h6>{editingAddress ? 'Edit Address' : 'Add New Address'}</h6>
                        <Form onSubmit={handleAddressSubmit}>
                          <Row>
                            <Col md={12} className="mb-3">
                              <Form.Group>
                               

                                <Form.Label>Street Address *</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="street"
                                  value={addressData.street}
                                  onChange={handleAddressChange}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>City *</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="city"
                                  value={addressData.city}
                                  onChange={handleAddressChange}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>State *</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="state"
                                  value={addressData.state}
                                  onChange={handleAddressChange}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>Pincode *</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="pincode"
                                  value={addressData.pincode}
                                  onChange={handleAddressChange}
                                  pattern="[0-9]{6}"
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>Landmark</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="landmark"
                                  value={addressData.landmark}
                                  onChange={handleAddressChange}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>Address Type</Form.Label>
                                <Button
                                  variant="outline-secondary"
                                  className="w-100 text-start bg-white text-dark"
                                  style={{ 
                                    textAlign: 'left',
                                    color: 'black',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'orange';
                                    e.target.style.borderColor = 'orange';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'white';
                                    e.target.style.borderColor = '#6c757d';
                                  }}
                                  onClick={() => setShowAddressTypeModal(true)}
                                >
                                  {addressData.type.charAt(0).toUpperCase() + addressData.type.slice(1)}
                                </Button>
                              </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Check
                                  type="checkbox"
                                  name="isDefault"
                                  checked={addressData.isDefault}
                                  onChange={handleAddressChange}
                                  label="Set as default address"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          <div className="d-flex gap-2">
                            <Button
                              type="submit"
                              variant="primary"
                              disabled={loading}
                            >
                              {loading ? 'Saving...' : (editingAddress ? 'Update' : 'Add')} Address
                            </Button>
                            <Button
                              type="button"
                              variant="outline-secondary"
                              onClick={handleCancelAddressForm}
                            >
                              Cancel
                            </Button>
                          </div>
                        </Form>
                        <hr />
                      </div>
                    )}

                    {/* Address List */}
                    {addressesLoading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Loading addresses...</p>
                      </div>
                    ) : addresses.length > 0 ? (
                      <div className="address-list">
                        {addresses.map((address) => (
                          <div key={address._id} className="address-card mb-3">
                            <div className="address-header">
                              <div className="address-type">
                                <strong>{address.type.charAt(0).toUpperCase() + address.type.slice(1)}</strong>
                                {address.isDefault && (
                                  <Badge bg="primary" className="ms-2">Default</Badge>
                                )}
                              </div>
                              <div className="address-actions d-none d-md-flex">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditAddress(address)}
                                  className="me-2"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteAddressClick(address._id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="address-details">
                              <p className="mb-1">{address.street}</p>
                              <p className="mb-1">{address.city}, {address.state} - {address.pincode}</p>
                              {address.landmark && (
                                <p className="mb-0 text-muted">Landmark: {address.landmark}</p>
                              )}
                            </div>
                            <div className="address-actions d-md-none mt-2" style={{display: 'flex', gap: '8px'}}>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditAddress(address)}
                                style={{flex: '1'}}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteAddressClick(address._id)}
                                style={{flex: '1'}}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">No addresses saved yet.</p>
                        <Button
                          variant="primary"
                          onClick={() => setShowAddressForm(true)}
                        >
                          Add Your First Address
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Orders Tab */}
              <Tab.Pane active={activeTab === 'orders'}>
                <Card>
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Recent Orders</h5>
                      <Button variant="outline-primary" href="/orders">
                        View All Orders
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {ordersLoading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Loading orders...</p>
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="orders-list">
                        {orders.map((order) => (
                          <div key={order._id} className="order-card mb-3">
                            <div className="order-header">
                              <div>
                                <strong>Order #{order.orderNumber}</strong>
                                <br />
                                <small className="text-muted">
                                  Placed on {formatDate(order.createdAt)}
                                </small>
                              </div>
                              <div className="text-end">
                                <Badge bg={getStatusBadgeVariant(order.status)}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                                <br />
                                <strong>₹{order.pricing.total.toFixed(2)}</strong>
                              </div>
                            </div>
                            <div className="order-items">
                              {order.items.slice(0, 2).map((item, index) => (
                                <div key={index} className="order-item-preview">
                                  <small>{item.name} × {item.quantity}</small>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <small className="text-muted">
                                  +{order.items.length - 2} more items
                                </small>
                              )}
                            </div>
                            <div className="order-actions mt-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                href={`/orders/${order._id}`}
                              >
                                View Details
                              </Button>
                              {order.status === 'pending' && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="ms-2"
                                  onClick={() => handleCancelOrder(order._id)}
                                >
                                  Cancel Order
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="empty-orders-icon mb-3">📦</div>
                        <p className="text-muted">No orders found.</p>
                        <Button variant="primary" href="/">
                          Start Shopping
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Security Tab */}
              <Tab.Pane active={activeTab === 'security'}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Security Settings</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="security-section mb-4">
                      <h6>Account Security</h6>
                      <div className="security-item">
                        <div className="security-info">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <strong>Email Verification</strong>
                            <Badge bg="success">Verified</Badge>
                          </div>
                          <small className="text-muted">
                            Your email {user?.email} is verified
                          </small>
                        </div>
                      </div>
                      
                      <div className="security-item">
                        <div className="security-info">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <strong>Phone Number</strong>
                            {user?.phoneNumber && <Badge bg="success">Added</Badge>}
                          </div>
                          <small className="text-muted d-block mb-2">
                            {user?.phoneNumber ? 
                              `Your phone ${user.phoneNumber} is linked` : 
                              'Add phone number for better security'
                            }
                          </small>
                          {!user?.phoneNumber && (
                            <div className="mt-2">
                              <Form.Control
                                type="tel"
                                name="phoneNumber"
                                value={profileData.phoneNumber}
                                onChange={handleProfileChange}
                                pattern="[6-9][0-9]{9}"
                                placeholder="Enter 10-digit mobile number"
                                className="mb-2"
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleProfileSubmit}
                                disabled={loading || !profileData.phoneNumber}
                              >
                                {loading ? 'Adding...' : 'Add Phone'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="security-section mb-4">
                      <h6>Login Activity</h6>
                      <div className="security-item">
                        <div className="security-info">
                          <strong>Last Login</strong>
                          <br />
                          <small className="text-muted">
                            {user?.lastLogin ? 
                              formatDate(user.lastLogin) : 
                              'Login information not available'
                            }
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="security-section">
                      <h6>Account Actions</h6>
                      <div className="d-grid gap-2">
                        <Button
                          variant="danger"
                          onClick={handleLogoutClick}
                          className="logout-all-devices-btn"
                        >
                          Logout from All Devices
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Container>
      
      {/* Gender Modal */}
      <Modal show={showGenderModal} onHide={() => setShowGenderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Gender</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            {[
              { value: '', label: 'Prefer not to say' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ].map(option => (
              <ListGroup.Item
                key={option.value}
                action
                onClick={() => {
                  setProfileData(prev => ({ ...prev, gender: option.value }));
                  setShowGenderModal(false);
                }}
                active={profileData.gender === option.value}
              >
                {option.label}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
      
      {/* Address Type Modal */}
      <Modal show={showAddressTypeModal} onHide={() => setShowAddressTypeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Address Type</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            {[
              { value: 'home', label: 'Home' },
              { value: 'work', label: 'Work' },
              { value: 'other', label: 'Other' }
            ].map(option => (
              <ListGroup.Item
                key={option.value}
                action
                onClick={() => {
                  setAddressData(prev => ({ ...prev, type: option.value }));
                  setShowAddressTypeModal(false);
                }}
                active={addressData.type === option.value}
              >
                {option.label}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
      
      <ConfirmModal
        show={showDeleteAddressModal}
        onHide={() => setShowDeleteAddressModal(false)}
        onConfirm={handleDeleteAddressConfirm}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      
      <ConfirmModal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout from all devices?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Profile;

