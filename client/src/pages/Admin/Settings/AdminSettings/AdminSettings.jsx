import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert,
  Spinner,
  Tab,
  Tabs,
  Badge
} from 'react-bootstrap';
import { FaSave, FaUser, FaLock, FaCog, FaPlus, FaTrash, FaSignOutAlt } from 'react-icons/fa';
import { useToast } from '../../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { adminAuthService } from '../../../../services/adminAuthService';
import ConfirmModal from '../../../../components/common/ConfirmModal';
import './adminsettings.css';

const AdminManagement = ({ detailsOnly = false, createOnly = false }) => {
  const toast = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(createOnly);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', phone: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  useEffect(() => {
    if (!createOnly) {
      fetchAdmins();
    }
  }, [createOnly]);

  const fetchAdmins = async () => {
    try {
      const endpoint = detailsOnly ? '/admin/admins/details' : '/admin/admins';
      const response = await api.get(endpoint, { timeout: 8000 });
      setAdmins(response.data.admins || []);
    } catch (error) {
      setAdmins([]);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/admin/admins', { ...newAdmin, role: 'admin' }, { timeout: 8000 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Admin created successfully');
      setNewAdmin({ name: '', email: '', password: '', phone: '' });
      setShowCreateForm(false);
      fetchAdmins();
    } catch (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (adminId) => {
    setAdminToDelete(adminId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/admin/admins/${adminToDelete}`, { timeout: 8000 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setShowDeleteModal(false);
      setAdminToDelete(null);
    }
  };

  if (createOnly) {
    return (
      <Card className="mb-4">
        <Card.Body>
          <h6>Create New Admin</h6>
          <Form onSubmit={handleCreateAdmin}>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                    minLength={6}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="form-action-buttons">
              <Button type="submit" variant="success" disabled={loading}>
                {loading ? 'Creating...' : 'Create Admin'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {!detailsOnly && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            <FaPlus className="me-2" />
            {showCreateForm ? 'Cancel' : 'Create Admin'}
          </Button>
        </div>
      )}

      {detailsOnly && (
        <div className="mb-4">
          <h5>Admin Details</h5>
        </div>
      )}

      {!detailsOnly && showCreateForm && (
        <Card className="mb-4">
          <Card.Body>
            <h6>Create New Admin</h6>
            <Form onSubmit={handleCreateAdmin}>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                      minLength={6}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={newAdmin.phone}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="form-action-buttons">
                <Button type="submit" variant="success" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Admin'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      <div className="admins-table-card">
        <div className="table-header">
          <h5 className="table-title">{detailsOnly ? 'All Admin Details' : 'Existing Admins'}</h5>
          <small className="table-subtitle">Showing {admins.length} admin{admins.length !== 1 ? 's' : ''}</small>
        </div>
        <div className="table-body">
          {admins.length === 0 ? (
            <div className="text-center py-5">
              <h5>No admins found</h5>
              <p className="text-muted">No admin accounts available</p>
            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="table-responsive desktop-table">
              <table className="table admins-table">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin._id}>
                      <td>
                        <div>
                          <h6 className="mb-1">{admin.name}</h6>
                          <small className="text-muted">ID: {admin._id}</small>
                        </div>
                      </td>
                      <td>{admin.email}</td>
                      <td>{admin.phone || 'N/A'}</td>
                      <td>
                        <Badge bg={admin.role === 'super_admin' ? 'danger' : 'primary'}>
                          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </Badge>
                      </td>
                      <td>
                        <small>{new Date(admin.createdAt).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {!detailsOnly && admin.role !== 'super_admin' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteClick(admin._id)}
                            >
                              <FaTrash />
                            </Button>
                          )}
                          {detailsOnly && (
                            <span className="text-muted">
                              {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="mobile-admins-grid">
              {admins.map(admin => (
                <div key={admin._id} className="mobile-admin-card">
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-title">{admin.name}</div>
                      <div className="mobile-card-id">ID: {admin._id}</div>
                    </div>
                    <Badge bg={admin.role === 'super_admin' ? 'danger' : 'primary'}>
                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </Badge>
                  </div>
                  
                  <div className="mobile-card-body">
                    <div className="mobile-card-field mobile-field-left">
                      <div className="mobile-field-label">Email</div>
                      <div className="mobile-field-value">{admin.email}</div>
                    </div>
                    
                    <div className="mobile-card-field mobile-field-right">
                      <div className="mobile-field-label">Phone</div>
                      <div className="mobile-field-value">{admin.phone || 'N/A'}</div>
                    </div>
                    
                    <div className="mobile-card-field mobile-field-left">
                      <div className="mobile-field-label">Created</div>
                      <div className="mobile-field-value">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {!detailsOnly && admin.role !== 'super_admin' && (
                    <div className="mobile-card-actions">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(admin._id)}
                      >
                        <FaTrash /> Delete
                      </Button>
                    </div>
                  )}      
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>
      
      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Admin"
        message="Are you sure you want to delete this admin? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

const AdminSettings = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
    
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    if (profileData.role === 'admin') {
      setActiveTab('admin');
    } else if (profileData.role === 'super_admin') {
      setActiveTab('superAdmin');
    }
  }, [profileData.role]);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/profile', { timeout: 8000 });
      const adminData = response.data.admin || {};
      setProfileData(adminData);
    } catch (error) {
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/admin/profile', profileData, { timeout: 8000 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Profile updated successfully');
      fetchAdminProfile(); // Refresh data
    } catch (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error(error.response?.data?.message || 'Failed to update profile');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await api.put('/admin/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { timeout: 8000 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error(error.response?.data?.message || 'Failed to change password');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminAuthService.logout();
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      toast.success('Logged out successfully');
      navigate('/admin/login');
    }
  };

  return (
    <div className="admin-settings">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">Admin Settings</h1>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="settings-card">
        <div className="settings-content">
          <Tabs
            activeKey={activeTab}
            onSelect={(tab) => setActiveTab(tab)}
            className="mb-4"
          >


            {/* Admin Tab - Only for Regular Admin */}
            {profileData.role === 'admin' && (
              <Tab eventKey="admin" title={<><FaUser className="me-2" />Admin</>}>
              <Tabs defaultActiveKey="adminProfile" className="mb-3">
                <Tab eventKey="adminProfile" title="Profile">
                  <Form onSubmit={handleProfileSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileData.name || ''}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              name: e.target.value
                            }))}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            value={profileData.email || ''}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              email: e.target.value
                            }))}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            value={profileData.phone || ''}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              phone: e.target.value
                            }))}
                            placeholder="Enter phone number"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="form-action-buttons">
                      <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Profile'}
                      </Button>
                      <Button variant="danger" onClick={handleLogout} className="ms-2">
                        <FaSignOutAlt className="me-2" />
                        Logout
                      </Button>
                    </div>
                  </Form>
                </Tab>
                
                <Tab eventKey="adminPassword" title="Password">
                  <Form onSubmit={handlePasswordSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Current Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              currentPassword: e.target.value
                            }))}
                            required
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              newPassword: e.target.value
                            }))}
                            minLength={6}
                            required
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              confirmPassword: e.target.value
                            }))}
                            required
                          />
                        </Form.Group>

                        <div className="form-action-buttons">
                          <Button type="submit" variant="warning" disabled={loading}>
                            {loading ? 'Changing...' : 'Change Password'}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Tab>
              </Tabs>
              </Tab>
            )}

            {/* Super Admin Tab - Only for Super Admin */}
            {profileData.role === 'super_admin' && (
            <Tab eventKey="superAdmin" title={<><FaUser className="me-2" />Super Admin</>}>
              <Tabs defaultActiveKey="superAdminProfile" className="mb-3">
                <Tab eventKey="superAdminProfile" title="Profile">
                  <Form onSubmit={handleProfileSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileData.name || ''}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              name: e.target.value
                            }))}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            value={profileData.email || ''}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              email: e.target.value
                            }))}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            value={profileData.phone || ''}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              phone: e.target.value
                            }))}
                            placeholder="Enter phone number"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="form-action-buttons">
                      <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Profile'}
                      </Button>
                      <Button variant="danger" onClick={handleLogout} className="ms-2">
                        <FaSignOutAlt className="me-2" />
                        Logout
                      </Button>
                    </div>
                  </Form>
                </Tab>
                
                <Tab eventKey="superAdminPassword" title="Password">
                  <Form onSubmit={handlePasswordSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Current Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              currentPassword: e.target.value
                            }))}
                            required
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              newPassword: e.target.value
                            }))}
                            minLength={6}
                            required
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              confirmPassword: e.target.value
                            }))}
                            required
                          />
                        </Form.Group>

                        <div className="form-action-buttons">
                          <Button type="submit" variant="warning" disabled={loading}>
                            {loading ? 'Changing...' : 'Change Password'}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Tab>
                
                <Tab eventKey="addAdmin" title="Add Admin">
                  <AdminManagement />
                </Tab>
              </Tabs>
              </Tab>
            )}

            {/* Details Tab - Only for Super Admin */}
            {profileData.role === 'super_admin' && (
              <Tab eventKey="details" title={<><FaUser className="me-2" />Details</>}>
                <AdminManagement detailsOnly={true} />
              </Tab>
            )}

          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;