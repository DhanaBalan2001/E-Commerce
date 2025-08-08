import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const OrderTracking = ({ orderId }) => {
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_BASE_URL);
        
        // Join order room for real-time updates
        socket.emit('join-order', orderId);

        // Listen for status updates
        socket.on('orderStatusUpdate', (data) => {
            if (data.orderId === orderId) {
                setTracking(prev => ({
                    ...prev,
                    status: data.status,
                    statusHistory: [...(prev?.statusHistory || []), {
                        status: data.status,
                        note: data.note,
                        timestamp: data.timestamp
                    }]
                }));
            }
        });

        // Fetch initial tracking data
        const fetchTracking = async () => {
            try {
                const response = await axios.get(`/api/orders/${orderId}/tracking`);
                setTracking(response.data.tracking);
            } catch (error) {
                console.error('Error fetching tracking:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTracking();

        return () => {
            socket.emit('leave-order', orderId);
            socket.disconnect();
        };
    }, [orderId]);

    if (loading) return <div>Loading tracking...</div>;
    if (!tracking) return <div>No tracking data found</div>;

    const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentStepIndex = statusSteps.indexOf(tracking.status);

    return (
        <div className="order-tracking">
            <h3>Order #{tracking.orderNumber}</h3>
            
            <div className="tracking-progress">
                {statusSteps.map((step, index) => (
                    <div 
                        key={step}
                        className={`step ${index <= currentStepIndex ? 'completed' : ''}`}
                    >
                        <div className="step-circle">{index + 1}</div>
                        <div className="step-label">{step}</div>
                    </div>
                ))}
            </div>

            {tracking.trackingInfo?.trackingNumber && (
                <div className="tracking-info">
                    <p><strong>Tracking Number:</strong> {tracking.trackingInfo.trackingNumber}</p>
                    <p><strong>Carrier:</strong> {tracking.trackingInfo.carrier}</p>
                </div>
            )}

            <div className="status-history">
                <h4>Status History</h4>
                {tracking.statusHistory?.map((status, index) => (
                    <div key={index} className="status-item">
                        <span className="status">{status.status}</span>
                        <span className="timestamp">
                            {new Date(status.timestamp).toLocaleString()}
                        </span>
                        {status.note && <p className="note">{status.note}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderTracking;