import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import { useAppContext } from '../../context/AppContext';
import {  FaFireAlt } from 'react-icons/fa';
import './Login.css'

const Login = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const navigate = useNavigate();
  const { login } = useAppContext();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.sendOTP(formData.email);
      
      // Show OTP in development mode
      if (response.otp && process.env.NODE_ENV === 'development') {
        setSuccess(`${response.message} (Dev OTP: ${response.otp})`);
      } else {
        setSuccess(response.message);
      }
      
      setOtpSent(true);
      setStep(2);
    } catch (error) {
      setError(error.message || 'Failed to send OTP. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.otp) {
      setError('Please enter the OTP');
      return;
    }

    if (formData.otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.verifyOTP(
        formData.email, 
        formData.otp, 
        formData.name
      );
      
      if (response.user && response.token) {
        await login(response.user);
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => navigate('/'), 1000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      if (error.attemptsLeft !== undefined) {
        setError(`${error.message} (${error.attemptsLeft} attempts left)`);
      } else {
        setError(error.message || 'Invalid OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await authService.sendOTP(formData.email);
      
      // Show OTP in development mode
      if (response.otp && process.env.NODE_ENV === 'development') {
        setSuccess(`OTP resent successfully (Dev OTP: ${response.otp})`);
      } else {
        setSuccess('OTP resent successfully');
      }
    } catch (error) {
      if (error.retryAfter) {
        setError(`Please wait ${error.retryAfter} seconds before requesting another OTP`);
      } else {
        setError(error.message || 'Failed to resend OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="log">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <FaFireAlt className="logo-icon sparkle" />
                <h2 className="text-primary">Sindhu Crackers</h2>
                <p className="text-muted">
                  {step === 1 ? 'Enter your email to get started' : 'Enter the OTP sent to your email'}
                </p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {step === 1 ? (
                <Form onSubmit={handleSendOTP}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                    />
                  </Form.Group>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                                                <Spinner size="sm" className="me-2" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </Form>
              ) : (
                <Form onSubmit={handleVerifyOTP}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-light"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Enter OTP</Form.Label>
                    <Form.Control
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      autoComplete="one-time-code"
                      required
                    />
                    <Form.Text className="text-muted">
                      Check your email for the 6-digit verification code
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Your Name (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                    />
                  </Form.Group>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>

                  <div className="text-center">
                    <Button 
                      variant="link" 
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="p-0"
                    >
                      Didn't receive OTP? Resend
                    </Button>
                  </div>

                  <div className="text-center mt-3">
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => {
                        setStep(1);
                        setOtpSent(false);
                        setError('');
                        setSuccess('');
                      }}
                      size="sm"
                    >
                      ← Change Email
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;

