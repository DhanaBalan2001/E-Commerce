import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import '../Bundles/bundlePage.css';

const GiftBoxPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedGiftBox, setSelectedGiftBox] = useState(null);
  const [giftBoxes, setGiftBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, updateCartCount, loadCartCount } = useAppContext();
  const toast = useToast();

  useEffect(() => {
    fetchGiftBoxes();
  }, []);

  const fetchGiftBoxes = async () => {
    try {
      const response = await api.get('/giftboxes', {
        params: { _t: Date.now() }
      });
      setGiftBoxes(response.data);
    } catch (error) {
      console.error('Error fetching gift boxes:', error);
      toast.error('Failed to load gift boxes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMore = (giftBox) => {
    setSelectedGiftBox(giftBox);
    setShowModal(true);
  };

  const handleAddToCart = async (giftBox) => {
    if (!user) {
      toast.error('Please login to add gift boxes to cart');
      return;
    }
    
    try {
      await api.post('/cart/add-giftbox', {
        giftBoxId: giftBox._id,
        quantity: 1
      });
      
      // Update cart count
      await loadCartCount();
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(`Gift Box "${giftBox.name}" added to cart!`);
      
    } catch (error) {
      console.error('Error adding gift box to cart:', error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Failed to add gift box to cart. Please try again.');
    }
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <Container>
          <Row>
            <Col>
              <div className="products-header-content">
                <h1 className="products-page-title">Our Gift Boxes</h1>
                <p className="products-page-subtitle">
                  Discover our specially curated cracker gift boxes perfect for gifting
                </p>
                <div className="products-breadcrumb">
                  <Link to="/" className="breadcrumb-link">Home</Link>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-current">Gift Boxes</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4">
        <div className="results-header">
          <Row className="align-items-center">
            <Col>
              <h4>Gift Box Collection</h4>
              <p className="mb-0 text-muted">
                Showing {giftBoxes.length} gift box{giftBoxes.length !== 1 ? 'es' : ''}
              </p>
            </Col>
          </Row>
        </div>

        <Row>
          {loading ? (
            <Col className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </Col>
          ) : giftBoxes.length === 0 ? (
            <Col className="text-center py-5">
              <h5>No gift boxes available</h5>
              <p className="text-muted">Check back later for exciting gift box offers!</p>
            </Col>
          ) : (
            giftBoxes.map(giftBox => (
            <Col lg={3} md={4} sm={6} xs={12} key={giftBox._id} className="mb-3">
              <Card className="bundle-card h-100">
                <Card.Body className="bundle-card-body d-flex flex-column">
                  <div className="bundle-price-tag">
                    🎁 {giftBox.name}
                  </div>
                  
                  <p className="bundle-description">
                    {giftBox.description}
                  </p>
                  
                  <div className="bundle-items-section flex-grow-1">
                    <div className="bundle-items-title">What's Included</div>
                    <div className="bundle-items-list">
                      {Array.from({ length: 3 }, (_, index) => {
                        const cracker = giftBox.crackers[index];
                        return (
                          <div key={index} className="bundle-item">
                            <span className="bundle-item-name">
                              {cracker ? cracker.name : 'Additional Item'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                  
                    
                    <button
                      className="bundle-view-more"
                      onClick={() => handleViewMore(giftBox)}
                    >
                      View Items
                    </button>
                  </div>
                  
                  <div className="d-md-none d-flex justify-content-center gap-2 mt-2">
                    <Button
                      className="bundle-view-mobile"
                      onClick={() => handleViewMore(giftBox)}
                    >
                      View
                    </Button>
                    <Button
                      className="bundle-add-to-cart"
                      onClick={() => handleAddToCart(giftBox)}
                    >
                      Add
                    </Button>
                  </div>

                    <div className="bundle-price-section text-center mt-2 mb-2">
                      <h4 className="bundle-price mb-0">₹{giftBox.price}</h4>
                    </div>
                  
                  <div className="d-none d-md-flex justify-content-center mt-3">
                    <Button
                      className="bundle-add-to-cart"
                      onClick={() => handleAddToCart(giftBox)}
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="bundle-modal">
        <Modal.Header closeButton>
          <Modal.Title>₹{selectedGiftBox?.price} Gift Box - Complete List</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            {selectedGiftBox?.crackers.map((cracker, index) => (
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
              handleAddToCart(selectedGiftBox);
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

export default GiftBoxPage;