import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './shippinginfo.css';

const ShippingInfo = () => {
  const navigate = useNavigate();
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Shipping Info', path: '/shipping' }
  ];

  return (
    <div className="shipping-info-container">
     

      <div className="shipping-header">
        <h1>Shipping Information</h1>
        <p>Simple shipping details for your cracker orders</p>
      </div>

      <div className="shipping-content">
        <div className="shipping-section">
          <h2>🚚 Standard Shipping</h2>
          <p>Regular delivery service for all orders. Processing time may vary.</p>
        </div>

        <div className="shipping-section">
          <h2>⏰ Express Shipping</h2>
          <p>Faster delivery option available. Additional charges may apply.</p>
        </div>

        <div className="shipping-section">
          <h2>💰 Shipping Rates</h2>
          <p>Shipping costs calculated based on location and order weight.</p>
        </div>

        <div className="shipping-section">
          <h2>📞 Order Tracking</h2>
          <p>Track your order status and delivery updates online.</p>
        </div>

        <div className="shipping-section">
          <h2>🌍 International Delivery</h2>
          <p>We ship to selected countries worldwide. Customs duties and taxes may apply.</p>
        </div>
      </div>
    </div>
  );
};

export default ShippingInfo;