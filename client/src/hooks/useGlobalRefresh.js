import { useEffect } from 'react';

export const useGlobalRefresh = (refreshFunction, dependencies = []) => {
  useEffect(() => {
    // Listen for global refresh events
    const handleGlobalRefresh = () => {
      if (refreshFunction) {
        refreshFunction();
      }
    };

    // Listen for various update events
    const events = [
      'globalRefresh',
      'categoryUpdated',
      'categoryCreated', 
      'categoryDeleted',
      'productUpdated',
      'productCreated',
      'productDeleted',
      'orderUpdated',
      'orderCreated',
      'forceRefresh'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleGlobalRefresh);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleGlobalRefresh);
      });
    };
  }, [refreshFunction, ...dependencies]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (refreshFunction) {
        refreshFunction();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshFunction]);

  // Refresh on page focus
  useEffect(() => {
    const handleFocus = () => {
      if (refreshFunction) {
        refreshFunction();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshFunction]);
};