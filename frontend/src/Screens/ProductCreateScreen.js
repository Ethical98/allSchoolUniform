import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Form,
  Col,
  Row,
  Container,
  FloatingLabel,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';
import jsonwebtoken from 'jsonwebtoken';
import { listClasses } from '../actions/classActions';
import { listTypeSizes, listTypes } from '../actions/typeActions';
import { listSchools } from '../actions/schoolActions';
import MaterialTable from 'material-table';
import { logout } from '../actions/userActions';
import { createProduct } from '../actions/productActions';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import ImageUploader from '../components/ImageUploader';
import Paginate from '../components/Paginate';
import DialogBox from '../components/DialogBox';
import { PRODUCT_IMAGE_UPLOAD_RESET } from '../constants/productConstants';

const ProductCreateScreen = ({ history, location }) => {
  const dispatch = useDispatch();

  const urlSearchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const pageNumber = params.page ? params.page : 1;

  const [showImageUploader, setShowImageUploader] = useState(false);
  const [name, setName] = useState('');
  // const [url, setUrl] = useState('');

  const [image, setImage] = useState('');
  const [type, setType] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [SKU, setSKU] = useState('');
  const [SEOKeywords, setSEOKeywords] = useState(undefined);
  //   const [masterClass, setMasterClass] = useState('');
  const [standard, setStandard] = useState([]);
  const [schoolName, setSchoolName] = useState([]);
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [message, setMessage] = useState('');

  const [masterSize, setMasterSize] = useState([]);
  // const [uploading, setUploading] = useState(false);

  // const [masterType, setMasterType] = useState('');

  const sizeTableColumns = [
    {
      title: 'Size',
      field: 'size',
      // editable: 'onAdd',
      readonly: true,
    },
    {
      title: 'InStock',
      field: 'countInStock',
    },
    {
      title: 'Price',
      field: 'price',
    },
    {
      title: 'Opening Qty',
      field: 'openingQty',
    },
    {
      title: 'Alert On Qty',
      field: 'alertOnQty',
    },
    {
      title: 'Discount',
      field: 'discount',
    },
    {
      title: 'Tax',
      field: 'tax',
    },
  ];

  const schoolTableColumns = [
    {
      title: 'Name',
      field: 'name',
    },
  ];

  // const uploadFileHandler = async (e) => {
  //   const file = e.target.files[0];

  //   const formData = new FormData();
  //   formData.append('image', file);
  //   setUploading(true);
  //   try {
  //     const config = {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     };

  //     const { data } = await axios.post('/api/upload', formData, config);

  //     setImage(data);
  //     setUploading(false);
  //   } catch (error) {
  //     console.error(error);
  //     setUploading(false);
  //   }
  // };

  const productCreate = useSelector((state) => state.productCreate);
  const { loading, error, success } = productCreate;

  const schoolList = useSelector((state) => state.schoolList);
  const { masterSchools, pages, page } = schoolList;

  const typeSizesList = useSelector((state) => state.typeSizesList);
  const {
    loading: loadingMasterSizes,
    error: errorMasterSizes,
    masterSizes,
  } = typeSizesList;

  const classList = useSelector((state) => state.classList);
  const {
    loading: loadingMasterClasses,
    error: errorMasterClasses,
    masterClasses,
  } = classList;

  const typeList = useSelector((state) => state.typeList);
  const { masterTypes } = typeList;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const productImageUpload = useSelector((state) => state.productImageUpload);
  const { url } = productImageUpload;

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
      history.push('/admin/productlist');
    }

    dispatch(listClasses());
    dispatch(listTypes());
    dispatch(listSchools(pageNumber));

    if (masterSizes && masterSizes.variants && type) {
      setMasterSize([...masterSizes.variants]);
    }
  }, [dispatch, masterSizes, type, success, history, pageNumber]);

  useEffect(() => {
    if (type) {
      dispatch(listTypeSizes(type));
    }
  }, [type, dispatch]);

  useEffect(() => {
    if (url) {
      setShowImageUploader(false);
      setImage(url);
      dispatch({ type: PRODUCT_IMAGE_UPLOAD_RESET });
    }
  }, [url, dispatch]);

  const submitHandler = (e) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    dispatch(
      createProduct({
        name,
        SKU,
        type,
        brand,
        season,
        size,
        category,
        image,
        standard,
        description,
        schoolName,
        isActive,
        SEOKeywords,
      })
    );
  };

  useEffect(() => {
    if (masterSize && size) {
      masterSize.forEach((x) => {
        x.price = size.some((y) => y.size === x.size)
          ? size[size.findIndex((y) => y.size === x.size)].price
          : 0;
        x.countInStock = size.some((y) => y.size === x.size)
          ? size[size.findIndex((y) => y.size === x.size)].countInStock
          : 0;
        x.alertOnQty = size.some((y) => y.size === x.size)
          ? size[size.findIndex((y) => y.size === x.size)].alertOnQty
          : 0;
        x.discount = size.some((y) => y.size === x.size)
          ? size[size.findIndex((y) => y.size === x.size)].discount
          : 0;
        x.openingQty = size.some((y) => y.size === x.size)
          ? size[size.findIndex((y) => y.size === x.size)].openingQty
          : 0;
        x.tax = size.some((y) => y.size === x.size)
          ? size[size.findIndex((y) => y.size === x.size)].tax
          : 0;
      });
    }
  }, [masterSize, size]);

  const classTableColumns = [
    {
      title: 'Class',
      field: 'class',
      editable: 'never',
    },
  ];

  const closeImageUploaderHandle = () => {
    setShowImageUploader(false);
  };
  const showImageUploaderHandle = () => {
    setShowImageUploader(true);
  };

  return (
    <AdminPageLayout>
      <Meta
        title={`Add Product - Allschooluniform`}
        description={'Add New Product Page'}
        keyword={
          'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,order,details'
        }
      />
      <Link to='/admin/productList' className='btn btn-outline-dark my-3'>
        Go Back
      </Link>
      <Container>
        <h1>CREATE PRODUCT</h1>
        {/* {message && <Message variant='danger'>{message}</Message>}
        {loadingUpdate && <Loader />} */}
        {/* {errorUpdate && <Message variant='warning'>{errorUpdate}</Message>} */}
        {loading ? (
          <Loader />
        ) : loadingMasterClasses ? (
          <Loader />
        ) : loadingMasterSizes ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Row>
              <Col md={3}>
                <FloatingLabel controlId='sku' label='SKU' className='mb-3'>
                  <Form.Control
                    required
                    type='text'
                    placeholder='Enter SKU'
                    value={SKU}
                    onChange={(e) => setSKU(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <FloatingLabel className='mb-3' label='Name' controlId='name'>
                  <Form.Control
                    required
                    type='name'
                    placeholder='Enter Name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <FloatingLabel
                  label='Category'
                  className='mb-3'
                  controlId='category'
                >
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value=''>Select Category</option>
                    <option value='Boys'>Boys</option>
                    <option value='Girls'>Girls</option>
                    <option value='Unisex'>Unisex</option>
                  </Form.Select>
                </FloatingLabel>
                <FloatingLabel
                  className='mb-3'
                  label='Season'
                  controlId='season'
                >
                  <Form.Select
                    required
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                  >
                    <option value=''>Select Season</option>
                    <option value='Summer'>Summer</option>
                    <option value='Winter'>Winter</option>
                    <option value='All Season'>All Season</option>
                  </Form.Select>
                </FloatingLabel>
                <FloatingLabel className='mb-3' label='Brand' controlId='brand'>
                  <Form.Control
                    required
                    type='text'
                    placeholder='Brand '
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <FloatingLabel label='Type' className='mb-3' controlId='type'>
                  <Form.Select
                    as='select'
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option>Select</option>
                    {masterTypes &&
                      masterTypes.map((x) => (
                        <option key={x.type} value={x.type}>
                          {x.type}
                        </option>
                      ))}
                  </Form.Select>
                </FloatingLabel>
                <FloatingLabel
                  label='Image Url'
                  className='mb-3'
                  controlId='image'
                >
                  <Form.Control
                    required
                    type='text'
                    placeholder='Image url '
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                {/* {uploading && <Loader />}
                <Form.Group controlId='formFile' className='mb-3'>
                  <Form.Label>Upload Image</Form.Label>
                  <Form.Control
                    type='file'
                    custom
                    onChange={uploadFileHandler}
                  />
                </Form.Group> */}
                {/* {schoolName.length === 0 && (
                  <Message variant={'warning'}>
                    Please Select Schools First
                  </Message>
                )} */}
                <Button
                  // disabled={schoolName.length === 0}
                  className='col-12 mb-3'
                  variant='outline-dark'
                  onClick={showImageUploaderHandle}
                >
                  Upload Images
                </Button>
                <DialogBox
                  size={'lg'}
                  handleClose={closeImageUploaderHandle}
                  show={showImageUploader}
                  title={'UPLOAD IMAGES'}
                >
                  <ImageUploader product={true} />
                </DialogBox>
                <FloatingLabel
                  label='Description'
                  className='mb-3'
                  controlId='description'
                >
                  <Form.Control
                    required
                    as='textarea'
                    style={{ height: '150px' }}
                    type='text'
                    placeholder='Enter Description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <FloatingLabel
                  controlId='seoKeywords'
                  label='SEO Keywords'
                  className='mb-3'
                >
                  <Form.Control
                    required
                    as='textarea'
                    style={{ height: '100px' }}
                    type='text'
                    placeholder='SEO Keywords'
                    value={SEOKeywords}
                    onChange={(e) => setSEOKeywords(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
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

              <Col md={9}>
                <Row>
                  {message && <Message variant='danger'>{message}</Message>}
                </Row>
                <Row>
                  {errorMasterSizes ? (
                    <Message variant='warning'>{errorMasterSizes}</Message>
                  ) : (
                    <Form.Group controlId='size'>
                      {masterSize && (
                        <MaterialTable
                          style={{
                            padding: '1%',
                            border: '3px solid grey',
                          }}
                          title='Size Variants'
                          data={masterSize}
                          columns={sizeTableColumns}
                          options={{
                            rowStyle: {
                              color: 'black',
                            },
                            cellStyle: {
                              border: '2px solid grey',
                            },

                            paging: false,

                            selection: true,
                            selectionProps: (rowData) => ({
                              checked:
                                size &&
                                size.some((x) => x.size === rowData.size)
                                  ? true
                                  : false,
                              color: 'primary',
                            }),

                            showTextRowsSelected: false,
                            actionsColumnIndex: -1,
                          }}
                          onSelectionChange={(data, selection) => {
                            if (
                              selection &&
                              selection.tableData &&
                              !selection.tableData.checked
                            ) {
                              const id = selection.tableData.id;

                              const dataDelete = [...size];

                              const index = size.findIndex(
                                (x) => x.size === masterSize[id].size
                              );
                              dataDelete.splice(index, 1);
                              setSize([...dataDelete]);
                            } else if (selection && data) {
                              setSize([...new Set([...size, selection])]);
                            } else {
                              setSize([...data]);
                            }
                          }}
                          editable={{
                            onRowUpdate: (newData, oldData) =>
                              new Promise((resolve, reject) => {
                                setMessage('');
                                setTimeout(() => {
                                  const dataUpdate = [...size];
                                  if (size) {
                                    const index = size.findIndex(
                                      (x) => x.size === oldData.size
                                    );
                                    if (index !== -1) {
                                      dataUpdate[index] = newData;
                                      setSize([...dataUpdate]);
                                    } else {
                                      setMessage('Please Select Size');
                                    }
                                  } else {
                                    setMessage('Please Select Size');
                                  }

                                  resolve();
                                }, 1000);
                              }),
                          }}
                        ></MaterialTable>
                      )}
                    </Form.Group>
                  )}
                </Row>
                <Row className='my-3'>
                  {errorMasterClasses ? (
                    <Message variant='warning'>{errorMasterClasses}</Message>
                  ) : (
                    <Col>
                      <Form.Group controlId='class'>
                        <Form.Label>Class</Form.Label>
                        {masterClasses && (
                          <MaterialTable
                            style={{
                              padding: '1%',
                              border: '3px solid grey',
                            }}
                            title='Class'
                            data={masterClasses}
                            columns={classTableColumns}
                            components={{
                              Toolbar: () => null,
                            }}
                            options={{
                              rowStyle: {
                                color: 'black',
                              },

                              paging: false,
                              selection: true,
                              search: false,
                              selectionProps: (rowData) => ({
                                checked: standard.includes(rowData.class),

                                color: 'primary',
                              }),
                            }}
                            onSelectionChange={(data, selection) => {
                              if (
                                selection &&
                                selection.tableData &&
                                !selection.tableData.checked
                              ) {
                                const id = selection.tableData.id;

                                const dataDelete = [...standard];

                                const index = standard.findIndex(
                                  (x) => x === masterClasses[id].class
                                );
                                dataDelete.splice(index, 1);
                                setStandard([...dataDelete]);
                              } else if (selection && selection.tableData) {
                                const id = selection.tableData.id;
                                setStandard([
                                  ...new Set([
                                    ...standard,
                                    masterClasses[id].class,
                                  ]),
                                ]);
                              } else {
                                const allClass = data.map((x) => x.class);
                                setStandard([...allClass]);
                              }
                            }}
                          ></MaterialTable>
                        )}
                      </Form.Group>
                    </Col>
                  )}
                  <Col>
                    <Form.Group className='ml-2' controlId='school'>
                      <Form.Label>Schools</Form.Label>
                      {masterSchools && (
                        <MaterialTable
                          data={masterSchools}
                          columns={schoolTableColumns}
                          style={{
                            padding: '1%',
                            border: '3px solid grey',
                            width: '40vw',
                          }}
                          components={{
                            Toolbar: () => null,
                          }}
                          options={{
                            rowStyle: {
                              color: 'black',
                            },

                            paging: false,
                            selection: true,
                            search: false,
                            selectionProps: (rowData) => ({
                              checked: schoolName.includes(rowData.name),

                              color: 'primary',
                            }),
                          }}
                          onSelectionChange={(data, selection) => {
                            if (
                              selection &&
                              selection.tableData &&
                              !selection.tableData.checked
                            ) {
                              const id = selection.tableData.id;
                              const dataDelete = [...schoolName];

                              const index = schoolName.findIndex(
                                (x) => x === masterSchools[id].name
                              );

                              dataDelete.splice(index, 1);
                              setSchoolName([...dataDelete]);
                            } else if (selection && selection.tableData) {
                              const id = selection.tableData.id;
                              setSchoolName([
                                ...new Set([
                                  ...schoolName,
                                  masterSchools[id].name,
                                ]),
                              ]);
                            } else {
                              const allSchool = data.map((x) => x.name);
                              setSchoolName([...schoolName, ...allSchool]);
                            }
                          }}
                        />
                      )}
                      <Paginate
                        addProduct={true}
                        pages={pages}
                        page={page}
                        isAdmin={true}
                      />
                    </Form.Group>
                  </Col>
                </Row>
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
    </AdminPageLayout>
  );
};

export default ProductCreateScreen;
