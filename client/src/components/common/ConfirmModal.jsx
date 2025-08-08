import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';

const ConfirmModal = ({ 
  show, 
  onHide, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Yes',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <FaExclamationTriangle className="text-warning me-2" />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-end gap-2" style={{ flexWrap: 'nowrap' }}>
        <Button variant="secondary" onClick={onHide} style={{ minWidth: '80px' }}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} style={{ minWidth: '80px' }}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;