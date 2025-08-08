import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { reviewService } from '../../services/reviewService';
import './Review.css';

const WriteReview = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      toast.error('Please enter a comment');
      return;
    }

    if (trimmedComment.length < 10) {
      toast.error('Comment must be at least 10 characters long');
      return;
    }

    try {
      await reviewService.addReview(id, { rating, comment });
      toast.success('Review submitted!');
      navigate(`/products/${id}`);
    } catch (err) {
      const errorMessage = err?.message || 'Failed to submit review';
      if (err?.message === 'You have already reviewed this product') {
        toast.error('You have already reviewed this product.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const ratingOptions = [
    { value: 5, label: '5 - Excellent' },
    { value: 4, label: '4 - Good' },
    { value: 3, label: '3 - Average' },
    { value: 2, label: '2 - Poor' },
    { value: 1, label: '1 - Terrible' }
  ];

  const handleRatingSelect = (selectedRating) => {
    setRating(selectedRating);
    setShowRatingModal(false);
  };

  return (
    <Container className="review-page py-5">
      <h2>Write a Review</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="rating" className="mb-3">
          <Form.Label>Rating</Form.Label>
          {isMobile ? (
            <>
              <Button
                variant="outline-secondary"
                className="rating-selector-btn w-100 text-start"
                onClick={() => setShowRatingModal(true)}
              >
                {ratingOptions.find(option => option.value === rating)?.label || 'Select Rating'}
              </Button>
              
              <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
                <Modal.Header closeButton>
                  <Modal.Title>Select Rating</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="rating-options">
                    {ratingOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={rating === option.value ? 'primary' : 'outline-secondary'}
                        className="rating-option-btn w-100 mb-2"
                        onClick={() => handleRatingSelect(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </Modal.Body>
              </Modal>
            </>
          ) : (
            <Form.Select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Terrible</option>
            </Form.Select>
          )}
        </Form.Group>

        <Form.Group controlId="comment" className="mb-3">
          <Form.Label>Comment</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write at least 10 characters..."
          />
        </Form.Group>

        <Button type="submit" variant="primary">
          Submit Review
        </Button>
      </Form>
    </Container>
  );
};

export default WriteReview;