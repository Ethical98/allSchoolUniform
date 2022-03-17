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
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import jsonwebtoken from 'jsonwebtoken';
import { logout } from '../actions/userActions';
import {
  TYPE_DETAILS_RESET,
  TYPE_IMAGE_UPLOAD_RESET,
  TYPE_UPDATE_RESET,
} from '../constants/typeConstants';
import { listTypeDetails, updateType } from '../actions/typeActions';
import MaterialTable from 'material-table';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import DialogBox from '../components/DialogBox';
import ImageUploader from '../components/ImageUploader';

const TypeEditScreen = ({ match, history }) => {
  const typeId = match.params.id;

  const dispatch = useDispatch();

  const [showImageOneUploader, setShowImageOneUploader] = useState(false);
  const [showImageTwoUploader, setShowImageTwoUploader] = useState(false);
  const [showImageThreeUploader, setShowImageThreeUploader] = useState(false);

  const [typeName, setTypeName] = useState('');
  const [typeImage, setTypeImage] = useState('');
  const [sizeGuide, setSizeGuide] = useState('');
  const [sizeChart, setSizeChart] = useState('');
  const [variants, setVariants] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [typeImageOne, setTypeImageOne] = useState(false);
  const [typeImageTwo, setTypeImageTwo] = useState(false);
  const [typeImageThree, setTypeImageThree] = useState(false);

  const typeDetails = useSelector((state) => state.typeDetails);
  const { loading, error, type } = typeDetails;

  const typeUpdate = useSelector((state) => state.typeUpdate);
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = typeUpdate;

  const variantColumns = [
    {
      title: '#',
      field: 'tableData.id',
      editable: 'onAdd',

      render: (rowData) => rowData.tableData.id + 1,
    },
    { title: 'Size', field: 'size' },
    {
      title: 'Active',
      field: 'isActive',
      render: (rowData) =>
        rowData.isActive ? (
          <i className='fas fa-check'></i>
        ) : (
          <i className='fas fa-times'></i>
        ),
      // editComponent: (props) => (
      //   <Form.Group controlId='isActive' className='mb-3'>
      //     <Form.Check
      //       className='mb-3'
      //       type='checkbox'
      //       label='Is Active'
      //       checked={props.value}
      //       onChange={(e) => props.onChange(e.target.checked)}
      //     ></Form.Check>
      //   </Form.Group>
      // ),
    },
  ];

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const typeImageUpload = useSelector((state) => state.typeImageUpload);
  const { imageOneUrl, imageTwoUrl, imageThreeUrl } = typeImageUpload;

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
    if (successUpdate) {
      dispatch({ type: TYPE_UPDATE_RESET });
      dispatch({ type: TYPE_DETAILS_RESET });
      history.push('/admin/typelist');
    } else {
      if (!type.type || type._id !== typeId) {
        dispatch(listTypeDetails(typeId));
      } else {
        setTypeName(type.type);
        setTypeImage(type.image);
        setSizeGuide(type.sizeGuide);
        setSizeChart(type.sizeChart);
        setVariants([...type.variants]);
        setIsActive(type.isActive);
      }
    }
  }, [dispatch, history, successUpdate, type, typeId]);

  useEffect(() => {
    if (imageOneUrl) {
      setTypeImage(imageOneUrl);
      setShowImageOneUploader(false);
      dispatch({ type: TYPE_IMAGE_UPLOAD_RESET });
    } else if (imageTwoUrl) {
      setSizeGuide(imageTwoUrl);
      setShowImageTwoUploader(false);
      dispatch({ type: TYPE_IMAGE_UPLOAD_RESET });
    } else if (imageThreeUrl) {
      setSizeChart(imageThreeUrl);
      setShowImageThreeUploader(false);
      dispatch({ type: TYPE_IMAGE_UPLOAD_RESET });
    }
  }, [imageOneUrl, imageTwoUrl, imageThreeUrl, dispatch]);

  // const uploadSizeGuideFileHandler = async (e) => {
  //   const file = e.target.files[0];

  //   const formData = new FormData();
  //   formData.append('image', file);
  //   setUploadingSizeGuide(true);
  //   try {
  //     const config = {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     };

  //     const { data } = await axios.post('/api/upload', formData, config);

  //     setSizeGuide(data);
  //     setUploadingSizeGuide(false);
  //   } catch (error) {
  //     console.error(error);
  //     setUploadingSizeGuide(false);
  //   }
  // };

  // const uploadSizeChartFileHandler = async (e) => {
  //   const file = e.target.files[0];

  //   const formData = new FormData();
  //   formData.append('image', file);
  //   setUploadingSizeChart(true);
  //   try {
  //     const config = {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     };

  //     const { data } = await axios.post('/api/upload', formData, config);

  //     setSizeChart(data);
  //     setUploadingSizeChart(false);
  //   } catch (error) {
  //     console.error(error);
  //     setUploadingSizeChart(false);
  //   }
  // };

  // const uploadTypeImageFileHandler = async (e) => {
  //   const file = e.target.files[0];

  //   const formData = new FormData();
  //   formData.append('image', file);
  //   setUploadingTypeImage(true);
  //   try {
  //     const config = {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     };

  //     const { data } = await axios.post('/api/upload', formData, config);

  //     setTypeImage(data);
  //     setUploadingTypeImage(false);
  //   } catch (error) {
  //     console.error(error);
  //     setUploadingTypeImage(false);
  //   }
  // };

  const clearImageUrls = () => {
    setTypeImageOne(false);
    setTypeImageTwo(false);
    setTypeImageThree(false);
    setShowImageOneUploader(false);
    setShowImageTwoUploader(false);
    setShowImageThreeUploader(false);
  };

  const closeImageOneUploaderHandle = () => {
    clearImageUrls();
  };
  const showImageOneUploaderHandle = () => {
    setTypeImageOne(true);
    setTypeImageTwo(false);
    setTypeImageThree(false);
    setShowImageOneUploader(true);
    // setShowImageTwoUploader(false);
    // setShowImageThreeUploader(false);
  };

  const closeImageTwoUploaderHandle = () => {
    clearImageUrls();
  };

  const showImageTwoUploaderHandle = () => {
    setTypeImageOne(false);
    setTypeImageTwo(true);
    setTypeImageThree(false);
    setShowImageTwoUploader(true);
  };

  const showImageThreeUploaderHandle = () => {
    setTypeImageOne(false);
    setTypeImageTwo(false);
    setTypeImageThree(true);
    setShowImageThreeUploader(true);
  };

  const closeImageThreeUploaderHandle = () => {
    clearImageUrls();
  };

  const submitHandler = (e) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    dispatch(
      updateType({
        _id: typeId,
        typeName,
        typeImage,
        sizeGuide,
        sizeChart,
        variants: variants.sort((a, b) => a.size - b.size),
        isActive,
      })
    );
  };

  return (
    <AdminPageLayout>
      <Meta
        title={'Edit Product Type - AllSchoolUniform'}
        description={'Edit Product Type Page'}
      />
      <Link to='/admin/typelist' className='btn btn-outline-dark my-3'>
        Go Back
      </Link>
      <Container>
        <h1>EDIT TYPE</h1>

        {loadingUpdate && <Loader />}
        {errorUpdate && <Message variant='warning'>{errorUpdate}</Message>}
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
                <Button
                  className='col-12 mb-3'
                  variant='outline-dark'
                  onClick={showImageOneUploaderHandle}
                >
                  Upload Type Image
                </Button>
                <DialogBox
                  size={'lg'}
                  handleClose={closeImageOneUploaderHandle}
                  show={showImageOneUploader}
                  title={'UPLOAD IMAGES'}
                >
                  <ImageUploader
                    typeImageOne={typeImageOne}
                    typeImageTwo={typeImageTwo}
                    typeImageThree={typeImageThree}
                  />
                </DialogBox>

                {/* {uploadingTypeImage && <Loader />}
                <Form.Group controlId='formFile' className='mb-3'>
                  <Form.Label>Upload Size Guide</Form.Label>
                  <Form.Control
                    type='file'
                    custom
                    onChange={uploadTypeImageFileHandler}
                  />
                </Form.Group> */}

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
                {/* {uploadingSizeGuide && <Loader />}
                <Form.Group controlId='formFile' className='mb-3'>
                  <Form.Label>Upload Size Guide</Form.Label>
                  <Form.Control
                    type='file'
                    custom
                    onChange={uploadSizeGuideFileHandler}
                  />
                </Form.Group> */}
                <Button
                  className='col-12 mb-3'
                  variant='outline-dark'
                  onClick={showImageTwoUploaderHandle}
                >
                  Upload Size Guide
                </Button>
                <DialogBox
                  size={'lg'}
                  handleClose={closeImageTwoUploaderHandle}
                  show={showImageTwoUploader}
                  title={'UPLOAD IMAGES'}
                >
                  <ImageUploader
                    typeImageOne={typeImageOne}
                    typeImageTwo={typeImageTwo}
                    typeImageThree={typeImageThree}
                  />
                </DialogBox>

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
                {/* {uploadingSizeChart && <Loader />}
                <Form.Group controlId='formFile' className='mb-3'>
                  <Form.Label>Upload Size Chart</Form.Label>
                  <Form.Control
                    type='file'
                    custom
                    onChange={uploadSizeChartFileHandler}
                  />
                </Form.Group> */}
                <Button
                  className='col-12 mb-3'
                  variant='outline-dark'
                  onClick={showImageThreeUploaderHandle}
                >
                  Upload Size Chart
                </Button>
                <DialogBox
                  size={'lg'}
                  handleClose={closeImageThreeUploaderHandle}
                  show={showImageThreeUploader}
                  title={'UPLOAD IMAGES'}
                >
                  <ImageUploader
                    typeImageOne={typeImageOne}
                    typeImageTwo={typeImageTwo}
                    typeImageThree={typeImageThree}
                  />
                </DialogBox>
                <Form.Group controlId='isActive' className='mb-3'>
                  <Form.Check
                    className='mb-3'
                    type='checkbox'
                    label='Is Active'
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  ></Form.Check>
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
                          setVariants([...variants, newData]);

                          resolve();
                        }, 1000);
                      }),
                    // onRowUpdate: (newData, oldData) =>
                    //   new Promise((resolve, reject) => {
                    //     setTimeout(() => {
                    //       const dataUpdate = [...variants];
                    //       const index = oldData.tableData.id;
                    //       dataUpdate[index] = newData;
                    //       setVariants([...dataUpdate]);

                    //       resolve();
                    //     }, 1000);
                    //   }),
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
                  UPDATE
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Container>
    </AdminPageLayout>
  );
};

export default TypeEditScreen;
