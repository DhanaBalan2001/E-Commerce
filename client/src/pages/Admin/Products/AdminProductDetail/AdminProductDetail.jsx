import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Badge, 
  Button, 
  Table,
  Form,
  Alert,
  Spinner,
  Modal,
  Carousel,
  ListGroup
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash,
  FaStar,
  FaEye,
  FaEyeSlash,
  FaBox,
  FaRupeeSign
} from 'react-icons/fa';
import { useToast } from '../../../../context/ToastContext';
import { productService } from '../../../../services/productService';
import { getImageUrl } from '../../../../utils/imageUrl';
import './adminproductdetail.css';

const AdminProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const data = await productService.getProductById(productId);
      setProduct(data.product);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await productService.updateProduct(productId, { isActive: !product.isActive });
      setProduct(prev => ({ ...prev, isActive: !prev.isActive }));
      toast.success(`Product ${product.isActive ? 'hidden' : 'shown'} successfully`);
    } catch (error) {
      toast.error('Failed to update product visibility');
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await productService.deleteProduct(productId);
      toast.success('Product deleted successfully');
      navigate('/admin/products');
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    } else if (stock <= 10) {
      return <Badge bg="warning">Low Stock ({stock})</Badge>;
    } else {
      return <Badge bg="success">In Stock ({stock})</Badge>;
    }
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-warning" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-warning opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-muted" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container fluid>
        <Alert variant="danger">
          <h5>Product Not Found</h5>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline-danger" onClick={() => navigate('/admin/products')}>
            Back to Products
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-product-detail">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="product-header">
            <div className="product-title-section">
              <h2 className="product-title">{product.name}</h2>
               <div className="product-actions">
              <Button
                variant="primary"
                onClick={() => navigate(`/admin/products/${productId}/edit`)}
              >
                <FaEdit className="me-2" />
                Edit
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <FaTrash className="me-2" />
                Delete
              </Button>
            </div>
            </div>
           
          </div>
        </Col>
      </Row>

      <Row>
        {/* Product Images */}
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Product Images</h5>
            </Card.Header>
            <Card.Body className="position-relative">
              <div className="image-badges">
                {getStockBadge(product.stock)}
                <Badge bg={product.isActive ? 'success' : 'secondary'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {product.images && product.images.length > 0 ? (
                <Carousel>
                  {product.images.map((image, index) => (
                    <Carousel.Item key={index}>
                      <img
                        className="d-block w-100 product-image"
                        src={image?.url ? `${import.meta.env.VITE_API_BASE_URL}${image.url}` : '/placeholder-image.jpg'}
                        alt={`${product.name} ${index + 1}`}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              ) : (
                <div className="text-center py-5 text-muted">
                  <FaBox size={48} />
                  <p className="mt-2">No images available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Product Details */}
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Product Information</h5>
            </Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>

                  <tr>
                    <td><strong>Category:</strong></td>
                    <td>
                      <Badge bg="info">{product.category?.name || 'Uncategorized'}</Badge>
                      {product.subCategory && (
                        <Badge bg="secondary" className="ms-2">
                          {product.subCategory.name}
                        </Badge>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Price:</strong></td>
                    <td>
                      <h5 className="mb-0 text-success">
                        <FaRupeeSign />{product.price}
                      </h5>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <small className="text-muted text-decoration-line-through">
                          <FaRupeeSign />{product.originalPrice}
                        </small>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Stock:</strong></td>
                    <td>{getStockBadge(product.stock)}</td>
                  </tr>
                  <tr>
                    <td><strong>Reviews:</strong></td>
                    <td style={{ paddingLeft: '10px' }}>
                      {product.reviews?.length || 0} reviews
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Created:</strong></td>
                    <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Updated:</strong></td>
                    <td>{new Date(product.updatedAt).toLocaleDateString()}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Product Description */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Description</h5>
            </Card.Header>
            <Card.Body>
              <p>{product.description || 'No description available'}</p>
            </Card.Body>
          </Card>

          {/* Product Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Specifications</h5>
              </Card.Header>
              <Card.Body>
                <Table borderless size="sm">
                  <tbody>
                                        {Object.entries(product.specifications).map(([key, value]) => (
                      <tr key={key}>
                        <td><strong>{key}:</strong></td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Recent Reviews */}
      {product.reviews && product.reviews.length > 0 && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Recent Reviews ({product.reviews.length})</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {product.reviews.slice(0, 5).map((review, index) => (
                    <ListGroup.Item key={index}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="d-flex align-items-center mb-1">
                            <strong className="me-2">{review.user?.name || 'Anonymous'}</strong>
                            <div className="me-2">
                              {renderStarRating(review.rating)}
                            </div>
                            <small className="text-muted">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          <p className="mb-0">{review.comment}</p>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                {product.reviews.length > 5 && (
                  <Card.Footer className="text-center">
                    <Button variant="outline-primary" size="sm">
                      View All Reviews ({product.reviews.length})
                    </Button>
                  </Card.Footer>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Warning!</strong> This action cannot be undone.
          </Alert>
          <p>Are you sure you want to delete <strong>{product.name}</strong>?</p>
          <p className="text-muted">
            This will permanently remove the product and all associated data.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Delete Product
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProductDetail;

