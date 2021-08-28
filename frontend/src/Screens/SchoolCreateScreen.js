import React, { useEffect, useState } from 'react';
import {
  Form,
  Row,
  Col,
  Button,
  FloatingLabel,
  Container,
} from 'react-bootstrap';
import Loader from '../components/Loader';
import FormContainer from '../components/FormContainer';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import jsonwebtoken from 'jsonwebtoken';
import { logout } from '../actions/userActions';
import { SCHOOL_CREATE_RESET, SCHOOL_NAME_LIST_RESET } from '../constants/schoolConstants';
import { createSchool } from '../actions/schoolActions';

const SchoolCreateScreen = ({ history }) => {
  const dispatch = useDispatch();

  const [contact, setContact] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [address, setAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  const schoolCreate = useSelector((state) => state.schoolCreate);
  const { loading, error, success } = schoolCreate;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    }
  }, [history, userInfo]);

  useEffect(() => {
    if (userInfo && userInfo.token) {
      jsonwebtoken.verify(
        userInfo.token,
        process.env.REACT_APP_JWT_SECRET,
        (err, decoded) => {
          if (err) {
            dispatch(logout());
            history.push('/login');
          }
        }
      );
    }
  }, [dispatch, userInfo, history]);

  useEffect(() => {
    if (userInfo && !userInfo.isAdmin) {
      dispatch(logout());
      history.push('/login');
    }
  }, [dispatch, history, userInfo]);

  useEffect(() => {
    if (success) {
      dispatch({ type: SCHOOL_CREATE_RESET });
      dispatch({ type: SCHOOL_NAME_LIST_RESET });
      history.push('/admin/schoollist');
    }
  }, [dispatch, history, success]);

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await axios.post('/api/upload', formData, config);

      setLogo(data);
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    dispatch(
      createSchool({
        name,
        contact,
        address,
        isActive,
        logo,
        state,
        city,
        country,
        description,
        email,
        website,
      })
    );
  };
  return (
    <>
      <Link to='/admin/schoollist' className='btn btn-outline-dark my-3'>
        Go Back
      </Link>
      <Container>
        <h1>ADD SCHOOL</h1>
        <FormContainer>
          {loading ? (
            <Loader />
          ) : error ? (
            <Message variant='danger'>{error}</Message>
          ) : (
            <Form onSubmit={submitHandler}>
              <FloatingLabel className='mb-3' controlId='name' label='Name'>
                <Form.Control
                  className='mb-3'
                  required
                  type='name'
                  placeholder='Name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                ></Form.Control>
              </FloatingLabel>

              <FloatingLabel
                className='mb-3'
                label='Contact'
                controlId='contact'
              >
                <Form.Control
                  className='mb-3'
                  required
                  type='phone'
                  placeholder='Contact'
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                ></Form.Control>
              </FloatingLabel>

              <FloatingLabel className='mb-3' label='Email' controlId='email'>
                <Form.Control
                  className='mb-3'
                  required
                  type='email'
                  placeholder='Email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
              <FloatingLabel
                className='mb-3'
                label='Website'
                controlId='website'
              >
                <Form.Control
                  className='mb-3'
                  required
                  type='text'
                  placeholder='Website'
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
              <FloatingLabel
                controlId='description'
                label='Description'
                className='mb-3'
              >
                <Form.Control
                  as='textarea'
                  style={{ height: '100px' }}
                  type='text'
                  placeholder='Description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
              <FloatingLabel
                controlId='address'
                label='Address'
                className='mb-3'
              >
                <Form.Control
                  required
                  as='textarea'
                  style={{ height: '100px' }}
                  type='text'
                  placeholder='Address'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
              <FloatingLabel className='mb-3' label='State' controlId='state'>
                <Form.Control
                  required
                  type='text'
                  placeholder='State'
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
              <FloatingLabel className='mb-3' label='City' controlId='city'>
                <Form.Control
                  required
                  type='text'
                  placeholder='City'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
              <FloatingLabel
                className='mb-3'
                label='Country'
                controlId='country'
              >
                <Form.Control
                  required
                  type='text'
                  placeholder='Country'
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
              <FloatingLabel controlId='logo' label='Logo Url' className='mb-3'>
                <Form.Control
                  required
                  type='text'
                  placeholder='Enter Image url '
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                ></Form.Control>
              </FloatingLabel>
              {uploading && <Loader />}
              <Form.Group controlId='formFile' className='mb-3'>
                <Form.Label>Upload Image</Form.Label>
                <Form.Control type='file' custom onChange={uploadFileHandler} />
              </Form.Group>

              <Form.Group controlId='isActive' className='mb-3'>
                <Form.Check
                  className='mb-3'
                  type='checkbox'
                  label='Is Active'
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                ></Form.Check>
              </Form.Group>

              <Row className='justify-content-md-center'>
                <Col className='text-center'>
                  <Button variant='dark' type='submit' className='col-12'>
                    ADD SCHOOL
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </FormContainer>
      </Container>
    </>
  );
};

export default SchoolCreateScreen;
