import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { adminAuthService } from '../../../services';
import './adminlogin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const navigate = useNavigate();

  // Check if admin is already logged in
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await adminAuthService.login(formData.email, formData.password);
      console.log('Login successful:', response);
      
      // Force navigation to dashboard
      window.location.href = '/admin/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await adminAuthService.forgotPassword(forgotEmail);
      setResetMessage('Password reset OTP sent to your email');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h2 className="login-title">🔐 Admin Login</h2>
          <p className="login-subtitle">Access admin dashboard</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter admin email"
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                className="form-control"
                required
              />
              {formData.password.length > 0 && (
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn"
          >
            Login
          </button>
        </form>

        <div className="forgot-password">
          <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}>
            Forgot Password?
          </a>
        </div>

        <div className="back-to-home">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            ← Back to Shop
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal show={showForgotPassword} onHide={() => setShowForgotPassword(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resetMessage ? (
            <div>
              <Alert variant="success">{resetMessage}</Alert>
              <Button 
                variant="primary" 
                onClick={() => {
                  setShowForgotPassword(false);
                  navigate('/admin/reset-password');
                }}
              >
                Go to Reset Password Page
              </Button>
            </div>
          ) : (
            <Form onSubmit={handleForgotPassword}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset OTP'}
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminLogin;