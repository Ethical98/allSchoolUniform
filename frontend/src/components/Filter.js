import React, { useState } from 'react';
import { Collapse, Card, Button, Nav } from 'react-bootstrap';
import Accordion from './Accordion';
import { Route } from 'react-router-dom';
import OffCanvas from './OffCanvas';

const Filter = ({ match, history, location }) => {
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
