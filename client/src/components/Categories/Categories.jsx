import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { getImageUrl } from '../../utils/imageUrl';
import './Categories.css';
import CrackerLoader from '../common/CrackerLoader';

const Categories = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { data, loading, error } = useCategories();
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const categories = data?.categories || [];

  const getCategoryIcon = (categorySlug) => {
    const icons = {
      'sparklers': '🎇',
      'rockets': '🚀',
      'bombs': '💥',
      'flower-pots': '🌸',
      'ground-spinners': '🌀',
      'aerial-shots': '🎆',
      'gift-boxes': '🎁',
      'safe-crackers': '🔥',
      'fountains': '⛲',
      'wheels': '🎡',
      'pencils': '✏️',
      'twinkling-stars': '✨',
      'novelties': '🎪',
      'garlands': '🎊'
    };
    return icons[categorySlug] || '🎆';
  };

  return (
    <div className="categories-page">
      {/* Page Header */}
      <div className="categories-header">
        <Container>
          <Row>
            <Col>
              <div className="categories-header-content">
                <h1 className="categories-page-title">Browse by Category</h1>
                <p className="categories-page-subtitle">
                  Explore our comprehensive range of crackers and fireworks organized by categories
                </p>
                <div className="categories-breadcrumb">
                  <Link to="/" className="breadcrumb-link">Home</Link>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-current">Categories</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-5">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <CrackerLoader size="lg" text="Loading categories..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="danger" className="error-message">
            <h5>Error Loading Categories</h5>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Alert>
        )}

        {/* Categories Grid */}
        {!loading && !error && (
          <>
            {categories.length === 0 ? (
              <div className="text-center py-5">
                <h4>No categories found</h4>
                <p className="text-muted">Categories will appear here once they are added to the database</p>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    console.log('🔄 Retrying...');
                    window.location.reload();
                  }}
                >
                  Retry Loading
                </Button>
              </div>
            ) : (
              <>
                <Row>
                  {categories.map((category, index) => (
                    <Col lg={3} md={4} sm={6} xs={6} key={category._id || index} className="mb-4">
                      <Card className="category-card h-100">
                        <Card.Body className="text-center d-flex flex-column">
                          <div className="category-icon-container mb-3">
                            <img
                              src={category.image ? `${import.meta.env.VITE_API_BASE_URL}${category.image}` : '/placeholder-image.jpg'}
                              alt={category.name}
                              className="category-image"
                              style={{
                                maxWidth: '100%',
                                height: 'auto',
                                maxHeight: isMobile ? '80px' : '120px',
                                objectFit: 'contain'
                              }}
                            />
                          </div>
                          
                          <Card.Title className="category-title">
                            {category.name || 'Unknown Category'}
                          </Card.Title>
                          
                          <Card.Text className="category-description flex-grow-1">
                            {category.description || `Explore our ${(category.name || 'category').toLowerCase()} collection with various options and premium quality products.`}
                          </Card.Text>
                          
                          <div className="category-actions mt-auto">
                            <Button
                              as={Link}
                              to={`/products?category=${category.slug}`}
                              className="category-btn w-100"
                              variant="primary"
                              style={isMobile ? {fontSize: '0.6rem'} : {}}
                            >
                              Explore Category
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Sub-categories Section - Hidden on mobile */}
                {categories.some(cat => cat.subCategories && cat.subCategories.length > 0) && (
                  <Row className="mt-5 d-none d-md-block">
                    <Col>
                      <h3 className="section-title text-center mb-4">Sub-Categories</h3>
                      {categories.map(category => (
                        category.subCategories && category.subCategories.length > 0 && (
                          <div key={category._id} className="subcategory-section mb-4">
                            <h4 className="subcategory-parent-title">
                              {category.name}
                            </h4>
                            <Row>
                              {category.subCategories.map((subCat, index) => (
                                <Col 
                                  lg={2} 
                                  md={3} 
                                  sm={4} 
                                  xs={6} 
                                  key={subCat._id || index} 
                                  className="mb-3"
                                >
                                  <Card className="subcategory-card">
                                    <Card.Body className="text-center p-2">
                                      <div className="subcategory-icon mb-1">
                                        <span className="subcategory-emoji" style={{fontSize: '2rem'}}>
                                          {getCategoryIcon(subCat.slug)}
                                        </span>
                                      </div>
                                      <Card.Title className="subcategory-title">
                                        <div className="subcategory-title-text">
                                          {subCat.name}
                                        </div>
                                      </Card.Title>
                                      <div className="subcategory-button-container">
                                        <Button
                                          as={Link}
                                          to={`/products?category=${category.slug}&subCategory=${subCat.slug}`}
                                          size="sm"
                                          variant="outline-primary"
                                          className="subcategory-btn w-100"
                                        >
                                          View
                                        </Button>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )
                      ))}
                    </Col>
                  </Row>
                )}
              </>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default Categories;
