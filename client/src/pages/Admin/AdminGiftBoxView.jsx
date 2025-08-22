import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Button, ListGroup, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaEdit, FaArrowLeft } from 'react-icons/fa';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './AdminBundles.css';

const AdminGiftBoxView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [giftBox, setGiftBox] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGiftBox();
  }, [id]);

  const fetchGiftBox = async () => {
    try {
      const response = await api.get(`/giftboxes/${id}`);
      setGiftBox(response.data);
    } catch (error) {
      console.error('Error fetching gift box:', error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Failed to load gift box details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading gift box details...</p>
      </div>
    );
  }

  if (!giftBox) {
    return (
      <div className="text-center py-5">
        <h5>Gift box not found</h5>
        <p className="text-muted">The requested gift box could not be found.</p>
      </div>
    );
  }

  const totalItems = giftBox.crackers.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="admin-categories">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title1">{giftBox.name}</h1>
          </div>
          <Link to={`/admin/giftboxes/edit/${giftBox._id}`} className="add-category-btn" style={{ background: '#ffc107', color: '#000' }}>
            <FaEdit />
            <span>Edit Gift Box</span>
          </Link>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <div className="categories-table-card mb-4">
            <div className="table-header">
              <h5 className="table-title">Gift Box Information</h5>
            </div>
            <div className="table-body" style={{ padding: '1.5rem' }}>
              <Row>
                <Col md={6}>
                  <p><strong>Name:</strong> {giftBox.name}</p>
                  <p><strong>Price:</strong> ₹{giftBox.price}</p>
                  <p><strong>Status:</strong> 
                    <Badge bg={giftBox.isActive ? 'success' : 'danger'} className="ms-2">
                      {giftBox.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <p><strong>Created:</strong> {new Date(giftBox.createdAt).toLocaleDateString()}</p>
                  <p><strong>Updated:</strong> {new Date(giftBox.updatedAt).toLocaleDateString()}</p>
                  <p><strong>Total Items:</strong> {giftBox.crackers.length}</p>
                </Col>
              </Row>
              <div>
                <strong>Description:</strong>
                <p className="mt-2">{giftBox.description}</p>
              </div>
            </div>
          </div>

          <div className="categories-table-card">
            <div className="table-header">
              <h5 className="table-title">Gift Box Items</h5>
            </div>
            <div className="table-body" style={{ padding: '1.5rem' }}>
              <ListGroup variant="flush">
                {giftBox.crackers.map((item, index) => (
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
              <h5 className="table-title">Gift Box Summary</h5>
            </div>
            <div className="table-body" style={{ padding: '1.5rem' }}>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Items:</span>
                <span>{totalItems}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Gift Box Price:</span>
                <span>₹{giftBox.price}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Items Count:</strong>
                <strong className="text-info">{giftBox.crackers.length}</strong>
              </div>
              <div className="mt-2">
                <small className="text-muted">
                  {giftBox.crackers.length} different products
                </small>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdminGiftBoxView;