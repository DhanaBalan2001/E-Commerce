import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCopy, FaCheckCircle, FaUpload, FaQrcode } from 'react-icons/fa';
import QRCode from 'qrcode';
import './bankdetails.css';

const BankDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const orderData = location.state?.orderData;
  const orderTotal = location.state?.orderTotal;

  if (!orderData || !orderTotal) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Invalid Access</h4>
          <p>Please complete your order through the checkout process.</p>
          <Button variant="outline-danger" onClick={() => navigate('/cart')}>
            Go to Cart
          </Button>
        </Alert>
      </Container>
    );
  }

  const bankDetails = {
    bankName: "Union Bank Of India",
    accountName: "GiriDharan B",
    accountNumber: "04562279566",
    ifscCode: "UBIN0911381",
    branch: "No. 12c Gandhi Road Behind Bus Stand Sivakasi-626123",
    upiId: "sindhucrackers@axl"
  };

  useEffect(() => {
    if (orderTotal) {
      generateQRCode();
    }
  }, [orderTotal]);

  const generateQRCode = async () => {
    try {
      const upiString = `upi://pay?pa=${bankDetails.upiId}&pn=${encodeURIComponent(bankDetails.accountName)}&am=${orderTotal}&cu=INR&tn=${encodeURIComponent('Order Payment - Sindhu Crackers')}`;
      const qrUrl = await QRCode.toDataURL(upiString);
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload only image files');
        return;
      }
      setScreenshot(file);
      setError('');
    }
  };

  const handleSubmitPayment = async () => {
    if (!screenshot) {
      setError('Please upload payment screenshot');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('orderData', JSON.stringify(orderData));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/create-manual-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Order placed successfully! Your payment is under verification.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/orders', { 
            state: { 
              message: 'Order placed successfully! We will verify your payment and confirm your order within 24 hours.' 
            }
          });
        }, 3000);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bank-details-page">
      <Container className="py-4">
        <div className="page-header mb-4 text-center">
          <h2>Complete Your Payment</h2>
          <p className="text-muted">Transfer the amount to our bank account and upload payment proof</p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <FaCheckCircle className="me-2" />
            {success}
          </Alert>
        )}

        <Row className="justify-content-center">
          <Col lg={8} className="mb-4">
            {/* Payment Amount */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Payment Amount</h5>
              </Card.Header>
              <Card.Body className="text-center">
                <h2 className="text-primary mb-0">₹{orderTotal.toFixed(2)}</h2>
                <p className="text-muted">Total amount to be paid</p>
              </Card.Body>
            </Card>

            {/* QR Code Payment */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <FaQrcode className="me-2" />
                  Quick UPI Payment
                </h5>
              </Card.Header>
              <Card.Body className="text-center">
                {qrCodeUrl ? (
                  <div className="qr-code-container">
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI Payment QR Code" 
                      className="qr-code-image mb-3"
                    />
                    <p className="text-muted mb-2">
                      <strong>Scan with any UPI app to pay ₹{orderTotal.toFixed(2)}</strong>
                    </p>
                    <small className="text-muted">
                      Google Pay • PhonePe • Paytm • BHIM • Bank Apps
                    </small>
                  </div>
                ) : (
                  <Spinner animation="border" size="sm" />
                )}
              </Card.Body>
            </Card>

            {/* Bank Details */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Manual Bank Transfer Details</h5>
              </Card.Header>
              <Card.Body>
                <div className="bank-detail-item">
                  <label>Bank Name:</label>
                  <div className="detail-value">
                    <span>{bankDetails.bankName}</span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => copyToClipboard(bankDetails.bankName, 'bankName')}
                    >
                      {copied === 'bankName' ? <FaCheckCircle /> : <FaCopy />}
                    </Button>
                  </div>
                </div>

                <div className="bank-detail-item">
                  <label>Account Name:</label>
                  <div className="detail-value">
                    <span>{bankDetails.accountName}</span>
                    <Button 
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => copyToClipboard(bankDetails.accountName, 'accountName')}
                    >
                      {copied === 'accountName' ? <FaCheckCircle /> : <FaCopy />}
                    </Button>
                  </div>
                </div>

                <div className="bank-detail-item">
                  <label>Account Number:</label>
                  <div className="detail-value">
                    <span className="account-number">{bankDetails.accountNumber}</span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => copyToClipboard(bankDetails.accountNumber, 'accountNumber')}
                    >
                      {copied === 'accountNumber' ? <FaCheckCircle /> : <FaCopy />}
                    </Button>
                  </div>
                </div>

                <div className="bank-detail-item">
                  <label>IFSC Code:</label>
                  <div className="detail-value">
                    <span>{bankDetails.ifscCode}</span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => copyToClipboard(bankDetails.ifscCode, 'ifscCode')}
                    >
                      {copied === 'ifscCode' ? <FaCheckCircle /> : <FaCopy />}
                    </Button>
                  </div>
                </div>

                <div className="bank-detail-item">
                  <label>Branch:</label>
                  <div className="detail-value">
                    <span>{bankDetails.branch}</span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => copyToClipboard(bankDetails.branch, 'branch')}
                    >
                      {copied === 'branch' ? <FaCheckCircle /> : <FaCopy />}
                    </Button>
                  </div>
                </div>

                <div className="bank-detail-item">
                  <label>UPI ID:</label>
                  <div className="detail-value">
                    <span>{bankDetails.upiId}</span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => copyToClipboard(bankDetails.upiId, 'upiId')}
                    >
                      {copied === 'upiId' ? <FaCheckCircle /> : <FaCopy />}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Upload Screenshot */}
            <Card>
              <Card.Header>
                <h5 className="mb-0">Upload Payment Screenshot</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">
                  After making the payment, please upload a screenshot or photo of your payment confirmation.
                </p>
                
                <Form.Group className="mb-3">
                  <Form.Label>Payment Screenshot *</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    required
                  />
                  <Form.Text className="text-muted">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </Form.Text>
                </Form.Group>

                {screenshot && (
                  <div className="screenshot-preview mb-3">
                    <img 
                      src={URL.createObjectURL(screenshot)} 
                      alt="Payment Screenshot" 
                      className="preview-image"
                    />
                    <p className="text-success mt-2">
                      <FaCheckCircle className="me-1" />
                      Screenshot selected: {screenshot.name}
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="sticky-top">
              <Card.Header>
                <h5 className="mb-0">Payment Instructions</h5>
              </Card.Header>
              <Card.Body>
                <ol className="payment-steps">
                  <li><strong>Option 1:</strong> Scan QR code above with any UPI app</li>
                  <li><strong>Option 2:</strong> Transfer ₹{orderTotal.toFixed(2)} to bank account</li>
                  <li>Take a screenshot of the payment confirmation</li>
                  <li>Upload the screenshot using the form</li>
                  <li>Click "Submit Payment Proof"</li>
                  <li>We'll verify and confirm your order within 24 hours</li>
                </ol>

                <Alert variant="info" className="mt-3">
                  <small>
                    <strong>Note:</strong> Your order will be processed only after payment verification. 
                    You'll receive an email confirmation once verified.
                  </small>
                </Alert>

                <div className="d-flex flex-column align-items-center">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100 mt-3"
                    onClick={handleSubmitPayment}
                    disabled={uploading || !screenshot}
                  >
                    {uploading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaUpload className="me-2" />
                        Submit Payment Proof
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline-secondary"
                    size="lg"
                    className="w-100 mt-2"
                    onClick={() => navigate('/checkout')}
                    disabled={uploading}
                  >
                    Back to Checkout
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default BankDetails;