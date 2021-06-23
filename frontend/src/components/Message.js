import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';

const Message = ({ variant, children }) => {
  const [show, setShow] = useState(true);

  return (
    <div>
      {show && (
        <Alert variant={variant} onClose={() => setShow(false)} dismissible>
          {children}
        </Alert>
      )}
    </div>
  );
};

Message.defaultProps = {
  variant: 'info',
};

export default Message;
