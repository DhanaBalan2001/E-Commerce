import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../context/ToastContext';
import { useAppContext } from '../../context/AppContext';
import { Modal } from 'react-bootstrap';
import './productdetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const { data: productData, loading, error } = useProduct(id);
  const { addToCart, addToCartLoading } = useCart();
  const { isAuthenticated } = useAppContext();
  const toast = useToast();

  const product = productData?.product;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.warning('Please login to add items to cart');
      return;
    }

    try {
      // Scroll to top immediately for desktop
      if (window.innerWidth > 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      await addToCart.mutate({ productId: id, quantity });
      
      // Check if desktop view (screen width > 768px)
      if (window.innerWidth > 768) {
        // Show success alert for 3 seconds
        setShowSuccessAlert(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setShowSuccessAlert(false), 3000);
      } else {
        // Mobile view - use toast
        toast.success('Product added to cart successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add product to cart');
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-warning">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="text-warning">☆</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-muted">☆</span>);
    }

    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading product details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Product</Alert.Heading>
          <p>{error.message}</p>
          <Button as={Link} to="/products" variant="outline-danger">
            Back to Products
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Product Not Found</Alert.Heading>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <Button as={Link} to="/products" variant="outline-warning">
            Back to Products
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="product-detail-page">
      {/* Success Alert for Desktop */}
      {showSuccessAlert && (
        <div className="fixed-top" style={{ zIndex: 1050, padding: '20px' }}>
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <strong>Success!</strong> Product added to cart successfully!
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowSuccessAlert(false)}
            ></button>
          </div>
        </div>
      )}
      
      <Container className="py-4">
        {/* Back Button */}
        <div className="back-button-container mb-3">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => navigate(-1)}
            className="back-btn"
          >
            <span className="back-text">← Back</span>
            <span className="back-icon">←</span>
          </Button>
        </div>
        
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/products">Products</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to={`/products?category=${product.category?.slug || product.category}`}>
                {product.category?.name || product.category}
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <Row>
          {/* Product Images */}
          <Col lg={6} className="mb-4">
            <div className="product-images">
              {/* Main Image */}
              <div className="main-image-container mb-3">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${product.images[selectedImageIndex]?.url}` || '/placeholder-image.svg'}
                    alt={product.name}
                    className="main-product-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.svg';
                    }}
                  />
                ) : (
                  <div className="no-image-placeholder-large">
                    <span>No Image Available</span>
                  </div>
                )}
                {product.isFeatured && (
                  <Badge bg="warning" className="featured-badge-large">
                    Featured
                  </Badge>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="thumbnail-images">
                  <Row>
                    {product.images.map((image, index) => (
                      <Col key={index} xs={3} className="mb-2">
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL}${image.url}` || '/placeholder-image.svg'}
                          alt={`${product.name} ${index + 1}`}
                          className={`thumbnail-image ${
                            selectedImageIndex === index ? 'active' : ''
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.svg';
                          }}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </div>
          </Col>

          {/* Product Info */}
          <Col lg={6}>
            <div className="product-info">
              <h1 className="product-title">{product.name}</h1>
              
              {/* Rating */}
              <div className="product-rating mb-3">
                <div className="stars">
                  {renderStars(product.ratings?.average || 0)}
                  <span className="ms-2">
                    ({product.ratings?.count || 0} reviews)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="product-price mb-4">
                <span className="current-price">₹{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="original-price ms-3">₹{product.originalPrice}</span>
                    <Badge bg="success" className="ms-2">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="stock-status mb-4">
                {product.stock > 0 ? (
                  <Badge bg="success" className="stock-badge">
                    ✓ In Stock ({product.stock} available)
                  </Badge>
                ) : (
                  <Badge bg="danger" className="stock-badge">
                    ✗ Out of Stock
                  </Badge>
                )}
              </div>

              {/* Product Details */}
              <div className="product-details mb-4">
                <div className="details-list">
                  <div className="detail-item">
                    <span className="detail-label">Category name</span>
                    <span className="detail-colon">:</span>
                    <span className="detail-value">{product.category?.name || product.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">item Weight</span>
                    <span className="detail-colon">:</span>
                    <span className="detail-value">{product.weight}g</span>
                  </div>
                   <div className="detail-item">
                    <span className="detail-label">Sub Category</span>
                    <span className="detail-colon">:</span>
                    <span className="detail-value">{product.subCategory || 'General'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Age Restriction</span>
                    <span className="detail-colon">:</span>
                    <span className="detail-value">{product.ageRestriction}+ years</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="quantity-selector mb-4">
                  <Form.Label>Quantity:</Form.Label>
                  <div className="quantity-controls">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Form.Control
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                      min="1"
                      max={product.stock}
                      className="quantity-input"
                    />
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </Button>
                  </div>
                  <small className="text-muted">
                    Min: {product.minOrderQuantity}, Max: {Math.min(product.maxOrderQuantity, product.stock)}
                  </small>
                  <div className="button-container">
                  <Button
                    variant="primary"
                    size="lg"
                    className="action-btn add-to-cart-btn"
                    disabled={product.stock === 0 || addToCartLoading}
                    onClick={handleAddToCart}
                  >
                    {addToCartLoading ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant="success"
                    size="lg"
                    className="action-btn buy-now-btn"
                    disabled={product.stock === 0 || addToCartLoading || quantity === 0}
                    onClick={async () => {
                      if (quantity === 0) {
                        toast.warning('Please select quantity');
                        return;
                      }
                      try {
                        await addToCart.mutate({ productId: id, quantity });
                        navigate('/cart');
                      } catch (error) {
                        toast.error('Failed to add product to cart');
                      }
                    }}
                  >
                    {addToCartLoading ? 'Adding...' : 'Buy Now'}
                  </Button>
                </div>
                </div>
              )}


              {/* Safety Warning */}
              <Alert variant="warning" className="safety-alert">
                <strong>⚠️ Safety Warning:</strong> Handle with care. Keep away from children. 
                Use only in open areas. Follow all safety instructions.
              </Alert>
            </div>
          </Col>
        </Row>

        {/* Product Details Tabs */}
        <Row className="mt-5">
          <Col>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="product-tabs"
            >
              {/* Description Tab */}
              <Tab eventKey="description" title="Description">
                <div className="tab-content p-4">
                  <h5>Product Description</h5>
                  <p>{product.description}</p>
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="product-tags mt-3">
                      <strong>Tags: </strong>
                      {product.tags.map((tag, index) => (
                        <Badge key={index} bg="secondary" className="me-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Tab>

               {/* Reviews Tab */}
              <Tab eventKey="reviews" title={`Reviews (${product.reviews?.length || 0})`}>
                <div className="tab-content p-4">
                  <h5>Customer Reviews</h5>
                  
                  {/* Reviews Summary */}
                  <div className="reviews-summary mb-4">
                    <Row>
                      <Col md={4}>
                        <div className="rating-overview text-center">
                          <div className="average-rating">
                            <span className="rating-number">{(product.ratings?.average || 0).toFixed(1)}</span>
                            <div className="stars">
                             

                              {renderStars(product.ratings?.average || 0)}
                            </div>
                            <small className="text-muted">
                              Based on {product.ratings?.count || 0} reviews
                            </small>
                          </div>
                        </div>
                      </Col>
                      <Col md={8}>
                        <div className="rating-breakdown">
                          {[5, 4, 3, 2, 1].map(star => {
                            const count = product.reviews?.filter(review => review.rating === star).length || 0;
                            const percentage = product.reviews?.length ? (count / product.reviews.length) * 100 : 0;
                            return (
                              <div key={star} className="rating-bar mb-1">
                                <span className="rating-label">{star} ★</span>
                                <div className="progress mx-2" style={{ height: '8px' }}>
                                  <div 
                                    className="progress-bar bg-warning" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="rating-count">({count})</span>
                              </div>
                            );
                          })}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Individual Reviews */}
                  <div className="reviews-list">
                    {product.reviews && product.reviews.length > 0 ? (
                      product.reviews.map((review, index) => (
                        <Card key={index} className="review-card mb-3">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <strong>{review.user?.name || 'Anonymous'}</strong>
                                <div className="review-rating">
                                  {renderStars(review.rating)}
                                </div>
                              </div>
                              <small className="text-muted">
                                {formatDate(review.createdAt)}
                              </small>
                            </div>
                            {review.comment && (
                              <p className="review-comment mb-0">{review.comment}</p>
                            )}
                          </Card.Body>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">No reviews yet. Be the first to review this product!</p>
                      </div>
                    )}
                  </div>

                  {/* Add Review Button */}
                  {isAuthenticated && (
                    <div className="text-center mt-4">
                      <Link to={`/products/${id}/write-review`} className="btn btn-outline-primary">
                        Write a Review
                      </Link>
                    </div>
                  )}
                </div>
              </Tab>

              {/* Specifications Tab */}
              <Tab eventKey="specifications" title="Specifications">
                <div className="tab-content p-4">
                  <h5>Product Specifications</h5>
                  <div className="specifications-list">
                    <div className="spec-item">
                      <strong>Weight:</strong> {product.weight}g
                    </div>
                    <div className="spec-item">
                      <strong>Category:</strong> {product.category?.name || product.category}
                    </div>
                    <div className="spec-item">
                      <strong>Sub Category:</strong> {product.subCategory || 'General'}
                    </div>
                    <div className="spec-item">
                      <strong>Age Restriction:</strong> {product.ageRestriction}+ years
                    </div>
                    <div className="spec-item">
                      <strong>Min Order Quantity:</strong> {product.minOrderQuantity}
                    </div>
                    <div className="spec-item">
                      <strong>Max Order Quantity:</strong> {product.maxOrderQuantity}
                    </div>
                    {product.dimensions && (
                      <div className="spec-item">
                        <strong>Dimensions:</strong> {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                      </div>
                    )}
                  </div>
                </div>
              </Tab>

              {/* Safety Instructions Tab */}
              <Tab eventKey="safety" title="Safety Instructions">
                <div className="tab-content p-4">
                  <h5>Safety Instructions</h5>
                  {product.safetyInstructions && product.safetyInstructions.length > 0 ? (
                    <ul className="safety-list">
                      {product.safetyInstructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ul>
                  ) : (
                    <div>
                      <p><strong>General Safety Guidelines:</strong></p>
                      <ul className="safety-list">
                        <li>Always supervise children when using fireworks</li>
                        <li>Use only in open areas away from buildings and dry vegetation</li>
                        <li>Keep water or sand nearby for emergencies</li>
                        <li>Never attempt to relight a "dud" firework</li>
                        <li>Light one firework at a time</li>
                        <li>Never hold fireworks in your hand when lighting</li>
                        <li>Store in a cool, dry place away from heat sources</li>
                      </ul>
                    </div>
                  )}
                </div>
              </Tab>

             
            </Tabs>
          </Col>
        </Row>
      </Container>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Write a Review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="reviewRating">
              <Form.Label>Rating</Form.Label>
              <Form.Select
                value={reviewRating}
                onChange={(e) => setReviewRating(parseInt(e.target.value))}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Terrible</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mt-3" controlId="reviewComment">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              toast.success('Review submitted!');
              setShowReviewModal(false);
              setReviewRating(5);
              setReviewComment('');
            }}
          >
            Submit Review
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductDetail;

