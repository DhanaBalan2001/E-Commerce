import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Container, Badge, Dropdown } from 'react-bootstrap';
import { FaShoppingCart, FaFireAlt, FaHome, FaBoxOpen, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartCount } from '../../hooks/useCart';
import { useAppContext } from '../../context/AppContext';
import { authService } from '../../services';
import './navbar.css';

const CustomNavbar = () => {
  const cartCount = useCartCount();
  const { user, logout } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navbarRef = useRef(null);

  // Close navbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target) && expanded) {
        setExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded]);

  // Function to check if current path matches the nav link
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    if (path !== '/' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  // Function to get nav link classes
  const getNavLinkClass = (path) => {
    return `nav-link-custom ${isActive(path) ? 'active' : ''}`;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      logout();
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
    setExpanded(false);
  };

  const handleDropdownClick = (path) => {
    navigate(path);
    setExpanded(false);
  };

  const handleLogoutClick = async () => {
    await handleLogout();
    setExpanded(false);
  };

  return (
    <Navbar expand="lg" className="custom-navbar" fixed="top" expanded={expanded} onToggle={setExpanded} ref={navbarRef}>
      <Container>
        <Navbar.Brand onClick={() => handleNavClick('/')} className="brand-logo" style={{ cursor: 'pointer' }}>
          <FaFireAlt className="logo-icon sparkle" />
          <span className="brand-text">Sindhu Crackers</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              onClick={() => handleNavClick('/')} 
              className={getNavLinkClass('/')}
              style={{ cursor: 'pointer' }}
            >
              <FaHome /> <span>Home</span>
            </Nav.Link>
            
            <Nav.Link 
              onClick={() => handleNavClick('/products')} 
              className={getNavLinkClass('/products')}
              style={{ cursor: 'pointer' }}
            >
              <FaBoxOpen /> <span>Products</span>
            </Nav.Link>
            
            <Nav.Link 
              onClick={() => handleNavClick('/categories')} 
              className={getNavLinkClass('/categories')}
              style={{ cursor: 'pointer' }}
            >
              <MdCategory /> <span>Categories</span>
            </Nav.Link>
            
            {user ? (
              <>
                <Nav.Link 
                  onClick={() => handleNavClick('/cart')} 
                  className={`${getNavLinkClass('/cart')} cart-link`}
                  style={{ cursor: 'pointer' }}
                >
                  <FaShoppingCart className="cart-icon" />
                  <span className="cart-text">Cart</span>
                  {cartCount > 0 && (
                    <Badge bg="danger" className="cart-badge">
                      {cartCount > 99 ? '99+' : cartCount}
                    </Badge>
                  )}
                </Nav.Link>
                
                <Dropdown align="end">
                  <Dropdown.Toggle 
                    as={Nav.Link} 
                    className={getNavLinkClass('/profile')}
                    style={{ cursor: 'pointer' }}
                  >
                    <FaUser /> <span>{user.name || user.email || 'Profile'}</span>
                  </Dropdown.Toggle>
                  
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleDropdownClick('/profile')}>
                      <FaUser className="me-2" />
                      Profile
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleDropdownClick('/orders')}>
                      <FaShoppingCart className="me-2" />
                      My Orders
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item 
                      onClick={handleLogoutClick}
                      disabled={isLoggingOut}
                    >
                      <FaSignOutAlt className="me-2" />
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <Nav.Link 
                onClick={() => handleNavClick('/login')} 
                className={getNavLinkClass('/login')}
                style={{ cursor: 'pointer' }}
              >
                <FaUser /> <span>Login</span>
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
