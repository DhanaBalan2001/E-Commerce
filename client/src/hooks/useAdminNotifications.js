import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export const useAdminNotifications = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Check for pending payments every 30 seconds
    const interval = setInterval(checkPendingPayments, 30000);
    checkPendingPayments(); // Initial check
    
    return () => clearInterval(interval);
  }, []);

  const checkPendingPayments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders?paymentStatus=verification_pending&count=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const data = await response.json();
      const newCount = data.count || 0;
      
      if (newCount > pendingCount && pendingCount > 0) {
        // New payment verification required
        toast.info(`🔔 New payment verification required! (${newCount} pending)`, {
          onClick: () => window.location.href = '/admin/orders?filter=verification_pending'
        });
        
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('Payment Verification Required', {
            body: `${newCount} orders awaiting payment verification`,
            icon: '/favicon.ico'
          });
        }
      }
      
      setPendingCount(newCount);
    } catch (error) {
      console.error('Failed to check pending payments:', error);
    }
  };

  return { pendingCount };
};