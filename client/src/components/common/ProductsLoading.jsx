import React from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';

const ProductsLoading = () => {
  return (
    <Container className="py-5">
      <Row>
        <Col lg={12} className="text-center mb-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading products...</p>
        </Col>
      </Row>
      <Row>
        {[1, 2, 3, 4].map((item) => (
          <Col lg={3} md={6} sm={12} key={item} className="mb-4">
            <Card className="h-100">
              <div 
                style={{ 
                  height: '200px', 
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Spinner animation="border" size="sm" />
              </div>
              <Card.Body>
                <div 
                  style={{ 
                    height: '20px', 
                    backgroundColor: '#e9ecef', 
                    marginBottom: '10px',
                    borderRadius: '4px'
                  }}
                />
                <div 
                  style={{ 
                    height: '15px', 
                    backgroundColor: '#e9ecef', 
                    width: '60%',
                    borderRadius: '4px'
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ProductsLoading;