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
  Tabs
} from 'react-bootstrap';
import { FaSave, FaUser, FaLock } from 'react-icons/fa';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';

const AdminProfile = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/profile');
      setProfileData(response.data.admin || {});
    } catch (error) {
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      setLoading(true);
      await api.put('/admin/profile', profileData);
      toast.success('Profile updated successfully');
      fetchAdminProfile(); // Refresh data
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await api.put('/admin/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="admin-profile">
      <Row className="mb-4">
        <Col>
          <h2>My Profile</h2>
          <p className="text-muted">Manage your account settings</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                className="mb-4"
              >
                <Tab eventKey="profile" title={<><FaUser className="me-2" />Profile</>}>
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

                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Update Profile
                        </>
                      )}
                    </Button>
                  </Form>
                </Tab>

                <Tab eventKey="password" title={<><FaLock className="me-2" />Password</>}>
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
                          <Form.Text className="text-muted">
                            Password must be at least 6 characters long
                          </Form.Text>
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

                        <Button 
                          type="submit" 
                          variant="warning"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Changing...
                            </>
                          ) : (
                            <>
                              <FaLock className="me-2" />
                              Change Password
                            </>
                          )}
                        </Button>
                      </Col>
                      <Col md={6}>
                        <Alert variant="info">
                          <h6>Password Requirements:</h6>
                          <ul className="mb-0">
                            <li>At least 6 characters long</li>
                            <li>Use a strong, unique password</li>
                            <li>Don't reuse old passwords</li>
                          </ul>
                        </Alert>
                      </Col>
                    </Row>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminProfile;