import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './AdminBundles.css';
import './AdminBundleForm.css';

const AdminGiftBoxForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    crackers: [],
    isActive: true
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', quantity: '' });

  useEffect(() => {
    fetchProducts();
    if (isEdit) {
      fetchGiftBox();
    }
  }, [id, isEdit]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchGiftBox = async () => {
    setFetchLoading(true);
    try {
      const response = await api.get(`/giftboxes/${id}`);
      setFormData(response.data);
    } catch (error) {
      setError('Error fetching gift box data');
      toast.error('Failed to load gift box data');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    
    if (type === 'number' && name === 'price') {
      processedValue = Math.max(0, parseFloat(value) || 0);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
  };

  const addManualProduct = () => {
    if (newProduct.name && newProduct.quantity && parseInt(newProduct.quantity) > 0) {
      setFormData(prev => ({
        ...prev,
        crackers: [...prev.crackers, {
          name: newProduct.name.trim(),
          quantity: parseInt(newProduct.quantity)
        }]
      }));
      setNewProduct({ name: '', quantity: '' });
    }
  };

  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      crackers: prev.crackers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await api.put(`/giftboxes/${id}`, formData);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.success('Gift box updated successfully!');
      } else {
        await api.post('/giftboxes', formData);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.success('Gift box created successfully!');
      }

      navigate('/admin/giftboxes', { replace: true, state: { refresh: true } });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error saving gift box';
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading gift box data...</p>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">{isEdit ? 'Edit Gift Box' : 'Add New Gift Box'}</h1>
          </div>
        </div>
      </div>

      <Row className="justify-content-center">
        <Col lg={8} xl={6}>
          <div className="categories-table-card">
            <div className="table-header">
              <h5 className="table-title">{isEdit ? 'Update Gift Box Information' : 'Create New Gift Box'}</h5>
            </div>
            <div className="table-body" style={{ padding: '1.5rem' }}>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gift Box Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gift Box Price (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                      />
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
                    required
                  />
                </Form.Group>

                <div className="mb-3">
                  <h5 className="mb-3">Gift Box Products ({formData.crackers.length})</h5>
                  <div className="mb-3" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                    <Row className="mb-3">
                      <Col xs={12} sm={5} className="mb-2 mb-sm-0">
                        <Form.Control
                          type="text"
                          placeholder="Product name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </Col>
                      <Col xs={8} sm={4} className="mb-2 mb-sm-0">
                        <Form.Control
                          type="number"
                          placeholder="Quantity"
                          value={newProduct.quantity}
                          onChange={(e) => {
                            const value = Math.max(1, parseInt(e.target.value) || 1);
                            setNewProduct(prev => ({ ...prev, quantity: value }));
                          }}
                          min="1"
                        />
                      </Col>
                      <Col xs={4} sm={3}>
                        <Button
                          variant="primary"
                          onClick={addManualProduct}
                          disabled={!newProduct.name?.trim() || !newProduct.quantity || parseInt(newProduct.quantity) <= 0}
                          className="w-100"
                        >
                          <FaPlus /> <span className="d-none d-sm-inline">Add</span>
                        </Button>
                      </Col>
                    </Row>
                  </div>
                  
                  {formData.crackers.length === 0 ? (
                    <div className="text-center text-muted py-3" style={{ border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                      No products added
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                      {formData.crackers.map((item, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2" style={{ background: '#f8fafc', borderRadius: '6px' }}>
                          <div>
                            <strong>{item.name}</strong>
                            <div className="text-muted small">Qty: {item.quantity}</div>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeProduct(index)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isActive"
                    label="Active"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    style={{ background: '#ff6b35', border: 'none', color: 'white' }}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {isEdit ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      isEdit ? 'Update Gift Box' : 'Create Gift Box'
                    )}
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/admin/giftboxes')}>
                    Cancel
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdminGiftBoxForm;