import React from 'react';
import { Modal } from 'react-bootstrap';

const DialogBox = ({
  children,
  handleClose,
  show,
  title,
  fullscreen = false,
}) => {
  return (
    <Modal
      show={show}
      fullscreen={fullscreen}
      onHide={handleClose}
      backdrop='static'
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
    </Modal>
  );
};

export default DialogBox;
