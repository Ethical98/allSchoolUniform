import React from 'react';
import { Offcanvas } from 'react-bootstrap';
import './css/OffCanvas.css';

const OffCanvas = ({
  handleOffCanvasClose,
  showOffCanvas,
  userInfo,
  handleShow,
  children,
}) => {
  return (
    <div>
      <Offcanvas
        className='d-block d-sm-none'
        show={showOffCanvas}
        onHide={handleOffCanvasClose}
        style={{ width: '250px', height: '100vh' }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            {userInfo ? (
              userInfo.name
            ) : (
              <a href='/login'>
                <i className='fas fa-user'></i> SIGN IN
              </a>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {children}
          {/* <Route
            render={({ history, location, match }) => (
              <Accordion history={history} location={location} match={match} />
            )}
          /> */}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default OffCanvas;
