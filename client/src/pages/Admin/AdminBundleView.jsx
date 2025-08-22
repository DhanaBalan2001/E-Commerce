import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Button, ListGroup, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaEdit, FaArrowLeft } from 'react-icons/fa';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './AdminBundles.css';

const AdminBundleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundle();
  }, [id]);

  const fetchBundle = async () => {
    try {
      const response = await api.get(`/bundles/${id}`);
      setBundle(response.data);
    } catch (error) {
      console.error('Error fetching bundle:', error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Failed to load bundle details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading bundle details...</p>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="text-center py-5">
        <h5>Bundle not found</h5>
        <p className="text-muted">The requested bundle could not be found.</p>
      </div>
    );
  }

  const totalItems = bundle.crackers.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="admin-categories">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">{bundle.name}</h1>
          </div>
          <Link to={`/admin/bundles/edit/${bundle._id}`} className="add-category-btn" style={{ background: '#ffc107', color: '#000' }}>
            <FaEdit />
            <span>Edit Bundle</span>
          </Link>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <div className="categories-table-card mb-4">
            <div className="table-header">
              <h5 className="table-title">Bundle Information</h5>
            </div>
            <div className="table-body" style={{ padding: '1.5rem' }}>
              <Row>
                <Col md={6}>
                  <p><strong>Name:</strong> {bundle.name}</p>
                  <p><strong>Price:</strong> ₹{bundle.price}</p>
                  <p><strong>Status:</strong> 
                    <Badge bg={bundle.isActive ? 'success' : 'danger'} className="ms-2">
                      {bundle.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <p><strong>Created:</strong> {new Date(bundle.createdAt).toLocaleDateString()}</p>
                  <p><strong>Updated:</strong> {new Date(bundle.updatedAt).toLocaleDateString()}</p>
                  <p><strong>Total Items:</strong> {bundle.crackers.length}</p>
                </Col>
              </Row>
              <div>
                <strong>Description:</strong>
                <p className="mt-2">{bundle.description}</p>
              </div>
            </div>
          </div>

          <div className="categories-table-card">
            <div className="table-header">
              <h5 className="table-title">Bundle Items</h5>
            </div>
            <div className="table-body" style={{ padding: '1.5rem' }}>
              <ListGroup variant="flush">
                {bundle.crackers.map((item, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{item.name}</strong>
                    </div>
                    <Badge bg="primary">Qty: {item.quantity}</Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </div>
        </Col>

        <Col lg={4}>
          <div className="categories-table-card">
            <div className="table-header">
              <h5 className="table-title">Bundle Summary</h5>
            </div>
            <div className="table-body" style={{ padding: '1.5rem' }}>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Items:</span>
                <span>{totalItems}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Bundle Price:</span>
                <span>₹{bundle.price}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Items Count:</strong>
                <strong className="text-info">{bundle.crackers.length}</strong>
              </div>
              <div className="mt-2">
                <small className="text-muted">
                  {bundle.crackers.length} different products
                </small>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdminBundleView;