import React from 'react';
import { Modal } from 'react-bootstrap';

const DialogBox = ({ size = '', children, handleClose, show, title, footer, fullscreen = false }) => {
    return (
        <Modal size={size} show={show} fullscreen={fullscreen} onHide={handleClose} backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
            <Modal.Footer>{footer}</Modal.Footer>
        </Modal>
    );
};

export default DialogBox;
