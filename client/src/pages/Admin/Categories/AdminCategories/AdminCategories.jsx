import React, { useState } from 'react';
import { 
  Row, Col, Card, Table, Button, Modal, Form, 
  Alert, Spinner, Badge, ListGroup 
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, 
  FaList, FaTags 
} from 'react-icons/fa';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '../../../../hooks/useCategories';
import { useToast } from '../../../../context/ToastContext';
import './admincategories.css';

const MobileDropdown = ({ value, onChange, options, placeholder }) => {
  const [showModal, setShowModal] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  const isMobile = window.innerWidth <= 768;
  
  if (!isMobile) {
    return (
      <Form.Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option, index) => (
          <option key={index} value={option.value}>{option.label}</option>
        ))}
      </Form.Select>
    );
  }
  
  return (
    <>
      <Form.Control
        type="text"
        value={selectedOption?.label || ''}
        placeholder={placeholder}
        readOnly
        onClick={() => setShowModal(true)}
        style={{ cursor: 'pointer' }}
      />
      
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{placeholder}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            {options.map((option, index) => (
              <ListGroup.Item
                key={index}
                action
                onClick={() => {
                  onChange(option.value);
                  setShowModal(false);
                }}
                active={option.value === value}
              >
                {option.label}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </>
  );
};

const AdminCategories = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    image: ''
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'createdAt-desc'
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const { data: categoriesData, loading, error, refetch } = useCategories();
  const createCategory = useCreateCategory(() => refetch());
  const updateCategory = useUpdateCategory(() => refetch());
  const deleteCategory = useDeleteCategory(() => refetch());
  const toast = useToast();

  const categories = categoriesData?.categories || [];

  const handleShowModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        slug: category.slug,
        image: category.image || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        slug: '',
        image: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      slug: '',
      image: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory.mutate({
          id: editingCategory._id,
          data: formData
        });
        toast.success('Category updated successfully!');
      } else {
        await createCategory.mutate(formData);
        toast.success('Category created successfully!');
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory.mutate(categoryToDelete._id);
      toast.success('Category deleted successfully!');
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete category';
      toast.error(errorMessage);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">Categories Management</h1>

          </div>
          <Link to="/admin/categories/new" className="add-category-btn">
            <FaPlus />
            <span>Add Category</span>
          </Link>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <button 
        className="mobile-filter-toggle"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        style={{ display: 'block', width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
      >
        {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Filters */}
      <div className="filters-card" style={{ marginBottom: '1rem' }}>
        <div className={`filters-content ${showMobileFilters ? 'show' : ''}`} style={{ display: showMobileFilters || window.innerWidth > 768 ? 'block' : 'none' }}>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <MobileDropdown
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                  placeholder="All Status"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Sort By</Form.Label>
                <MobileDropdown
                  value={filters.sortBy}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                  options={[
                    { value: 'createdAt-desc', label: 'Newest First' },
                    { value: 'createdAt-asc', label: 'Oldest First' },
                    { value: 'name-asc', label: 'Name A-Z' },
                    { value: 'name-desc', label: 'Name Z-A' },
                    { value: 'products-desc', label: 'Most Products' },
                    { value: 'products-asc', label: 'Least Products' }
                  ]}
                  placeholder="Sort By"
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end justify-content-center">
              <Button 
                variant="outline-secondary" 
                onClick={() => setFilters({ status: '', sortBy: 'createdAt-desc' })}
                style={{ margin: '0 auto' }}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <h6>Error Loading Categories</h6>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      )}

      {/* Categories Table */}
      <div className="categories-table-card">
        <div className="table-header">
          <h5 className="table-title">Categories List</h5>
          <small className="table-subtitle">Showing {categories.length} categories</small>
        </div>
        <div className="table-body">
          {categories.length === 0 ? (
            <div className="text-center py-5">
              <h5>No categories found</h5>
              <p className="text-muted">Create your first category to get started</p>
            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <Table responsive hover className="mb-0 categories-table">
              <thead className="table-light">
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Sub-Categories</th>
                  <th>Products</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category._id}>
                    <td>
                      <img
                        src={category.image ? `${import.meta.env.VITE_API_BASE_URL}${category.image}` : '/placeholder-image.jpg'}
                        alt={category.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </td>
                    <td>
                      <div>
                        <h6 className="mb-1">{category.name}</h6>
                        <small className="text-muted">ID: {category._id}</small>
                      </div>
                    </td>
                    <td>
                      <code>{category.slug}</code>
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px' }}>
                        {category.description ? (
                          <small>{category.description.substring(0, 100)}...</small>
                        ) : (
                          <small className="text-muted">No description</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg="info">
                        {category.subCategories?.length || 0} sub-categories
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="success">
                        {category.productCount || 0} products
                      </Badge>
                    </td>
                    <td>
                      <small>{new Date(category.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          as={Link}
                          to={`/admin/categories/${category._id}`}
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          as={Link}
                          to={`/admin/categories/${category._id}/edit`}
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {/* Mobile Cards */}
            <div className="mobile-categories-grid">
              {categories.map(category => (
                <div key={category._id} className="mobile-category-card">
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-title">{category.name}</div>
                      <div className="mobile-card-id">ID: {category._id}</div>
                    </div>
                    <Badge bg="info">
                      {category.subCategories?.length || 0} subs
                    </Badge>
                  </div>
                  
                  <div className="mobile-card-body">
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Slug</div>
                      <div className="mobile-field-value">
                        <code>{category.slug}</code>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field mobile-card-field-full">
                      <div className="mobile-field-label">Description</div>
                      <div className="mobile-field-value">
                        {category.description ? (
                          <p style={{textAlign: 'center', margin: 0, fontSize: '0.75rem', textAlignLast: 'center', lineHeight: '1.4'}} className="text-muted">
                            {category.description}
                          </p>
                        ) : (
                          <span className="text-muted">No description</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Products</div>
                      <div className="mobile-field-value">
                        <Badge bg="success">
                          {category.productCount || 0}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Created</div>
                      <div className="mobile-field-value">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mobile-card-actions">
                    <Button
                      as={Link}
                      to={`/admin/categories/${category._id}`}
                      variant="outline-info"
                      size="sm"
                    >
                      <FaEye /> View
                    </Button>
                    <Button
                      as={Link}
                      to={`/admin/categories/${category._id}/edit`}
                      variant="outline-primary"
                      size="sm"
                    >
                      <FaEdit /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteClick(category)}
                    >
                      <FaTrash /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Slug *</Form.Label>
                  <Form.Control
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="category-slug"
                    required
                  />
                  <Form.Text className="text-muted">
                    URL-friendly version of the name
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter category description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
              <Form.Text className="text-muted">
                Optional: URL to category image
              </Form.Text>
            </Form.Group>

            {formData.image && (
              <div className="mb-3">
                <Form.Label>Image Preview</Form.Label>
                <div>
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="img-thumbnail"
                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={createCategory.loading || updateCategory.loading}
            >
              {createCategory.loading || updateCategory.loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {editingCategory ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this category?</p>
          {categoryToDelete && (
            <div className="category-delete-info">
              <strong>{categoryToDelete.name}</strong>
              <br />
              <small className="text-muted">
                This will also affect {categoryToDelete.productCount || 0} products in this category.
              </small>
              <br />
              <small className="text-danger">This action cannot be undone.</small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
            disabled={deleteCategory.loading}
          >
            {deleteCategory.loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Category'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminCategories;

