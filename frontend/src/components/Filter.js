import React, { useState } from 'react';
import { Collapse, Card, Button } from 'react-bootstrap';
import OffCanvas from './OffCanvas';

const Filter = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className='d-block d-sm-none' style={{ marginBottom: '-99vh' }}>
      <Button
        variant='outline-dark'
        onClick={() => setOpen(!open)}
        aria-controls='example-collapse-text'
        aria-expanded={open}
      >
        Filters
      </Button>

      <Collapse in={open}>
        <Card>
          <OffCanvas />
        </Card>
      </Collapse>
    </div>
  );
};

export default Filter;
