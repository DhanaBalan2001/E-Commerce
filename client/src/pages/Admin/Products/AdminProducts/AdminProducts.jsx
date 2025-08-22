import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Table, Button, Form, Badge, 
  Modal, Alert, Spinner, Pagination, ListGroup 
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, 
  FaFilter, FaDownload, FaUpload 
} from 'react-icons/fa';
import { useProducts, useDeleteProduct } from '../../../../hooks/useProducts';
import { useCategories } from '../../../../hooks/useCategories';
import { useToast } from '../../../../context/ToastContext';
import { useGlobalRefresh } from '../../../../hooks/useGlobalRefresh';
import { getImageUrl } from '../../../../utils/imageUrl';
import './adminproducts.css';

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

const AdminProducts = () => {
  const [filters, setFilters] = useState(() => {
    const location = window.location;
    const urlParams = new URLSearchParams(location.search);
    const refresh = urlParams.get('refresh');
    return {
      page: 1,
      limit: 10,
      search: '',
      category: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      refresh: refresh || null
    };
  });
  const [searchInput, setSearchInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data: productsData, loading, error, refetch } = useProducts(filters);
  
  // Use global refresh hook
  useGlobalRefresh(refetch);
  const { data: categoriesData } = useCategories();
  const deleteProduct = useDeleteProduct();
  const toast = useToast();

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const currentPage = productsData?.currentPage || 1;
  const total = productsData?.total || 0;
  const categories = categoriesData?.categories || [];

  // Single stable image key to prevent flickering
  const [imageKey] = useState(Date.now());

  useEffect(() => {
    if (filters.refresh) {
      // Remove refresh param from URL after refresh
      const url = new URL(window.location);
      url.searchParams.delete('refresh');
      window.history.replaceState({}, '', url);
      // Clear refresh from filters to avoid repeated refresh
      setFilters(prev => ({ ...prev, refresh: null }));
    }
  }, [filters.refresh]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
    // Auto-close mobile filters when something is selected
    if (window.innerWidth <= 768) {
      setShowMobileFilters(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchInput,
      page: 1
    }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      category: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      refresh: null
    });
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProduct.mutateAsync(productToDelete._id);
      toast.success('Product deleted successfully!');
      setShowDeleteModal(false);
      setProductToDelete(null);
      // Immediate local update
      refetch();
    } catch (error) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  const getStatusBadge = (product) => {
    if (product.stock === 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    } else if (product.stock <= 10) {
      return <Badge bg="warning">Low Stock</Badge>;
    } else {
      return <Badge bg="success">In Stock</Badge>;
    }
  };

  return (
    <div className="admin-products">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">Products Management</h1>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={() => {
                refetch();
                toast.success('Products refreshed!');
              }}
              size="sm"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : '🔄'} Refresh
            </Button>
            <Link to="/admin/products/new" className="add-product-btn">
              <FaPlus />
              <span>Add Product</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <button 
        className="mobile-filter-toggle"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <FaFilter />
        <span>{showMobileFilters ? 'Hide Filters' : 'Show Filters'}</span>
      </button>

      {/* Filters */}
      <div className="filters-card">
        <div className={`filters-content ${showMobileFilters ? 'show' : ''}`}>
          <Row>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Search Products</Form.Label>
                <div className="search-input-group">
                  <Form.Control
                    type="text"
                    placeholder="Search by name..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                  />
                  <Button 
                    variant="primary" 
                    onClick={handleSearch}
                    className="search-btn"
                  >
                    <FaSearch />
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <MobileDropdown
                  value={filters.category}
                  onChange={(value) => handleFilterChange('category', value)}
                  options={[{ value: '', label: 'All Categories' }, ...categories.map(cat => ({ value: cat.slug, label: cat.name }))]}
                  placeholder="All Categories"
                >
                </MobileDropdown>
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Stock Status</Form.Label>
                <MobileDropdown
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'in-stock', label: 'In Stock' },
                    { value: 'low-stock', label: 'Low Stock' },
                    { value: 'out-of-stock', label: 'Out of Stock' }
                  ]}
                  placeholder="All Status"
                >
                </MobileDropdown>
              </Form.Group>
            </Col>
            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Sort By</Form.Label>
                <MobileDropdown
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-'); 
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                  options={[
                    { value: 'createdAt-desc', label: 'Newest First' },
                    { value: 'createdAt-asc', label: 'Oldest First' },
                    { value: 'name-asc', label: 'Name A-Z' },
                    { value: 'name-desc', label: 'Name Z-A' },
                    { value: 'price-asc', label: 'Price Low-High' },
                    { value: 'price-desc', label: 'Price High-Low' },
                    { value: 'stock-asc', label: 'Stock Low-High' },
                    { value: 'stock-desc', label: 'Stock High-Low' }
                  ]}
                  placeholder="Sort By"
                >
                </MobileDropdown>
              </Form.Group>
            </Col>
            <Col md={1} className="mb-3 d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={clearFilters}
                title="Clear all filters"
              >
                Clear
              </Button>
            </Col>
          </Row>
        </div>
      </div>

    

      {/* Products Table */}
      <div className="products-table-card">
        <div className="table-header">
          <h5 className="table-title">Products List</h5>
          <small className="table-subtitle">Showing {products.length} of {total} products</small>
        </div>
        <div className="table-body">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              <h6>Error Loading Products</h6>
              <p>{error}</p>
              <Button variant="outline-danger" onClick={() => refetch()}>
                Try Again
              </Button>
            </Alert>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <h5>No products found</h5>
              <p className="text-muted">Try adjusting your filters or add some products</p>
            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <Table responsive hover className="mb-0 products-table">
              <thead className="table-light">
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>
                      <img
                        src={product.images?.[0]?.url ? `${import.meta.env.VITE_API_BASE_URL}${product.images[0].url}` : '/placeholder-image.jpg'}
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                        loading="lazy"
                      />
                    </td>
                    <td>
                      <div>
                        <h6 className="mb-1">{product.name}</h6>
                        <small className="text-muted">ID: {product._id}</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg="secondary">
                        {(() => {
                          if (!product.category) return 'Uncategorized';
                          if (typeof product.category === 'object' && product.category.name) {
                            return product.category.name;
                          }
                          const cat = categories.find(c => c._id === product.category || c.slug === product.category);
                          return cat ? cat.name : 'Uncategorized';
                        })()}
                      </Badge>
                    </td>
                    <td>
                      <strong>₹{product.price}</strong>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div>
                          <small className="text-muted text-decoration-line-through">
                            ₹{product.originalPrice}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={product.stock <= 10 ? 'text-danger' : 'text-success'}>
                        {product.stock}
                      </span>
                    </td>
                    <td>{getStatusBadge(product)}</td>
                    <td>
                      <small>{new Date(product.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          as={Link}
                          to={`/admin/products/${product._id}`}
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          as={Link}
                          to={`/admin/products/${product._id}/edit`}
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(product)}
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
            <div className="mobile-products-grid">
              {products.map(product => (
                <div key={product._id} className="mobile-product-card">
                  <div className="mobile-card-header">
                    <img
                      src={product.images?.[0]?.url ? `${import.meta.env.VITE_API_BASE_URL}${product.images[0].url}` : '/placeholder-image.jpg'}
                      alt={product.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginRight: '12px' }}
                      loading="lazy"
                    />
                    <div style={{ flex: 1 }}>
                      <div className="mobile-card-title">{product.name}</div>
                      <div className="mobile-card-id">ID: {product._id}</div>
                    </div>
                    {getStatusBadge(product)}
                  </div>
                  
                  <div className="mobile-card-body">
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Category</div>
                      <div className="mobile-field-value">
                        <Badge bg="secondary" className="badge">
                          {(() => {
                            if (!product.category) return 'Uncategorized';
                            if (typeof product.category === 'object' && product.category.name) {
                              return product.category.name;
                            }
                            const cat = categories.find(c => c._id === product.category || c.slug === product.category);
                            return cat ? cat.name : 'Uncategorized';
                          })()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Price</div>
                      <div className="mobile-field-value">
                        <strong>₹{product.price}</strong>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Stock</div>
                      <div className="mobile-field-value">
                        <span className={product.stock <= 10 ? 'text-danger' : 'text-success'}>
                          {product.stock}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Created</div>
                      <div className="mobile-field-value">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mobile-card-actions">
                    <Button
                      as={Link}
                      to={`/admin/products/${product._id}`}
                      variant="outline-info"
                      size="sm"
                    >
                      <FaEye /> View
                    </Button>
                    <Button
                      as={Link}
                      to={`/admin/products/${product._id}/edit`}
                      variant="outline-primary"
                      size="sm"
                    >
                      <FaEdit /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteClick(product)}
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
        
         {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-wrapper">
            <Pagination className="pagination">
              <Pagination.First
                disabled={currentPage === 1}
                onClick={() => handlePageChange(1)}
              />
              <Pagination.Prev
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              />
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <Pagination.Item
                      key={page}
                      active={page === currentPage}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Pagination.Item>
                  );
                } else if (
                  page === currentPage - 3 ||
                  page === currentPage + 3
                ) {
                  return <Pagination.Ellipsis key={page} />;
                }
                return null;
              })}
              
              <Pagination.Next
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              />
              <Pagination.Last
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
              />
            </Pagination>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this product?</p>
          {productToDelete && (
            <div className="product-delete-info">
              <strong>{productToDelete.name}</strong>
              <br />
              <small className="text-muted">This action cannot be undone.</small>
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
            disabled={deleteProduct.loading}
          >
            {deleteProduct.loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Product'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminProducts;



