import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Nav, Navbar, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBars, FaTachometerAlt, FaBoxOpen, FaList, FaShoppingCart, FaUsers, FaCog, FaUser, FaArrowLeft, FaGift } from 'react-icons/fa';
import api from '../../../services/api';
import './adminlayout.css';

const AdminLayout = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get('/admin/profile');
      setAdminData(response.data.admin);
    } catch (error) {
      setAdminData(null);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const handleNavClick = () => {
    closeSidebar();
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="admin-layout">
      {/* Advanced Navbar */}
      <nav className="admin-navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <button className="back-btn" onClick={goBack}>
              <FaArrowLeft />
              <span className="back-text">Back</span>
            </button>
          </div>
          
          <div className="navbar-center">
            <Link to="/admin/dashboard" className="navbar-brand">
              <span className="brand-icon">👨‍💼</span>
              <span className="brand-text">Admin Center</span>
            </Link>
          </div>
          
          <div className="navbar-right">
            <div className="admin-profile">
              <FaUser className="profile-icon" />
              <span className="admin-role">{adminData?.name || adminData?.email || 'Admin'}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="admin-content">
        {/* Sidebar */}
        <div className={`admin-sidebar ${sidebarVisible ? 'show' : ''}`}>
          <Nav className="flex-column p-3">
            <Nav.Link 
              as={Link} 
              to="/admin/dashboard"
              className="admin-nav-link"
              onClick={handleNavClick}
            >
              <FaTachometerAlt className="me-2" />
              Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/products"
              className="admin-nav-link"
              onClick={handleNavClick}
            >
              <FaBoxOpen className="me-2" />
              Products
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/categories"
              className="admin-nav-link"
              onClick={handleNavClick}
            >
              <FaList className="me-2" />
              Categories
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/bundles"
              className="admin-nav-link"
              onClick={handleNavClick}
            >
              <FaGift className="me-2" />
              Bundles
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/giftboxes"
              className="admin-nav-link"
              onClick={handleNavClick}
            >
              <FaGift className="me-2" />
              Gift Boxes
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/orders"
              className="admin-nav-link"
              onClick={handleNavClick}
            >
              <FaShoppingCart className="me-2" />
              Orders
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/users"
              className="admin-nav-link"
              onClick={handleNavClick}
            >
              <FaUsers className="me-2" />
              Users
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/admin/settings"
              className="admin-nav-link"
              onClick={handleNavClick}
            >
              <FaCog className="me-2" />
              Settings
            </Nav.Link>
          </Nav>
        </div>
        
        {/* Sidebar Overlay */}
        {sidebarVisible && (
          <div className="sidebar-overlay" onClick={closeSidebar}></div>
        )}

        {/* Main Content */}
        <div className={`admin-main ${sidebarVisible ? 'shifted' : ''}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;