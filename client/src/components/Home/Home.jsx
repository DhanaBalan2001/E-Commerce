import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Carousel } from 'react-bootstrap';
import CrackerLoader from '../common/CrackerLoader';
import { getImageUrl } from '../../utils/imageUrl';
import { 
  FaShoppingCart, 
  FaPhone, 
  FaShieldAlt, 
  FaHeadset, 
  FaAward, 
  FaStar,
  FaMapMarkerAlt,
  FaEnvelope,
  FaFacebook,
  FaGoogle,
  FaInstagram,
  FaWhatsapp,
  FaFireAlt
} from 'react-icons/fa';
import './home.css';

const Home = () => {
  // State for dynamic data from backend
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Floating Bubbles Animation Component
  const ElegantAnimations = () => {
    return (
      <div className="elegant-animations">
        {/* Bright Floating Bubbles - Bottom to Top */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`bubble-${i}`}
            className={`floating-bubble style-${(i % 3) + 1}`}
          />
        ))}
      </div>
    );
  };



  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setError(null);
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`);
        const data = await response.json();
        
        // Handle different response structures
        if (data.success !== false) {
          setCategories(data.categories || data || []);
        } else {
          throw new Error(data.message || 'Failed to fetch categories');
        }
        
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch bestseller products from backend
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/featured`);
        const data = await response.json();
        
        // Handle different response structures
        if (data.success !== false) {
          setBestSellers(data.products || data || []);
        } else {
          throw new Error(data.message || 'Failed to fetch featured products');
        }
        
      } catch (err) {
        console.error('Error fetching bestsellers:', err);
        setError(err.message);
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  // Fetch recent reviews from backend
  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        setReviewsLoading(true);
        setError(null);
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/reviews/recent?limit=6`);
        const data = await response.json();
        
        // Handle different response structures
        if (data.success !== false) {
          setReviews(data.reviews || data || []);
        } else {
          throw new Error(data.message || 'Failed to fetch reviews');
        }
        
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchRecentReviews();
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = window.innerWidth <= 768 ? 100 : 0;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar 
        key={i} 
        className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'} 
      />
    ));
  };

  const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'sparklers': '🎇',
      'rockets': '🚀',
      'bombs': '💥',
      'flower-pots': '🌸',
      'ground-spinners': '🌀',
      'aerial-shots': '🎆',
      'gift-boxes': '🎁',
      'safe-crackers': '🔥'
    };
    return icons[categoryName] || '🎆';
  };

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      return 'Recent';
    }
  };

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactForm),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setContactSuccess(true);
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setContactSuccess(false), 5000);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Contact form error:', error);
    } finally {
      setContactLoading(false);
    }
  };

  // Debug component to show current state
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    
    
  };

  return (
    <div className="home-page">
      <DebugInfo />
      
      {/* Floating Bubbles Animation */}
      <ElegantAnimations />
      
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={6} md={6} sm={12}>
              <div className="hero-content">
                <h1 className="hero-title">
                  Light Up Your <span className="highlight">Celebrations</span>
                </h1>
                <p className="hero-subtitles">
                 Discover premium quality crackers and fireworks for all your special occasions. 
                  Safe, authentic, and delivered right to your doorstep.
                </p>
                <div className="hero-buttons">
                  <Button 
                    className="btn-shop-now"
                    size="lg"
                    onClick={() => window.location.href = '/products'}
                  >
                    <FaShoppingCart className="me-2" />
                    Shop Now
                  </Button>
                    <Button 
                    className="btn-shop-now"
                    size="lg"
                    onClick={() => scrollToSection('contact')}
                  >
                    <FaShoppingCart className="me-2" />
                    Contact us
                  </Button>
                </div>
              </div>
            </Col>
            <Col lg={6} md={6} sm={12}>
              <div className="hero-image">
                <img src="/images/Hero.jpg" alt="Hero" className="img-fluid" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section py-5">
        <Container>
          <Row>
            <Col lg={12} className="text-center">
              <h2 className="section-title">About Our Shop</h2>
               <h4 className="section-subtitle">
               Celebrating Joy Since 2010
              </h4>
          </Col>
          </Row>
          <Row className="align-items-center">
            <Col lg={6} md={6} sm={12}>
              <div className="about-content">
                <p className="about-text">
                  At Sindhu Crackers, we believe every celebration deserves to be spectacular. 
                  For over a decade, we've been India's trusted partner in bringing joy, 
                  excitement, and unforgettable moments to millions of families.
                </p>
                <p className="about-text">
                  Our commitment to quality, safety, and customer satisfaction has made us 
                  the preferred choice for festivals, weddings, and special occasions. 
                  We source our products from certified manufacturers and ensure every 
                  cracker meets the highest safety standards.
                </p>
                <div className="about-stats">
                  <div className="stat-item">
                    <h4>3+</h4>
                    <p>Years Experience</p>
                  </div>
                  <div className="stat-item">
                    <h4>50K+</h4>
                    <p>Happy Customers</p>
                  </div>
                  <div className="stat-item">
                    <h4>500+</h4>
                    <p>Products</p>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={6} md={6} sm={12}>
              <div className="about-image">
                <img src="/images/About.jpg" alt="About Us" className="img-fluid" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-section py-5">
        <Container>
          <Row>
            <Col lg={12} className="text-center mb-5">
              <h2 className="section-title">Why Choose Our Store?</h2>
              <p className="section-subtitle">
                Making your celebrations safe, spectacular, and unforgettable.
              </p>
            </Col>
          </Row>
          <Row>
            <Col lg={3} md={6} sm={12} className="mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <FaShieldAlt />
                </div>
                <h4>100% Safe & Certified</h4>
                <p>All our products are tested and certified for safety standards</p>
              </div>
            </Col>
            <Col lg={3} md={6} sm={12} className="mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <FaAward />
                </div>
                <h4>Premium Quality</h4>
                <p>Sourced from trusted manufacturers with quality guarantee</p>
              </div>
            </Col>
            <Col lg={3} md={6} sm={12} className="mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <FaHeadset />
                </div>
                <h4>24/7 Support</h4>
                <p>Round-the-clock customer support for all your queries</p>
              </div>
            </Col>
            <Col lg={3} md={6} sm={12} className="mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <FaFireAlt />
                </div>
                <h4>Fast Delivery</h4>
                <p>Quick and secure delivery to your doorstep nationwide</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Categories Section */}
      <section id="categories" className="categories-section py-5">
        <Container>
          <Row>
            <Col lg={12} className="text-center mb-5">
              <h2 className="section-title">Shop by Categories</h2>
              <p className="section-subtitle">
                Explore our wide range of crackers and fireworks
              </p>
            </Col>
          </Row>
          
          {categoriesLoading ? (
            <div className="text-center py-5">
              <CrackerLoader size="lg" text="Loading categories..." />
            </div>
          ) : error ? (
            <Row>
              <Col lg={12} className="text-center">
                <div className="error-message">
                  <p className="text-danger">Error loading categories: {error}</p>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </Col>
            </Row>
          ) : categories.length === 0 ? (
            <Row>
              <Col lg={12} className="text-center">
                <p>No categories available at the moment.</p>
              </Col>
            </Row>
                      ) : (
            <Row>
              {categories.slice(0, 4).map((category) => (
                <Col lg={3} md={6} sm={12} key={category._id} className="mb-4">
                  <Card className="category-card h-100">
                    <Card.Body className="text-center">
                      <div className="category-icon">
                        {category.image ? (
                          <img 
                            src={`${import.meta.env.VITE_API_BASE_URL}${category.image}`}
                            alt={category.name}
                            className="category-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : (
                          <span className="category-emoji">
                            {getCategoryIcon(category.slug)}
                          </span>
                        )}
                      </div>
                      <Card.Title className="category-title">{category.name}</Card.Title>
                      <Button 
                        className="category-btn-mobile mt-3"
                        size="sm"
                        onClick={() => {
                          window.location.href = `/products?category=${category.slug}`;
                        }}
                      >
                        Explore
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Best Sellers Section */}
      <section className="bestsellers-section py-5">
        <Container>
          <Row>
            <Col lg={12} className="text-center mb-5">
              <h2 className="section-title">Best Sellers</h2>
              <p className="section-subtitle">
                Most popular products loved by our customers
              </p>
            </Col>
          </Row>
          
          {loading ? (
            <div className="text-center py-5">
              <CrackerLoader size="lg" text="Loading best sellers..." />
            </div>
          ) : error ? (
            <Row>
              <Col lg={12} className="text-center">
                <div className="error-message">
                  <p className="text-danger">Failed to load products: {error}</p>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </Col>
            </Row>
          ) : bestSellers.length === 0 ? (
            <Row>
              <Col lg={12} className="text-center">
                <p>No featured products available at the moment.</p>
              </Col>
            </Row>
          ) : (
            <Row>
              {bestSellers.slice(0, 4).map((product) => (
                <Col lg={3} md={6} sm={6} xs={6} key={product._id} className="mb-4">
                  <Card className={`product-card ${!isMobile ? 'h-100' : ''}`}>
                    {isMobile ? (
                      <Card.Body className="text-center d-flex flex-column">
                        <div className="product-icon-container mb-3">
                          <img
                            src={product.images?.[0]?.url ? `${import.meta.env.VITE_API_BASE_URL}${product.images[0].url}` : '/images/placeholder-product.jpg'}
                            alt={product.name}
                            className="product-image"
                          />
                        </div>
                        
                      
                        
                        <div className="product-actions mt-auto">
                          <Button
                            className="product-btn w-100"
                            variant="primary"
                            style={{fontSize: '0.6rem'}}
                            disabled={product.stock === 0}
                            onClick={() => {
                              window.location.href = '/products';
                            }}
                          >
                            {product.stock > 0 ? 'Shop Now' : 'Out of Stock'}
                          </Button>
                        </div>
                      </Card.Body>
                    ) : (
                      <>
                        <div className="product-image">
                          {product.images && product.images.length > 0 ? (
                            product.images.length === 1 ? (
                              <img 
                                src={product.images?.[0]?.url ? `${import.meta.env.VITE_API_BASE_URL}${product.images[0].url}` : '/images/placeholder-product.jpg'}
                                alt={product.name}
                                className="product-img"
                              />
                            ) : (
                              <Carousel 
                                interval={3000} 
                                controls={true} 
                                indicators={false}
                                className="product-carousel"
                              >
                                {product.images.map((image, index) => (
                                  <Carousel.Item key={index}>
                                    <img 
                                      src={image?.url ? `${import.meta.env.VITE_API_BASE_URL}${image.url}` : '/images/placeholder-product.jpg'}
                                      alt={`${product.name} - Image ${index + 1}`}
                                      className="product-img"
                                    />
                                  </Carousel.Item>
                                ))}
                              </Carousel>
                            )
                          ) : (
                            <img 
                              src="/images/placeholder-product.jpg" 
                              alt={product.name}
                              className="product-img"
                            />
                          )}
                          
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="product-badge">
                              {calculateDiscount(product.originalPrice, product.price)}% OFF
                            </div>
                          )}
                          
                          {product.images && product.images.length > 1 && (
                            <div className="image-count-badge">
                              {product.images.length} Photos
                            </div>
                          )}
                        </div>
                        
                        <Card.Body>
                          <Card.Title className="product-title">{product.name}</Card.Title>
                          <Button 
                            className="add-to-cart-btn w-100 mt-3"
                            disabled={product.stock === 0}
                            onClick={() => {
                              window.location.href = '/products';
                            }}
                          >
                            {product.stock > 0 ? 'Shop Now' : 'Out of Stock'}
                          </Button>
                        </Card.Body>
                      </>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Customer Reviews Section */}
      <section className="reviews-section py-5">
        <Container>
          <Row>
            <Col lg={12} className="text-center mb-5">
              <h2 className="section-title">What Our Customers Say</h2>
              <p className="section-subtitle">
                Real reviews from our satisfied customers
              </p>
            </Col>
          </Row>
          
          {reviewsLoading ? (
            <div className="text-center py-5">
              <CrackerLoader size="lg" text="Loading reviews..." />
            </div>
          ) : reviews.length === 0 ? (
            <Row>
              <Col lg={12} className="text-center">
                <p>No reviews available at the moment.</p>
              </Col>
            </Row>
          ) : (
            <Row>
              {reviews.slice(0, 4).map((review) => (
                <Col lg={3} md={6} sm={12} key={review._id} className="mb-4">
                  <Card className="review-card h-100">
                    <Card.Body>
                      <div className="review-rating mb-3">
                        {renderStars(review.rating)}
                      </div>
                      <Card.Text className="review-comment">
                        "{review.comment}"
                      </Card.Text>
                      <div className="review-author">
                        <strong>{review.user?.name || 'Anonymous'}</strong>
                        <small className="text-muted d-block">
                          {formatDate(review.createdAt)}
                        </small>
                        {review.product && (
                          <small className="text-info d-block">
                            Product: {review.product.name}
                          </small>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section py-5">
        <Container>
          <Row>
            <Col lg={12} className="text-center mb-5">
              <h2 className="section-title">Get in Touch</h2>
              <p className="section-subtitle">
                Have questions? We're here to help!
              </p>
            </Col>
          </Row>
          <Row>
            <Col lg={6} md={12} className="mb-4">
              <div className="contact-form-wrapper">
                <h4 className="mb-4">Send us a Message</h4>
                {contactSuccess && (
                  <div className="alert alert-success mb-3">
                    Thank you! Your message has been sent successfully.
                  </div>
                )}
                <form onSubmit={handleContactSubmit}>
                  <Row>
                    <Col md={6}>
                      <div className="form-group mb-3">
                        <input 
                          type="text" 
                          name="name"
                          value={contactForm.name}
                          onChange={handleContactChange}
                          className="form-control" 
                          placeholder="Your Name" 
                          required 
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="form-group mb-3">
                        <input 
                          type="email" 
                          name="email"
                          value={contactForm.email}
                          onChange={handleContactChange}
                          className="form-control" 
                          placeholder="Your Email" 
                          required 
                        />
                      </div>
                    </Col>
                  </Row>
                  <div className="form-group mb-3">
                    <input 
                      type="text" 
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactChange}
                      className="form-control" 
                      placeholder="Subject" 
                      required 
                    />
                  </div>
                  <div className="form-group mb-3">
                    <textarea 
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactChange}
                      className="form-control" 
                      rows="5" 
                      placeholder="Your Message" 
                      required
                    ></textarea>
                  </div>
                  <Button type="submit" className="contact-submit-btn" disabled={contactLoading}>
                    {contactLoading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>
            </Col>
            <Col lg={6} md={12}>
              <div className="contact-form-wrapper">
                <h4 className="mb-4">Contact Information</h4>
                <div className="contact-item">
                  <FaMapMarkerAlt className="contact-icon" />
                  <div>
                    <h5>Address</h5>
                    <p>123 Cracker Street, Festival City, FC 12345</p>
                  </div>
                </div>
                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <div>
                    <h5>Phone</h5>
                    <p>+91 98765 43210</p>
                  </div>
                </div>
                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <div>
                    <h5>Email</h5>
                    <p>sindhucrackers@gmail.com</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer Section */}
      <footer id="footer" className="footer-section">
        <div className="footer-top py-5">
          <Container>
            <Row>
              <Col lg={3} md={6} sm={12} className="mb-4">
                <div className="footer-widget">
                  <h4 className="footer-title">Sindhu Crackers</h4>
                  <p className="footer-description">
                    Your trusted partner for premium quality crackers and fireworks. 
                    Making celebrations memorable since 2010.
                  </p>
                  <div className={`social-links ${isMobile ? 'mobile-center' : ''}`}>
                    <a href="#" className="social-link">
                      <FaFacebook />
                    </a>
                    <a href="#" className="social-link">
                      <FaGoogle />
                    </a>
                    <a href="#" className="social-link">
                      <FaInstagram />
                    </a>
                  </div>
                </div>
              </Col>

              <Col lg={3} md={6} sm={12} className="mb-4 customer-service-footer-col" 
                   style={isMobile ? {flex: '0 0 50%', maxWidth: '50%'} : {}}>
                <div className="footer-widget">
                  <h6 className="footer-widget-title">Customer Service</h6>
                  <ul className="footer-links">
                  <li><a href="/faq">FAQ</a></li>
                  <li><a href="/track-order">Track Order</a></li>
                  <li><a href="/help">Help Center</a></li>
                  <li><a href="/shipping">Shipping Info</a></li>
                  <li><a href="/privacy-policy">Privacy Policy</a></li>
                  </ul>
                </div>
              </Col>
              
              

              <Col lg={3} md={6} sm={12} className="mb-4 quick-links-footer-col"
                   style={isMobile ? {flex: '0 0 50%', maxWidth: '50%'} : {}}>
                <div className="footer-widget">
                  <h6 className="footer-widget-title">Quick Links</h6>
                  <ul className="footer-links">
                    <li><a href="#about">About Us</a></li>
                    <li><a href="#categories">Categories</a></li> 
                    <li><a href="#bestsellers">Best Sellers</a></li>
                    <li><a href="#contact">Contact</a></li>
                    <li><Link to="/admin/login" className="admin-login-link">Admin Login</Link></li>
                  </ul>
                </div>
              </Col>
        
            </Row>
          </Container>
        </div>
        
        <div className="footer-bottom py-3">
        <Container>
        <Row>
          <Col lg={12} md={12} sm={12} className="text-center">
            <p className="copyright-text">
          © 2025 Sindhu Crackers. All rights reserved.
           </p>
         </Col>
          </Row>
         </Container>
        </div>
      </footer>
    </div>
  );
};

export default Home;


