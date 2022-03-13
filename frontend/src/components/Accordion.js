import React, { useState, useEffect } from 'react';
import { Card, Form, ListGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { listClasses } from '../actions/classActions';
import useWindowDimensions from '../utils/useWindowDimensions';
import Filter from './Filter';
import { useLocation, useHistory, useParams } from 'react-router-dom';

const Accordion = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const history = useHistory();
  const { selectedschool } = useParams();
  window.scrollTo(0, 0);

  const { width } = useWindowDimensions();

  const classList = useSelector((state) => state.classList);
  const { masterClasses } = classList;

  const urlSearchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  const school = selectedschool ? selectedschool : params.school;

  const [pageNumber, setPageNumber] = useState(params.page);

  useEffect(() => {
    dispatch(listClasses());
  }, [dispatch]);

  const [category, setCategory] = useState(
    params.category ? params.category.split(',') : []
  );

  const [season, setSeason] = useState(
    params.season ? params.season.split(',') : []
  );
  const [standard, setStandard] = useState(
    params.class ? params.class.split(',') : []
  );

  const keyword = params.search ? params.search : '';

  useEffect(() => {
    if (category.length > 0 && season.length > 0 && standard.length > 0) {
      if (!pageNumber) {
        if (school) {
          history.push(
            `/products/schools/${school}?season=${season}&category=${category}&class=${standard}`
          );
        } else if (keyword) {
          history.push(
            `/products?search=${keyword}&season=${season}&category=${category}&class=${standard}`
          );
        } else {
          history.push(
            `/products?season=${season}&category=${category}&class=${standard}`
          );
        }
      }
    } else if (category.length > 0 && season.length > 0) {
      if (!pageNumber) {
        if (school) {
          history.push(
            `/products/schools/${school}?season=${season}&category=${category}`
          );
        } else if (keyword) {
          history.push(
            `/products?search=${keyword}&season=${season}&category=${category}`
          );
        } else {
          history.push(`/products?season=${season}&category=${category}`);
        }
      }
    } else if (category.length > 0 && standard.length > 0) {
      if (!pageNumber) {
        if (school) {
          history.push(
            `/products/schools/${school}?category=${category}&class=${standard}`
          );
        } else if (keyword) {
          history.push(
            `/products?search=${keyword}&category=${category}&class=${standard}`
          );
        } else {
          history.push(`/products?category=${category}&class=${standard}`);
        }
      }
    } else if (season.length > 0 && standard.length > 0) {
      if (!pageNumber) {
        if (school) {
          history.push(
            `/products/schools/${school}?season=${season}&class=${standard}`
          );
        } else if (keyword) {
          history.push(
            `/products?search=${keyword}&season=${season}&class=${standard}`
          );
        } else {
          history.push(`/products?season=${season}&class=${standard}`);
        }
      }
    } else if (season.length > 0) {
      if (!pageNumber) {
        if (school) {
          history.push(`/products/schools/${school}?season=${season}`);
        } else if (keyword) {
          history.push(`/products?search=${keyword}&season=${season}`);
        } else {
          history.push(`/products?season=${season}`);
        }
      }
    } else if (category.length > 0) {
      if (!pageNumber) {
        if (school) {
          history.push(`/products/schools/${school}?category=${category}`);
        } else if (keyword) {
          history.push(`/products?search=${keyword}&category=${category}`);
        } else {
          history.push(`/products?category=${category}`);
        }
      }
    } else if (standard.length > 0) {
      if (!pageNumber) {
        if (school) {
          history.push(`/products/schools/${school}?class=${standard}`);
        } else if (keyword) {
          history.push(`/products?search=${keyword}&class=${standard}`);
        } else {
          history.push(`/products?class=${standard}`);
        }
      }
    } else {
      if (school && pageNumber) {
        // history.push(`/products/schools/${school}?page=${pageNumber}`);
        history.replace({
          pathname: `/products/schools/${school}`,
          search: `page=${pageNumber}`,
        });
      } else if (school) {
        history.replace(`/products/schools/${school}`);
      }
      // else if (keyword) {
      //   history.replace(`/products?search=${keyword}`);
      //   setPageNumber('');
      // } else if (keyword && pageNumber) {
      //   history.replace({
      //     pathname: `/products`,
      //     search: `search=${keyword}&page=${pageNumber}`,
      //   });
      // }
      else if (pageNumber && !keyword) {
        history.replace(`/products?page=${pageNumber}`);
      } else if (!keyword) {
        history.replace('/products');
      }
    }
  }, [
    category,
    season,
    dispatch,
    standard,
    pageNumber,
    history,
    school,
    keyword,
  ]);

  const seasonChange = (x, checked) => {
    setPageNumber('');
    if (checked) {
      setSeason([...season, x]);
    } else {
      const dataDelete = [...season];
      const index = season.indexOf(x);
      dataDelete.splice(index, 1);
      setSeason([...dataDelete]);
    }
  };
  const categoryChange = (x, checked) => {
    setPageNumber('');
    if (checked) {
      setCategory([...category, x]);
    } else {
      const dataDelete = [...category];
      const index = category.indexOf(x);
      dataDelete.splice(index, 1);
      setCategory([...dataDelete]);
    }
  };
  const standardChange = (x, checked) => {
    setPageNumber('');
    if (checked) {
      setStandard([...standard, x]);
    } else {
      const index = standard.indexOf(x);
      const newClass = [...standard];
      newClass.splice(index, 1);
      setStandard(newClass);
      if (standard.length === 0) {
        setStandard('');
      }
    }
  };

  return (
    <div>
      {width < 575.98 ? (
        <Filter
          page={pageNumber}
          setPage={setPageNumber}
          season={season}
          category={category}
          standard={standard}
          setStandard={setStandard}
          setCategory={setCategory}
          setSeason={setSeason}
          classes={masterClasses}
        />
      ) : (
        <Card id='Acc'>
          {/* <Card.Header className='text-center'>
            Buy Uniform in 3 Easy Steps
          </Card.Header>
          <div>
            <Form className='m-3'>
              <Form.Select as='select'>
                <option value=''>Select State</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
              </Form.Select>
            </Form>
            <Form className='m-3'>
              <Form.Select as='select'>
                <option value=''>Select City</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
              </Form.Select>
            </Form>
            <Form className='m-3'>
              <Form.Select as='select'>
                <option value=''>Select School</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
              </Form.Select>
            </Form>
          </div> */}
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
                checked={category.includes('Boys')}
                name='Category'
                type='checkbox'
                value='Boys'
                label='Boys'
                onChange={(event) =>
                  categoryChange(event.target.value, event.target.checked)
                }
              ></Form.Check>
              <Form.Check
                checked={category.includes('Girls')}
                name='Category'
                type='checkbox'
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
                checked={season.includes('Winter')}
                name='Seasonal'
                type='checkbox'
                value='Winter'
                label='Winter'
                onChange={(event) =>
                  seasonChange(event.target.value, event.target.checked)
                }
              />
              <Form.Check
                checked={season.includes('Summer')}
                name='Seasonal'
                type='checkbox'
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
              <ListGroup.Item style={{ border: 0 }}>
                {masterClasses &&
                  masterClasses.map(
                    (x) =>
                      x.isActive === true && (
                        <Form.Check
                          checked={standard.includes(x.class)}
                          key={x._id}
                          value={x.class}
                          type='checkbox'
                          label={x.class}
                          onChange={(e) =>
                            standardChange(x.class, e.target.checked)
                          }
                        />
                      )
                  )}
              </ListGroup.Item>
            </ListGroup>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Accordion;
