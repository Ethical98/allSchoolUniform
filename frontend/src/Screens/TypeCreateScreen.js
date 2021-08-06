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
import {
  TYPE_CREATE_RESET,
  TYPE_DETAILS_RESET,
  TYPE_UPDATE_RESET,
} from '../constants/typeConstants';
import {
  createType,
  listTypeDetails,
  updateType,
} from '../actions/typeActions';
import MaterialTable from 'material-table';

const TypeCreateScreen = ({ match, history }) => {
  const dispatch = useDispatch();

  const [typeName, setTypeName] = useState('');
  const [typeImage, setTypeImage] = useState('');
  const [sizeGuide, setSizeGuide] = useState('');
  const [sizeChart, setSizeChart] = useState('');
  const [variants, setVariants] = useState([]);
  const [uploadingTypeImage, setUploadingTypeImage] = useState(false);
  const [uploadingSizeGuide, setUploadingSizeGuide] = useState(false);
  const [uploadingSizeChart, setUploadingSizeChart] = useState(false);

  const typeCreate = useSelector((state) => state.typeCreate);
  const { loading, error, success } = typeCreate;

  const variantColumns = [
    {
      title: '#',
      field: 'tableData.id',
      editable: 'onAdd',

      render: (rowData) => rowData.tableData.id + 1,
    },
    { title: 'Size', field: 'size' },
  ];

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
      dispatch({ type: TYPE_CREATE_RESET });
      history.push('/admin/typelist');
    }
  }, [dispatch, history, success]);

  const uploadSizeGuideFileHandler = async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('image', file);
    setUploadingSizeGuide(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await axios.post('/api/upload', formData, config);

      setSizeGuide(data);
      setUploadingSizeGuide(false);
    } catch (error) {
      console.error(error);
      setUploadingSizeGuide(false);
    }
  };

  const uploadSizeChartFileHandler = async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('image', file);
    setUploadingSizeChart(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await axios.post('/api/upload', formData, config);

      setSizeChart(data);
      setUploadingSizeChart(false);
    } catch (error) {
      console.error(error);
      setUploadingSizeChart(false);
    }
  };

  const uploadTypeImageFileHandler = async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('image', file);
    setUploadingTypeImage(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await axios.post('/api/upload', formData, config);

      setTypeImage(data);
      setUploadingTypeImage(false);
    } catch (error) {
      console.error(error);
      setUploadingTypeImage(false);
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    dispatch(
      createType({
        typeName,
        typeImage,
        sizeGuide,
        sizeChart,
        variants,
      })
    );
  };
  return (
    <>
      <Link to='/admin/typelist' className='btn btn-outline-dark my-3'>
        Go Back
      </Link>
      <Container>
        <h1>CREATE TYPE</h1>
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Row>
              <Col md={4}>
                <FloatingLabel className='mb-3' controlId='name' label='Name'>
                  <Form.Control
                    className='mb-3'
                    required
                    type='name'
                    placeholder='Name'
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <FloatingLabel
                  controlId='typeImage'
                  label='Type Image Url'
                  className='mb-3'
                >
                  <Form.Control
                    required
                    type='text'
                    placeholder='Enter Image url '
                    value={typeImage}
                    onChange={(e) => setTypeImage(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>

                {uploadingTypeImage && <Loader />}
                <Form.Group controlId='formFile' className='mb-3'>
                  <Form.Label>Upload Size Guide</Form.Label>
                  <Form.Control
                    type='file'
                    custom
                    onChange={uploadTypeImageFileHandler}
                  />
                </Form.Group>
                <FloatingLabel
                  controlId='sizeGuide'
                  label='Size Guide Url'
                  className='mb-3'
                >
                  <Form.Control
                    required
                    type='text'
                    placeholder='Enter Size Guide url '
                    value={sizeGuide}
                    onChange={(e) => setSizeGuide(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                {uploadingSizeGuide && <Loader />}
                <Form.Group controlId='formFile' className='mb-3'>
                  <Form.Label>Upload Size Guide</Form.Label>
                  <Form.Control
                    type='file'
                    custom
                    onChange={uploadSizeGuideFileHandler}
                  />
                </Form.Group>
                <FloatingLabel
                  controlId='sizeChart'
                  label='Size Chart Url'
                  className='mb-3'
                >
                  <Form.Control
                    required
                    type='text'
                    placeholder='Enter Size Chart url '
                    value={sizeChart}
                    onChange={(e) => setSizeChart(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                {uploadingSizeChart && <Loader />}
                <Form.Group controlId='formFile' className='mb-3'>
                  <Form.Label>Upload Size Chart</Form.Label>
                  <Form.Control
                    type='file'
                    custom
                    onChange={uploadSizeChartFileHandler}
                  />
                </Form.Group>
              </Col>
              <Col className='mb-3'>
                <MaterialTable
                  title='Variants'
                  columns={variantColumns}
                  data={variants}
                  options={{
                    paging: false,
                    actionsColumnIndex: -1,
                  }}
                  editable={{
                    onRowAdd: (newData) =>
                      new Promise((resolve, reject) => {
                        setTimeout(() => {
                          console.log(newData);
                          setVariants([...variants, newData]);

                          resolve();
                        }, 1000);
                      }),
                    onRowUpdate: (newData, oldData) =>
                      new Promise((resolve, reject) => {
                        setTimeout(() => {
                          const dataUpdate = [...variants];
                          const index = oldData.tableData.id;
                          dataUpdate[index] = newData;
                          setVariants([...dataUpdate]);

                          resolve();
                        }, 1000);
                      }),
                    onRowDelete: (oldData) =>
                      new Promise((resolve, reject) => {
                        setTimeout(() => {
                          const dataDelete = [...variants];
                          const index = oldData.tableData.id;
                          dataDelete.splice(index, 1);
                          setVariants([...dataDelete]);

                          resolve();
                        }, 1000);
                      }),
                  }}
                />
              </Col>
            </Row>
            <Row className='justify-content-md-center'>
              <Col md={5} className='text-center'>
                <Button variant='dark' type='submit' className='col-12'>
                  CREATE
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Container>
    </>
  );
};

export default TypeCreateScreen;
