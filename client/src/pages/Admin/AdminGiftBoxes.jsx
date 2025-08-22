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

const AdminGiftBoxes = () => {
  const [giftBoxes, setGiftBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGiftBox, setSelectedGiftBox] = useState(null);
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
    fetchGiftBoxes(true);
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchGiftBoxes(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handleFocus = () => {
      fetchGiftBoxes(true);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchGiftBoxes = async (forceRefresh = false) => {
    try {
      const headers = { 'x-admin-request': 'true' };
      const params = forceRefresh ? { _t: Date.now() } : {};
      
      const response = await api.get('/giftboxes', { headers, params });
      setGiftBoxes(response.data);
    } catch (error) {
      console.error('Error fetching gift boxes:', error);
      toast.error('Failed to load gift boxes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/giftboxes/${selectedGiftBox._id}`);
      
      setGiftBoxes(prevGiftBoxes => 
        prevGiftBoxes.filter(giftBox => giftBox._id !== selectedGiftBox._id)
      );
      
      setShowDeleteModal(false);
      setSelectedGiftBox(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Gift box deleted successfully!');
      
      setTimeout(() => {
        fetchGiftBoxes(true);
      }, 500);
    } catch (error) {
      console.error('Error deleting gift box:', error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Failed to delete gift box');
      await fetchGiftBoxes(true);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading gift boxes...</p>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">Gift Box Management</h1>
          </div>
          <div className="d-flex gap-2">
            <button 
              onClick={() => fetchGiftBoxes(true)}
              className="add-category-btn"
              style={{ background: '#6c757d', border: 'none' }}
            >
              <FaSync />
              <span>Refresh</span>
            </button>
            <Link to="/admin/giftboxes/add" className="add-category-btn">
              <FaPlus />
              <span>Add Gift Box</span>
            </Link>
          </div>
        </div>
      </div>

      <button 
        className="mobile-filter-toggle"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        style={{ display: 'block', width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
      >
        {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

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

      <div className="categories-table-card">
        <div className="table-header">
          <h5 className="table-title">Gift Boxes List</h5>
          <small className="table-subtitle">Showing {giftBoxes.length} gift boxes</small>
        </div>
        <div className="table-body">
          {giftBoxes.length === 0 ? (
            <div className="text-center py-5">
              <h5>No gift boxes found</h5>
              <p className="text-muted">Create your first gift box to get started</p>
            </div>
          ) : (
            <>
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
                {giftBoxes.map(giftBox => (
                  <tr key={giftBox._id}>
                    <td>
                      <div>
                        <h6 className="mb-1">{giftBox.name}</h6>
                        <small className="text-muted">ID: {giftBox._id}</small>
                      </div>
                    </td>
                    <td>
                      <strong>₹{giftBox.price}</strong>
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px' }}>
                        {giftBox.description ? (
                          <small>{giftBox.description.substring(0, 100)}...</small>
                        ) : (
                          <small className="text-muted">No description</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg="info">
                        {giftBox.crackers?.length || 0} items
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={giftBox.isActive ? 'success' : 'secondary'}>
                        {giftBox.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <small>{new Date(giftBox.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          as={Link}
                          to={`/admin/giftboxes/view/${giftBox._id}`}
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          as={Link}
                          to={`/admin/giftboxes/edit/${giftBox._id}`}
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
                            setSelectedGiftBox(giftBox);
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
            
            <div className="mobile-categories-grid">
              {giftBoxes.map(giftBox => (
                <div key={giftBox._id} className="mobile-category-card">
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-title">{giftBox.name}</div>
                      <div className="mobile-card-id">ID: {giftBox._id}</div>
                    </div>
                    <Badge bg={giftBox.isActive ? 'success' : 'secondary'}>
                      {giftBox.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="mobile-card-body">
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Price</div>
                      <div className="mobile-field-value">
                        <strong>₹{giftBox.price}</strong>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Items</div>
                      <div className="mobile-field-value">
                        <Badge bg="info">
                          {giftBox.crackers?.length || 0}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mobile-card-field mobile-card-field-full">
                      <div className="mobile-field-label">Description</div>
                      <div className="mobile-field-value">
                        {giftBox.description ? (
                          <p style={{textAlign: 'center', margin: 0, fontSize: '0.75rem', textAlignLast: 'center', lineHeight: '1.4'}} className="text-muted">
                            {giftBox.description}
                          </p>
                        ) : (
                          <span className="text-muted">No description</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mobile-card-field">
                      <div className="mobile-field-label">Created</div>
                      <div className="mobile-field-value">
                        {new Date(giftBox.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mobile-card-actions">
                    <Button
                      as={Link}
                      to={`/admin/giftboxes/view/${giftBox._id}`}
                      variant="outline-info"
                      size="sm"
                    >
                      <FaEye /> View
                    </Button>
                    <Button
                      as={Link}
                      to={`/admin/giftboxes/edit/${giftBox._id}`}
                      variant="outline-primary"
                      size="sm"
                    >
                      <FaEdit /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setSelectedGiftBox(giftBox);
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

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this gift box?</p>
          {selectedGiftBox && (
            <div className="category-delete-info">
              <strong>{selectedGiftBox.name}</strong>
              <br />
              <small className="text-muted">
                This gift box contains {selectedGiftBox.crackers?.length || 0} items.
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
            Delete Gift Box
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminGiftBoxes;