import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './helpcenter.css';

const HelpCenter = () => {
  const navigate = useNavigate();
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Help Center', path: '/help' }
  ];

  return (
    <div className="help-center-container">
      

      <div className="help-header">
        <h1>Help Center</h1>
        <p>Get help with your orders and account</p>
      </div>

      <div className="help-content">
        <div className="help-section">
          <h2>🔥 Product Safety</h2>
          <p>Always handle crackers with care. Keep away from children under 8 years.</p>
        </div>

        <div className="help-section">
          <h2>📦 Orders & Delivery</h2>
          <p>Orders are delivered within 2-3 business days. Track your order in your account.</p>
        </div>

        <div className="help-section">
          <h2>⚠️ Safety Guidelines</h2>
          <p>Use crackers in open areas only. Keep water nearby. Follow all safety instructions.</p>
        </div>

        <div className="help-section">
          <h2>👤 Account Help</h2>
          <p>Having trouble with your account? Contact us at sindhucrackers@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
