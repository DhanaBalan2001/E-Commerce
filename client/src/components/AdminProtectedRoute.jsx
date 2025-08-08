import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner, Container } from 'react-bootstrap';
import { adminAuthService } from '../services';

const AdminProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verify token with backend
      await adminAuthService.getCurrentAdmin();
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Admin auth check failed:', error);
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Verifying admin access...</p>
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
