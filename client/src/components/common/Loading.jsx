import React from 'react';
import { Modal, Spinner } from 'react-bootstrap';

const Loading = ({ show, message = 'Loading...' }) => {
  if (!show) return null;
  
  return (
    <Modal show={show} centered backdrop="static" keyboard={false}>
      <Modal.Body className="text-center py-4">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p className="mb-0">{message}</p>
      </Modal.Body>
    </Modal>
  );
};

export default Loading;