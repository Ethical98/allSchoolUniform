import React, { useState } from 'react';
import { Collapse, Card, Button, Nav } from 'react-bootstrap';
import Accordion from './Accordion';
import { Route } from 'react-router-dom';
import OffCanvas from './OffCanvas';

const Filter = ({ match, history, location }) => {
  const [open, setOpen] = useState(false);
  //   function CustomToggle({ children, eventKey }) {
  //     const decoratedOnClick = useAccordionButton(eventKey, () =>
  //       console.log('totally custom!')
  //     );

  //     return (
  //       <Button type='button' onClick={decoratedOnClick}>
  //         {children}
  //       </Button>
  //     );
  //   }

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
