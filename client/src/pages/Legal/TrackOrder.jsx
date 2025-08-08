import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import './trackorder.css';

const TrackOrder = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();



  const generateTimeline = (order) => {
    const timeline = [
      {
        status: 'Order Placed',
        date: new Date(order.createdAt).toLocaleDateString(),
        time: new Date(order.createdAt).toLocaleTimeString(),
        location: 'Online',
        completed: true
      }
    ];

    if (order.status !== 'pending') {
      timeline.push({
        status: order.status === 'confirmed' ? 'Order Confirmed' : 'Order Processed',
        date: new Date(order.updatedAt).toLocaleDateString(),
        time: new Date(order.updatedAt).toLocaleTimeString(),
        location: 'Processing Center',
        completed: true
      });
    }

    if (['processing', 'shipped', 'delivered'].includes(order.status)) {
      timeline.push({
        status: 'Processing',
        date: new Date(order.updatedAt).toLocaleDateString(),
        time: new Date(order.updatedAt).toLocaleTimeString(),
        location: 'Warehouse',
        completed: true
      });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      timeline.push({
        status: 'Shipped',
        date: new Date(order.updatedAt).toLocaleDateString(),
        time: new Date(order.updatedAt).toLocaleTimeString(),
        location: 'Distribution Center',
        completed: true
      });
    }

    if (order.status === 'delivered') {
      timeline.push({
        status: 'Delivered',
        date: new Date(order.updatedAt).toLocaleDateString(),
        time: new Date(order.updatedAt).toLocaleTimeString(),
        location: 'Your Address',
        completed: true
      });
    } else {
      // Add pending steps
      if (!['shipped', 'delivered'].includes(order.status)) {
        timeline.push({
          status: 'Shipped',
          date: 'Pending',
          time: 'Pending',
          location: 'Distribution Center',
          completed: false
        });
      }
      
      timeline.push({
        status: 'Delivered',
        date: 'Pending',
        time: 'Pending',
        location: 'Your Address',
        completed: false
      });
    }

    return timeline;
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTrackingResult(null);
    
    try {
      const response = await orderService.trackOrder(orderNumber, email);
      
      if (response.success && response.order) {
        const order = response.order;
        const trackingData = {
          orderNumber: order.orderNumber,
          status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          estimatedDelivery: order.status === 'delivered' ? 
            new Date(order.updatedAt).toLocaleDateString() : 
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          carrier: order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Express Delivery',
          trackingNumber: order._id,
          shippingAddress: `${order.shippingAddress.name}, ${order.shippingAddress.address || order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
          items: order.items.map(item => ({
            name: item.product?.name || item.name,
            quantity: item.quantity,
            price: `₹${item.price}`,
            image: item.product?.images?.[0] || item.image
          })),
          timeline: generateTimeline(order)
        };
        
        setTrackingResult(trackingData);
      } else {
        throw new Error('Order not found. Please check your order number and email.');
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      alert(error.message || 'Failed to track order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#28a745';
      case 'out for delivery': return '#ffc107';
      case 'in transit': return '#007bff';
      case 'shipped': return '#17a2b8';
      case 'processing': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const handleClear = () => {
    setTrackingResult(null);
    setOrderNumber('');
    setEmail('');
    setTrackingNumber('');
  };

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Track Order', path: '/track-order' }
  ];

  return (
    <div className="track-order-container">
      

      <div className="track-header">
        <h1>Track Your Order</h1>
        <p>Enter your tracking information to see the latest updates on your order</p>
      </div>

      <div className="tracking-form-section">
        <form className="tracking-form" onSubmit={handleTrackOrder}>
          <div className="form-tabs">
            <div className="tab-content">
              <div className="form-group">
                <label htmlFor="orderNumber">Order Number</label>
                <input
                  type="text"
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Enter your order number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="trackingNumber">Tracking Number (Optional)</label>
                <input
                  type="text"
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number if available"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="track-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Tracking...
              </>
            ) : (
              'Track Order'
            )}
          </button>
        </form>
      </div>

      {trackingResult && (
        <div className="tracking-results">
          <div className="order-summary">
            <div className="summary-header">
              <h2>Order #{trackingResult.orderNumber}</h2>
              <div className="order-status">
                {trackingResult.status}
              </div>
            </div>
            
            <div className="summary-details">
              <div className="detail-item">
                <span className="label">Carrier:</span>
                <span className="value">{trackingResult.carrier}</span>
              </div>
              <div className="detail-item">
                <span className="label">Tracking Number:</span>
                <span className="value">{trackingResult.trackingNumber}</span>
              </div>
              <div className="detail-item">
                <span className="label">Estimated Delivery:</span>
                <span className="value">{trackingResult.estimatedDelivery}</span>
              </div>
              <div className="detail-item">
                <span className="label">Shipping Address:</span>
                <span className="value">{trackingResult.shippingAddress}</span>
              </div>
            </div>
          </div>

          <div className="order-items">
            <h3>Order Items</h3>
            <div className="items-list">
              {trackingResult.items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">Qty: {item.quantity}</span>
                  <span className="item-price">{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="tracking-timeline">
            <h3>Tracking Timeline</h3>
            <div className="timeline">
              {trackingResult.timeline.map((event, index) => (
                <div key={index} className={`timeline-item ${event.completed ? 'completed' : 'pending'}`}>
                  <div className="timeline-marker">
                    {event.completed ? '✓' : '○'}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-status">{event.status}</div>
                    <div className="timeline-details">
                      <span className="timeline-date">{event.date}</span>
                      <span className="timeline-time">{event.time}</span>
                      <span className="timeline-location">{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="clear-section">
            <button className="clear-btn" onClick={handleClear}>
              Clear Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
