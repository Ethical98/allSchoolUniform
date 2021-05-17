import React, { useState } from 'react';
import { Card, Form } from 'react-bootstrap';


const Accordion = () => {
  const [selected, setSelected] = useState('');
  return (
    <div>
      <Card className=' d-sm-block accordionCard m-2 ' id='Acc'>
        <Card.Header className='text-center'>
          Buy Uniform in 3 Easy Steps
        </Card.Header>
        <div>
          <Form className='m-3'>
            <Form.Control as='select'>
              <option value=''>Select State</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </Form.Control>
          </Form>
          <Form className='m-3'>
            <Form.Control as='select'>
              <option value=''>Select City</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </Form.Control>
          </Form>
          <Form className='m-3'>
            <Form.Control as='select'>
              <option value=''>Select School</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </Form.Control>
          </Form>
        </div>
        <Card.Header
          data-bs-toggle='collapse'
          href='#ProductCategory'
          role='button'
          aria-expanded='true'
          aria-controls='ProductCategory'
        >
          Product Category
          <i className='fas fa-arrow-circle-down float-right'></i>
          <i className='fas fa-arrow-circle-right float-right'></i>
        </Card.Header>
        <div id='ProductCategory' className='collapse show'>
          <Form className='m-3'>
            <Form.Check
              name='Category'
              type='radio'
              value='boysUniform'
              label='Boys Uniform'
              onChange={(event) => setSelected(event.target.value)}
            ></Form.Check>
            <Form.Check
              name='Category'
              type='radio'
              value='girlsUniform'
              label='Girls Uniform'
              onChange={(event) => setSelected(event.target.value)}
            ></Form.Check>
          </Form>
        </div>
        <Card.Header
          data-bs-toggle='collapse'
          href='#SeasonalClothing'
          role='button'
          aria-expanded='true'
          aria-controls='SeasonalClothing'
        >
          Seasonal Clothing
          <i className='fas fa-arrow-circle-down float-right'></i>
          <i className='fas fa-arrow-circle-right float-right'></i>
        </Card.Header>
        <div id='SeasonalClothing' className='collapse show'>
          <Form className='m-3'>
            <Form.Check
              name='Seasonal'
              type='radio'
              value='WinterUniform'
              label='Winter Uniform'
              onChange={(event) => setSelected(event.target.value)}
            />
            <Form.Check
              name='Seasonal'
              type='radio'
              value='SummerUniform'
              label='Summer Uniform'
              onChange={(event) => setSelected(event.target.value)}
            />
          </Form>
        </div>
        <Card.Header
          data-bs-toggle='collapse'
          href='#Class'
          role='button'
          aria-expanded='true'
          aria-controls='Class'
        >
          Class
          <i className='fas fa-arrow-circle-down float-right'></i>
          <i className='fas fa-arrow-circle-right float-right'></i>
        </Card.Header>
        <div id='Class' className='collapse show'>
          <Form className='m-3'>
            <Form.Control as='select'>
              <option value=''>Select Class</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </Form.Control>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default Accordion;
