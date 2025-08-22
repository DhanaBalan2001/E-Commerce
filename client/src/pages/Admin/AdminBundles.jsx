import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Table, Button, Modal, Form, 
  Alert, Spinner, Badge, ListGroup 
} from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, 
  FaList, FaTags, FaSync 
} from 'react-icons/fa';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './AdminBundles.css';

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

const AdminBundles = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'createdAt-desc'
  });
  const toast = useToast();
  const location = useLocation();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchBundles(true); // Always force refresh on initial load
  }, []);

  // Refresh when navigating back with refresh state
  useEffect(() => {
    if (location.state?.refresh) {
      fetchBundles(true); // Force refresh with cache bypass
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Refresh data when component becomes visible (e.g., after navigation)
  useEffect(() => {
    const handleFocus = () => {
      fetchBundles(true); // Force refresh on focus
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchBundles = async (forceRefresh = false) => {
    try {
      const headers = { 'x-admin-request': 'true' };
      const params = forceRefresh ? { _t: Date.now() } : {};
      
      const response = await api.get('/bundles', { headers, params });
      setBundles(response.data);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      toast.error('Failed to load bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/bundles/${selectedBundle._id}`);
      
      // Update state immediately for better UX
      setBundles(prevBundles => 
        prevBundles.filter(bundle => bundle._id !== selectedBundle._id)
      );
      
      setShowDeleteModal(false);
      setSelectedBundle(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Bundle deleted successfully!');
      
      // Refresh data from server after a short delay
      setTimeout(() => {
        fetchBundles(true); // Force refresh after delete
      }, 500);
    } catch (error) {
      console.error('Error deleting bundle:', error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Failed to delete bundle');
      // Refresh data in case of error to ensure consistency
      await fetchBundles(true);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading bundles...</p>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">Bundle Management</h1>
          </div>
          <div className="d-flex gap-2">
            <button 
              onClick={() => fetchBundles(true)}
              className="add-category-btn"
              style={{ background: '#6c757d', border: 'none' }}
            >
              <FaSync />
              <span>Refresh</span>
            </button>
            <Link to="/admin/bundles/add" className="add-category-btn">
              <FaPlus />
              <span>Add Bundle</span>
            </Link>
          </div>
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
                    { value: 'price-desc', label: 'Price High-Low' },
                    { value: 'price-asc', label: 'Price Low-High' }
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

      {/* Bundles Table */}
      <div className="categories-table-card">
        <div className="table-header">
          <h5 className="table-title">Bundles List</h5>
          <small className="table-subtitle">Showing {bundles.length} bundles</small>
        </div>
        <div className="table-body">
          {bundles.length === 0 ? (
            <div className="text-center py-5">
              <h5>No bundles found</h5>
              <p className="text-muted">Create your first bundle to get started</p>

            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <Table responsive hover className="mb-0 categories-table">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map(bundle => (
                  <tr key={bundle._id}>
                    <td>
                      <div>
                        <h6 className="mb-1">{bundle.name}</h6>
                        <small className="text-muted">ID: {bundle._id}</small>
                      </div>
                    </td>
                    <td>
                      <strong>₹{bundle.price}</strong>
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px' }}>
                        {bundle.description ? (
                          <small>{bundle.description.substring(0, 100)}...</small>
                        ) : (
                          <small className="text-muted">No description</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg="info">
                        {bundle.crackers?.length || 0} items
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={bundle.isActive ? 'success' : 'secondary'}>
                        {bundle.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <small>{new Date(bundle.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          as={Link}
                          to={`/admin/bundles/view/${bundle._id}`}
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          as={Link}
                          to={`/admin/bundles/edit/${bundle._id}`}
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setSelectedBundle(bundle);
                            setShowDeleteModal(true);
                          }}
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
              {bundles.map(bundle => (
                <div key={bundle._id} className="mobile-category-card">
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-title">{bundle.name}</div>
                      <div className="mobile-card-id">ID: {bundle._id}</div>
                    </div>
                    <Badge bg={bundle.isActive ? 'success' : 'secondary'}>
                      {bundle.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="mobile-card-body">
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Price</div>
                      <div className="mobile-field-value">
                        <strong>₹{bundle.price}</strong>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Items</div>
                      <div className="mobile-field-value">
                        <Badge bg="info">
                          {bundle.crackers?.length || 0}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field mobile-card-field-full">
                      <div className="mobile-field-label">Description</div>
                      <div className="mobile-field-value">
                        {bundle.description ? (
                          <p style={{textAlign: 'center', margin: 0, fontSize: '0.75rem', textAlignLast: 'center', lineHeight: '1.4'}} className="text-muted">
                            {bundle.description}
                          </p>
                        ) : (
                          <span className="text-muted">No description</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Created</div>
                      <div className="mobile-field-value">
                        {new Date(bundle.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mobile-card-actions">
                    <Button
                      as={Link}
                      to={`/admin/bundles/view/${bundle._id}`}
                      variant="outline-info"
                      size="sm"
                    >
                      <FaEye /> View
                    </Button>
                    <Button
                      as={Link}
                      to={`/admin/bundles/edit/${bundle._id}`}
                      variant="outline-primary"
                      size="sm"
                    >
                      <FaEdit /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setSelectedBundle(bundle);
                        setShowDeleteModal(true);
                      }}
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this bundle?</p>
          {selectedBundle && (
            <div className="category-delete-info">
              <strong>{selectedBundle.name}</strong>
              <br />
              <small className="text-muted">
                This bundle contains {selectedBundle.crackers?.length || 0} items.
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
          <Button variant="danger" onClick={handleDelete}>
            Delete Bundle
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminBundles;