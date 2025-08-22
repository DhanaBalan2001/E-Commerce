import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './bundlePage.css';

const BundlePage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppContext();
  const toast = useToast();

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await api.get('/bundles', {
        params: { _t: Date.now() }
      });
      setBundles(response.data);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      toast.error('Failed to load bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMore = (bundle) => {
    setSelectedBundle(bundle);
    setShowModal(true);
  };

  const handleAddToCart = async (bundle) => {
    if (!user) {
      toast.error('Please login to add bundles to cart');
      return;
    }
    
    try {
      await api.post('/cart/add-bundle', {
        bundleId: bundle._id,
        quantity: 1
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(`Bundle "${bundle.name}" added to cart!`);
      
    } catch (error) {
      console.error('Error adding bundle to cart:', error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Failed to add bundle to cart. Please try again.');
    }
  };

  return (
    <div className="products-page">
      {/* Page Header */}
      <div className="products-header">
        <Container>
          <Row>
            <Col>
              <div className="products-header-content">
                <h1 className="products-page-title">Our Bundles</h1>
                <p className="products-page-subtitle">
                  Discover our specially curated cracker bundles at amazing prices
                </p>
                <div className="products-breadcrumb">
                  <Link to="/" className="breadcrumb-link">Home</Link>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-current">Bundles</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4">
        {/* Results Header */}
        <div className="results-header">
          <Row className="align-items-center">
            <Col>
              <h4>Bundle Offers</h4>
              <p className="mb-0 text-muted">
                Showing {bundles.length} bundle{bundles.length !== 1 ? 's' : ''}
              </p>
            </Col>
          </Row>
        </div>

        {/* Bundle Cards Grid */}
        <Row>
          {loading ? (
            <Col className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </Col>
          ) : bundles.length === 0 ? (
            <Col className="text-center py-5">
              <h5>No bundles available</h5>
              <p className="text-muted">Check back later for exciting bundle offers!</p>
            </Col>
          ) : (
            bundles.map(bundle => (
            <Col lg={3} md={4} sm={6} xs={12} key={bundle._id} className="mb-3">
              <Card className="bundle-card h-100">
                <Card.Body className="bundle-card-body d-flex flex-column">
                  <div className="bundle-price-tag">
                    📦 {bundle.name}
                  </div>
                  
                  <p className="bundle-description">
                    {bundle.description}
                  </p>
                  
                  {/* Bundle Items */}
                  <div className="bundle-items-section flex-grow-1">
                    <div className="bundle-items-title">What's Included</div>
                    <div className="bundle-items-list">
                      {Array.from({ length: 3 }, (_, index) => {
                        const cracker = bundle.crackers[index];
                        return (
                          <div key={index} className="bundle-item">
                            <span className="bundle-item-name">
                              {cracker ? cracker.name : 'Additional Item'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* View More button */}
                    <button
                      className="bundle-view-more"
                      onClick={() => handleViewMore(bundle)}
                    >
                      View Items
                    </button>
                  </div>

                    {/* Desktop Add to Cart Button */}
                  <div className="d-md-none d-flex justify-content-center gap-2 mt-2">
                    <div className="bundle-price-section text-center me-2">
                      <h5 className="bundle-price mb-0">₹{bundle.price}</h5>
                    </div>
                  </div>
                  
                  <div className="d-none d-md-block">
                    <div className="bundle-price-section text-center mt-2 mb-2">
                      <h4 className="bundle-price mb-0">₹{bundle.price}</h4>
                    </div>
                  </div>
                  
                  {/* Mobile View Button */}
                  <div className="d-md-none d-flex justify-content-center gap-2 mt-2">
                    <Button
                      className="bundle-view-mobile"
                      onClick={() => handleViewMore(bundle)}
                    >
                      View
                    </Button>
                    <Button
                      className="bundle-add-to-cart"
                      onClick={() => handleAddToCart(bundle)}
                    >
                      Add
                    </Button>
                  </div>
                  
                
                  
                  <div className="d-none d-md-flex justify-content-center mt-3">
                    <Button
                      className="bundle-add-to-cart"
                      onClick={() => handleAddToCart(bundle)}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
          )}
        </Row>
      </Container>

      {/* View More Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="bundle-modal">
        <Modal.Header closeButton>
          <Modal.Title>₹{selectedBundle?.price} {selectedBundle?.name} - Complete List</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            {selectedBundle?.crackers.map((cracker, index) => (
              <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                <span>{cracker.name}</span>
                <span className="bundle-item-quantity">Qty: {cracker.quantity}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="bundle-add-to-cart"
            onClick={() => {
              handleAddToCart(selectedBundle);
              setShowModal(false);
            }}
          >
            Add to Cart
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BundlePage;