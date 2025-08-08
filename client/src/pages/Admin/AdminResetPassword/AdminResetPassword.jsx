import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/reset-password', {
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      
      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/admin/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center">
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <div className="mb-3">
                  <FaLock size={48} className="text-primary" />
                </div>
                <h3>Reset Admin Password</h3>
                <p className="text-muted">Enter OTP from email and new password</p>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Reset OTP</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.otp}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      otp: e.target.value
                    }))}
                    placeholder="Enter 6-digit OTP from email"
                    required
                    maxLength={6}
                  />
                  <Form.Text className="text-muted">
                    Check your email for the 6-digit OTP
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <Form.Text className="text-muted">
                    Password must be at least 6 characters long
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    placeholder="Confirm new password"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </Form>

              <div className="text-center mt-3">
                <Button
                  variant="link"
                  onClick={() => navigate('/admin/login')}
                  className="text-decoration-none"
                >
                  Back to Login
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminResetPassword;