import React, { useState, useEffect } from 'react';
import { Card, Form, ListGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { filterProducts } from '../actions/productActions';
import { listClasses } from '../actions/classActions';

const Accordion = () => {
  const dispatch = useDispatch();

  const classList = useSelector((state) => state.classList);
  const { masterClasses } = classList;
  useEffect(() => {
    dispatch(listClasses());
  }, [dispatch]);

  const [category, setCategory] = useState('');
  const [season, setSeason] = useState('');
  const [standard, setStandard] = useState('');

  useEffect(() => {
    if (category && season && standard.length > 0) {
      dispatch(filterProducts(category, season, standard));
    } else if (category && season) {
      dispatch(filterProducts(category, season, null));
    } else if (category && standard.length > 0) {
      dispatch(filterProducts(category, null, standard));
    } else if (season && standard.length > 0) {
      dispatch(filterProducts(null, season, standard));
    } else if (season) {
      dispatch(filterProducts(null, season, null));
    } else if (category) {
      dispatch(filterProducts(category, null, null));
    } else if (standard.length > 0) {
      dispatch(filterProducts(null, null, standard));
    } else {
      dispatch(filterProducts(null, null, null));
    }
  }, [category, season, standard.length, dispatch, standard]);

  const seasonChange = (x, checked) => {
    if (checked) {
      setSeason(x);
    } else {
      setSeason('');
    }
  };
  const categoryChange = (x, checked) => {
    if (checked) {
      setCategory(x);
    } else {
      setCategory('');
    }
  };
  const standardChange = (x, checked) => {
    if (checked) {
      setStandard([...standard, x]);
    } else {
      const index = standard.indexOf(x);
      standard.splice(index, 1);
      if (standard.length === 0) {
        setStandard('');
      }
    }
  };

  return (
    <div className='.d-none .d-md-block'>
      <Card id='Acc' className='d-sm-none d-md-block'>
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
          <i className='fas fa-arrow-circle-down float-end'></i>
          <i className='fas fa-arrow-circle-right float-end'></i>
        </Card.Header>
        <div id='ProductCategory' className='collapse show'>
          <Form className='m-3'>
            <Form.Check
              name='Category'
              type='radio'
              value='Boys'
              label='Boys'
              onChange={(event) =>
                categoryChange(event.target.value, event.target.checked)
              }
            ></Form.Check>
            <Form.Check
              name='Category'
              type='radio'
              value='Girls'
              label='Girls'
              onChange={(event) =>
                categoryChange(event.target.value, event.target.checked)
              }
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
          <i className='fas fa-arrow-circle-down float-end'></i>
          <i className='fas fa-arrow-circle-right float-end'></i>
        </Card.Header>
        <div id='SeasonalClothing' className='collapse show'>
          <Form className='m-3'>
            <Form.Check
              name='Seasonal'
              type='radio'
              value='Winter'
              label='Winter'
              onChange={(event) =>
                seasonChange(event.target.value, event.target.checked)
              }
            />
            <Form.Check
              name='Seasonal'
              type='radio'
              value='Summer'
              label='Summer'
              onChange={(event) =>
                seasonChange(event.target.value, event.target.checked)
              }
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
          <i className='fas fa-arrow-circle-down float-end'></i>
          <i className='fas fa-arrow-circle-right float-end'></i>
        </Card.Header>
        <div id='Class' className='collapse show'>
          <ListGroup>
            <ListGroup.Item>
              {masterClasses &&
                masterClasses.map((x) => {
                  return (
                    <Form.Check
                      key={x._id}
                      value={x.class}
                      type='checkbox'
                      label={x.class}
                      onChange={(e) =>
                        standardChange(x.class, e.target.checked)
                      }
                    />
                  );
                })}
            </ListGroup.Item>
          </ListGroup>
        </div>
      </Card>
    </div>
  );
};

export default Accordion;
