import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Pagination, Modal, ListGroup } from 'react-bootstrap';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../context/ToastContext';
import { useAppContext } from '../../context/AppContext';
import { getImageUrl } from '../../utils/imageUrl';
import './products.css';
import CrackerLoader from '../../components/common/CrackerLoader';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    limit: 12,
    category: searchParams.get('category') || '',
    subCategory: searchParams.get('subCategory') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showPerPageModal, setShowPerPageModal] = useState(false);
  const [quantities, setQuantities] = useState({});

  // Get user from context but don't redirect if not authenticated
  const { user } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();

  // Use hooks but handle authentication errors gracefully
  const { data: productsData, loading, error, refetch } = useProducts(filters);
  const { data: categoriesData } = useCategories();
  const { addToCart, addToCartLoading } = useCart();

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const currentPage = productsData?.currentPage || 1;
  const total = productsData?.total || 0;
  const categories = categoriesData?.categories || [];



  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setShowFilters(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      // Only add non-default values to URL
      if (value && (
        (key === 'page' && value !== 1) ||
        (key === 'limit' && value !== 12) ||
        (key === 'sortBy' && value !== 'createdAt') ||
        (key === 'sortOrder' && value !== 'desc') ||
        (key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder')
      )) {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
    // Close filters on mobile after selection
    if (isMobile && key !== 'search') {
      setShowFilters(false);
    }
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const quantity = Math.max(1, parseInt(newQuantity) || 1);
    setQuantities(prev => ({ ...prev, [productId]: quantity }));
  };

  const getQuantity = (productId) => quantities[productId] || 1;

  const handleAddToCart = async (productId) => {
    // Check if user is logged in
    if (!user) {
      toast.success('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      const quantity = getQuantity(productId);
      await addToCart.mutate({ productId, quantity });
      
      // Scroll to top on desktop to show notification
      if (window.innerWidth > 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      toast.success('Product added to cart successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to add product to cart');
    }
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      category: '',
      subCategory: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const getSubCategories = (categorySlug) => {
    const category = categories.find(cat => cat.slug === categorySlug);
    return category?.subCategories || [];
  };

  return (
    <div className="products-page">
      {/* Page Header */}
      <div className="products-header">
        <Container>
          <Row>
            <Col>
              <div className="products-header-content">
                <h1 className="products-page-title">Our Products</h1>
                <p className="products-page-subtitle">
                  Discover our wide range of premium quality crackers and fireworks
                </p>
                <div className="products-breadcrumb">
                  <Link to="/" className="breadcrumb-link">Home</Link>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-current">Products</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    
      <Container className="py-4">
        <Row>
          {/* Mobile Filter Toggle */}
          {isMobile && (
            <Col xs={12} className="mb-3">
              <Button 
                variant="outline-primary" 
                onClick={() => setShowFilters(!showFilters)}
                className="w-100"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Col>
          )}

          {/* Filters Sidebar */}
          <Col lg={3} className={`mb-4 ${isMobile && !showFilters ? 'd-none' : ''}`}>
            <div className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
       {/* Filters Header - Hidden on mobile */}
      {!isMobile && (
        <div className="filters-header mb-3">
          <div className="filters-title-section">
            <h5 className="filters-title mb-0">Filters</h5>
           </div>
            <div className="filters-actions-section">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={clearFilters}
              className="clear-filters-btn"
            >
              Clear All
            </Button>
           </div>
        </div>
      )}


              {/* Search Filter */}
              <div className="filter-section">
                <Form.Group>
                  <Form.Label>Search Products</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      placeholder="Search..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleFilterChange('search', filters.search);
                        }
                      }}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleFilterChange('search', filters.search)}
                      style={{ minWidth: '60px' }}
                    >
                      Search
                    </Button>
                  </div>
                </Form.Group>
              </div>

              {/* Category Filter */}
              <div className="filter-section">
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  {isMobile ? (
                    <Button
                      variant="outline-primary"
                      className="w-100 text-center"
                      onClick={() => setShowCategoryModal(true)}
                    >
                      {filters.category ? categories.find(c => c.slug === filters.category)?.name : 'All Categories'}
                    </Button>
                  ) : (
                    <Form.Select
                      value={filters.category}
                      onChange={(e) => {
                        handleFilterChange('category', e.target.value);
                        handleFilterChange('subCategory', ''); // Reset subcategory
                      }}
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category._id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </div>

              {/* Sub-Category Filter */}
              {filters.category && (
                <div className="filter-section">
                  <Form.Group>
                    <Form.Label>Sub-Category</Form.Label>
                    {isMobile ? (
                      <Button
                        variant="outline-primary"
                        className="w-100 text-center"
                        onClick={() => setShowSubCategoryModal(true)}
                      >
                        {filters.subCategory ? 
                          getSubCategories(filters.category).find(sc => sc.slug === filters.subCategory)?.name || 'All Sub-Categories'
                          : 'All Sub-Categories'
                        }
                      </Button>
                    ) : (
                      <Form.Select
                        value={filters.subCategory}
                        onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                      >
                        <option value="">All Sub-Categories</option>
                        {getSubCategories(filters.category).map(subCat => (
                          <option key={subCat._id} value={subCat.slug}>
                            {subCat.name}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  </Form.Group>
                </div>
              )}

              {/* Price Range Filter */}
              <div className="filter-section">
                <Form.Group>
                  <Form.Label>Price Range</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="number"
                        placeholder="Min Price"
                        value={filters.minPrice}
                        onChange={(e) => {
                          const value = Math.max(0, parseFloat(e.target.value) || 0);
                          handleFilterChange('minPrice', value || '');
                        }}
                        min="0"
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="number"
                        placeholder="Max Price"
                        value={filters.maxPrice}
                        onChange={(e) => {
                          const value = Math.max(0, parseFloat(e.target.value) || 0);
                          handleFilterChange('maxPrice', value || '');
                        }}
                        min="0"
                      />
                    </Col>
                  </Row>
                </Form.Group>
              </div>

              {/* Sort Filter */}
              <div className="filter-section">
                <Form.Group>
                  <Form.Label>Sort By</Form.Label>
                  {isMobile ? (
                    <Button
                      variant="outline-primary"
                      className="w-100 text-center"
                      onClick={() => setShowSortModal(true)}
                    >
                      {(() => {
                        const sortOptions = {
                          'createdAt-desc': 'Newest First',
                          'createdAt-asc': 'Oldest First',
                          'price-asc': 'Price: Low to High',
                          'price-desc': 'Price: High to Low',
                          'name-asc': 'Name: A to Z',
                          'name-desc': 'Name: Z to A',
                          'ratings.average-desc': 'Highest Rated'
                        };
                        return sortOptions[`${filters.sortBy}-${filters.sortOrder}`] || 'Newest First';
                      })()} 
                    </Button>
                  ) : (
                    <Form.Select
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        handleFilterChange('sortBy', sortBy);
                        handleFilterChange('sortOrder', sortOrder);
                      }}
                    >
                      <option value="createdAt-desc">Newest First</option>
                      <option value="createdAt-asc">Oldest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name-asc">Name: A to Z</option>
                      <option value="name-desc">Name: Z to A</option>
                      <option value="ratings.average-desc">Highest Rated</option>
                    </Form.Select>
                  )}
                </Form.Group>
              </div>


            </div>
          </Col>

          {/* Products Grid */}
          <Col lg={9}>
            {/* Results Header */}
            <div className="results-header">
              <Row className="align-items-center">
                <Col>
                  <h4> Products</h4>
                  {isMobile ? (
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="mb-0 text-muted">
                        Showing {products.length} of {total} products
                      </p>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setShowPerPageModal(true)}
                        style={{ minWidth: '70px', fontSize: '0.7rem', whiteSpace: 'nowrap', marginLeft: '10px', padding: '0.3rem 0.5rem' }}
                      >
                        {filters.limit} per page
                      </Button>
                    </div>
                  ) : (
                    <p className="mb-0 text-muted">
                      Showing {products.length} of {total} products
                    </p>
                  )}
                </Col>
                {!isMobile && (
                  <Col xs="auto">
                    <Form.Select
                      size="sm"
                      value={filters.limit}
                      onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                      style={{ width: 'auto' }}
                    >
                      <option value={12}>12 per page</option>
                      <option value={24}>24 per page</option>
                      <option value={48}>48 per page</option>
                    </Form.Select>
                  </Col>
                )}
              </Row>
            </div>

            {/* Error State */}
            {error && (
              <Alert variant="danger" className="error-message">
                <h5>Unable to Load Products</h5>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={refetch}>
                  Try Again
                </Button>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <CrackerLoader size="lg" text="Loading products..." />
              </div>
            )}

            {/* Products Grid */}
            {!error && !loading && (
              <>
                {products.length === 0 ? (
                  <div className="text-center py-5">
                    <h4>No products found</h4>
                    <p className="text-muted">Try adjusting your filters or search terms</p>
                    <Button variant="outline-primary" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <Row>
                    {products.map(product => (
                      <Col lg={4} md={6} xs={6} key={product._id} className="mb-4">
                        <Card className="product-card h-100">
                          <div className="product-image-container" style={{height: window.innerWidth <= 768 ? '95px' : '120px', maxHeight: window.innerWidth <= 768 ? '95px' : '120px'}}>
                            <img
                              src={getImageUrl(product.images?.[0]?.url)}
                              alt={product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}
                              className="product-image"
                            />
                          </div>
                          
                          <Card.Body className="d-flex flex-column">
                            <Card.Title className="h6 mb-2">
                              <Link 
                                to={`/products/${product._id}`}
                                className="text-decoration-none text-dark"
                              >
                                {product.name}
                              </Link>
                            </Card.Title>
                            
                            <div className="product-rating mb-2">
                              <span className="text-warning">
                                {'★'.repeat(Math.floor(product.ratings?.average || 0))}
                                {'☆'.repeat(5 - Math.floor(product.ratings?.average || 0))}
                              </span>
                              <small className="text-muted ms-1">
                                ({product.ratings?.count || 0} reviews)
                              </small>
                            </div>
                            
                            <div className="product-price">
                              <h5 className="mb-1" style={{fontSize: window.innerWidth <= 768 ? '0.85rem' : ''}}>₹{product.price}</h5>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <small className="text-muted text-decoration-line-through">
                                  ₹{product.originalPrice}
                                </small>
                              )}
                            </div>
                            
                            {/* Quantity Control */}
                            <div className="quantity-control mb-2">
                              <div className="d-flex align-items-center justify-content-center">
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleQuantityChange(product._id, getQuantity(product._id) - 1)}
                                  disabled={getQuantity(product._id) <= 1}
                                  style={{width: '30px', height: '30px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  className="form-control mx-2 text-center"
                                  value={getQuantity(product._id)}
                                  onChange={(e) => {
                                    const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                                    handleQuantityChange(product._id, newQuantity);
                                  }}
                                  min="1"
                                  max={product.stock || 999}
                                  style={{width: '60px', fontSize: '14px', textAlign: 'center'}}
                                />
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleQuantityChange(product._id, getQuantity(product._id) + 1)}
                                  disabled={getQuantity(product._id) >= (product.stock || 999)}
                                  style={{width: '30px', height: '30px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            
                            <div className="product-actions" style={{marginTop: window.innerWidth <= 768 ? '-0.5rem' : 'auto'}}>
                              {isMobile ? (
                                // Mobile layout: stacked buttons
                                <>
                                 <Button
                                    variant="outline-primary"
                                    size="sm"
                                    as={Link}
                                    to={`/products/${product._id}`}
                                    className="w-100 mobile-btn-small"
                                  >
                                    View
                                  </Button>
                                    <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-100 mb-2 mobile-btn-small"
                                    onClick={() => handleAddToCart(product._id)}
                                    disabled={addToCartLoading}
                                  >
                                    Add
                                  </Button>
                                </>
                              ) : (
                                // Desktop layout: side by side buttons
                                <div className="d-flex gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex-grow-1"
                                    onClick={() => handleAddToCart(product._id)}
                                    disabled={addToCartLoading}
                                  >
                                    Add
                                  </Button>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    as={Link}
                                    to={`/products/${product._id}`}
                                  >
                                    View
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="justify-content-center mt-4">
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
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
      
      {/* Category Modal for Mobile */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Category</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            <ListGroup.Item
              action
              onClick={() => {
                handleFilterChange('category', '');
                handleFilterChange('subCategory', '');
                setShowCategoryModal(false);
              }}
              active={filters.category === ''}
            >
              All Categories
            </ListGroup.Item>
            {categories.map(category => (
              <ListGroup.Item
                key={category._id}
                action
                onClick={() => {
                  handleFilterChange('category', category.slug);
                  handleFilterChange('subCategory', '');
                  setShowCategoryModal(false);
                }}
                active={filters.category === category.slug}
              >
                {category.name}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
      
      {/* SubCategory Modal for Mobile */}
      <Modal show={showSubCategoryModal} onHide={() => setShowSubCategoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Sub-Category</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            <ListGroup.Item
              action
              onClick={() => {
                handleFilterChange('subCategory', '');
                setShowSubCategoryModal(false);
              }}
              active={filters.subCategory === ''}
            >
              All Sub-Categories
            </ListGroup.Item>
            {getSubCategories(filters.category).map(subCat => (
              <ListGroup.Item
                key={subCat._id}
                action
                onClick={() => {
                  handleFilterChange('subCategory', subCat.slug);
                  setShowSubCategoryModal(false);
                }}
                active={filters.subCategory === subCat.slug}
              >
                {subCat.name}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
      
      {/* Sort Modal for Mobile */}
      <Modal show={showSortModal} onHide={() => setShowSortModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sort By</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            {[
              { value: 'createdAt-desc', label: 'Newest First' },
              { value: 'createdAt-asc', label: 'Oldest First' },
              { value: 'price-asc', label: 'Price: Low to High' },
              { value: 'price-desc', label: 'Price: High to Low' },
              { value: 'name-asc', label: 'Name: A to Z' },
              { value: 'name-desc', label: 'Name: Z to A' },
              { value: 'ratings.average-desc', label: 'Highest Rated' }
            ].map(option => (
              <ListGroup.Item
                key={option.value}
                action
                onClick={() => {
                  const [sortBy, sortOrder] = option.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                  setShowSortModal(false);
                }}
                active={`${filters.sortBy}-${filters.sortOrder}` === option.value}
              >
                {option.label}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
      
      {/* Items Per Page Modal for Mobile */}
      <Modal show={showPerPageModal} onHide={() => setShowPerPageModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Items Per Page</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            {[
              { value: 12, label: '12 per page' },
              { value: 24, label: '24 per page' },
              { value: 48, label: '48 per page' }
            ].map(option => (
              <ListGroup.Item
                key={option.value}
                action
                onClick={() => {
                  handleFilterChange('limit', option.value);
                  setShowPerPageModal(false);
                }}
                active={filters.limit === option.value}
              >
                {option.label}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Products;

