import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaImage, FaTags } from 'react-icons/fa';
import { categoryService } from '../../../../services/categoryService';
import { getImageUrl } from '../../../../utils/imageUrl';
import './admincategorydetail.css';

const AdminCategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getCategoryById(id);
        setCategory(response.category);
      } catch (err) {
        setError(err.message || 'Failed to load category details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCategory();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading category details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-4">
        <h6>Error Loading Category</h6>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={() => navigate('/admin/categories')}>
          Back to Categories
        </Button>
      </Alert>
    );
  }

  if (!category) {
    return (
      <Alert variant="warning" className="m-4">
        <h6>Category Not Found</h6>
        <p>The requested category could not be found.</p>
        <Button variant="outline-warning" onClick={() => navigate('/admin/categories')}>
          Back to Categories
        </Button>
      </Alert>
    );
  }

  return (
    <Container fluid className="admin-category-detail">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title - 1">{category.name}</h1>
          <div className="header-actions">
            <Button
              as={Link}
              to={`/admin/categories/${category._id}/edit`}
              variant="primary"
            >
              <FaEdit />
              Edit
            </Button>
          </div>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="content-card">
            <Card.Header>
              <h5>Category Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Name:</strong>
                    <p className="mb-0">{category.name}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Slug:</strong>
                    <p className="mb-0">
                      <code>{category.slug}</code>
                    </p>
                  </div>
                </Col>
              </Row>
              
              <div className="mb-3">
                <strong>Description:</strong>
                <p className="mb-0">
                  {category.description || <em className="text-muted">No description provided</em>}
                </p>
              </div>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Status:</strong>
                    <div>
                      <Badge bg={category.isActive ? 'success' : 'danger'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Created:</strong>
                    <p className="mb-0">{new Date(category.createdAt).toLocaleDateString()}</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {category.subCategories && category.subCategories.length > 0 && (
            <Card className="content-card">
              <Card.Header>
                <h5>
                  <FaTags className="me-2" />
                  Subcategories ({category.subCategories.length})
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {category.subCategories.map((subCat, index) => (
                    <ListGroup.Item key={index}>
                      <div>
                        <h6 className="mb-1">{subCat.name}</h6>
                        <Badge bg="secondary" className="mb-1">
                          {subCat.slug}
                        </Badge>
                        {subCat.description && (
                          <p className="mb-0 text-muted small">
                            {subCat.description}
                          </p>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          {category.image && (
            <Card className="content-card">
              <Card.Header>
                <h6>
                  <FaImage className="me-2" />
                  Category Image
                </h6>
              </Card.Header>
              <Card.Body>
                <img
                  src={category.image ? `${import.meta.env.VITE_API_BASE_URL}${category.image}` : '/placeholder-image.jpg'}
                  alt={category.name}
                  className="img-fluid rounded"
                />
              </Card.Body>
            </Card>
          )}

          <Card className="content-card">
            <Card.Header>
              <h6>Statistics</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Subcategories:</strong>
                <Badge bg="info" className="ms-2">
                  {category.subCategories?.length || 0}
                </Badge>
              </div>
              <div className="mb-0">
                <strong>Last Updated:</strong>
                <p className="mb-0 small text-muted">
                  {new Date(category.updatedAt).toLocaleString()}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminCategoryDetail;