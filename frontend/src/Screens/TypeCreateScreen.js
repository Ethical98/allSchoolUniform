import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, FloatingLabel, Container } from 'react-bootstrap';
import Loader from '../components/Loader';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import jsonwebtoken from 'jsonwebtoken';
import { logout } from '../actions/userActions';
import { TYPE_CREATE_RESET, TYPE_IMAGE_UPLOAD_RESET } from '../constants/typeConstants';
import { createType } from '../actions/typeActions';
import MaterialTable from 'material-table';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import DialogBox from '../components/DialogBox';
import ImageUploader from '../components/ImageUploader';

const TypeCreateScreen = ({ match, history }) => {
    const dispatch = useDispatch();

    const [showImageUploader, setShowImageUploader] = useState(false);

    const [typeName, setTypeName] = useState('');
    const [isActive, setIsActive] = useState('');
    const [typeImage, setTypeImage] = useState('');
    const [sizeGuide, setSizeGuide] = useState('');
    const [sizeChart, setSizeChart] = useState('');
    const [variants, setVariants] = useState([]);
    const [typeImageOne, setTypeImageOne] = useState(false);
    const [typeImageTwo, setTypeImageTwo] = useState(false);
    const [typeImageThree, setTypeImageThree] = useState(false);

    const typeCreate = useSelector(state => state.typeCreate);
    const { loading, error, success } = typeCreate;

    const variantColumns = [
        {
            title: '#',
            field: 'tableData.id',
            editable: 'onAdd',

            render: rowData => rowData.tableData.id + 1
        },
        { title: 'Size', field: 'size' },
        {
            title: 'Active',
            field: 'isActive',
            render: rowData =>
                rowData.isActive ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i>,
            editComponent: props => (
                <Form.Group controlId="isActive" className="mb-3">
                    <Form.Check
                        className="mb-3"
                        type="checkbox"
                        label="Is Active"
                        checked={props.value}
                        onChange={e => props.onChange(e.target.checked)}
                    ></Form.Check>
                </Form.Group>
            )
        }
    ];

    const userLogin = useSelector(state => state.userLogin);
    const { userInfo } = userLogin;

    const typeImageUpload = useSelector(state => state.typeImageUpload);
    const { imageOneUrl, imageTwoUrl, imageThreeUrl } = typeImageUpload;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);

    useEffect(() => {
        if (userInfo && userInfo.token) {
            jsonwebtoken.verify(userInfo.token, process.env.REACT_APP_JWT_SECRET, (err, decoded) => {
                if (err) {
                    dispatch(logout());
                    history.push('/login');
                }
            });
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

    useEffect(() => {
        if (imageOneUrl) {
            setTypeImage(imageOneUrl);
            setShowImageUploader(false);
            dispatch({ type: TYPE_IMAGE_UPLOAD_RESET });
        } else if (imageTwoUrl) {
            setSizeGuide(imageTwoUrl);
            setShowImageUploader(false);
            dispatch({ type: TYPE_IMAGE_UPLOAD_RESET });
        } else if (imageThreeUrl) {
            setSizeChart(imageThreeUrl);
            setShowImageUploader(false);
            dispatch({ type: TYPE_IMAGE_UPLOAD_RESET });
        }
    }, [imageOneUrl, imageTwoUrl, imageThreeUrl, dispatch]);

    // Const uploadSizeGuideFileHandler = async (e) => {
    //   Const file = e.target.files[0];

    //   Const formData = new FormData();
    //   FormData.append('image', file);
    //   SetUploadingSizeGuide(true);
    //   Try {
    //     Const config = {
    //       Headers: {
    //         'Content-Type': 'multipart/form-data',
    //       },
    //     };

    //     Const { data } = await axios.post('/api/upload', formData, config);

    //     SetSizeGuide(data);
    //     SetUploadingSizeGuide(false);
    //   } catch (error) {
    //     Console.error(error);
    //     SetUploadingSizeGuide(false);
    //   }
    // };

    // Const uploadSizeChartFileHandler = async (e) => {
    //   Const file = e.target.files[0];

    //   Const formData = new FormData();
    //   FormData.append('image', file);
    //   SetUploadingSizeChart(true);
    //   Try {
    //     Const config = {
    //       Headers: {
    //         'Content-Type': 'multipart/form-data',
    //       },
    //     };

    //     Const { data } = await axios.post('/api/upload', formData, config);

    //     SetSizeChart(data);
    //     SetUploadingSizeChart(false);
    //   } catch (error) {
    //     Console.error(error);
    //     SetUploadingSizeChart(false);
    //   }
    // };

    // Const uploadTypeImageFileHandler = async (e) => {
    //   Const file = e.target.files[0];

    //   Const formData = new FormData();
    //   FormData.append('image', file);
    //   SetUploadingTypeImage(true);
    //   Try {
    //     Const config = {
    //       Headers: {
    //         'Content-Type': 'multipart/form-data',
    //       },
    //     };

    //     Const { data } = await axios.post('/api/upload', formData, config);

    //     SetTypeImage(data);
    //     SetUploadingTypeImage(false);
    //   } catch (error) {
    //     Console.error(error);
    //     SetUploadingTypeImage(false);
    //   }
    // };

    const submitHandler = e => {
        e.preventDefault();
        window.scrollTo(0, 0);
        dispatch(
            createType({
                typeName,
                typeImage,
                sizeGuide,
                sizeChart,
                variants,
                isActive
            })
        );
    };

    const clearImageUrls = () => {
        setTypeImageOne(false);
        setTypeImageTwo(false);
        setTypeImageThree(false);
        setShowImageUploader(false);
    };

    const closeImageOneUploaderHandle = () => {
        clearImageUrls();
    };
    const showImageOneUploaderHandle = () => {
        setTypeImageOne(true);
        setTypeImageTwo(false);
        setTypeImageThree(false);
        setShowImageUploader(true);
    };

    const closeImageTwoUploaderHandle = () => {
        clearImageUrls();
    };

    const showImageTwoUploaderHandle = () => {
        setTypeImageOne(false);
        setTypeImageTwo(true);
        setTypeImageThree(false);
        setShowImageUploader(true);
    };

    const showImageThreeUploaderHandle = () => {
        setTypeImageOne(false);
        setTypeImageTwo(false);
        setTypeImageThree(true);
        setShowImageUploader(true);
    };

    const closeImageThreeUploaderHandle = () => {
        clearImageUrls();
    };

    return (
        <AdminPageLayout>
            <Meta title={'Add Product Type - AllSchoolUniform'} description={'New Product Type Page'} />
            <Link to="/admin/typelist" className="btn btn-outline-dark my-3">
                Go Back
            </Link>
            <Container>
                <h1>CREATE TYPE</h1>
                {loading ? (
                    <Loader />
                ) : error ? (
                    <Message variant="danger">{error}</Message>
                ) : (
                    <Form onSubmit={submitHandler}>
                        <Row>
                            <Col md={4}>
                                <FloatingLabel className="mb-3" controlId="name" label="Name">
                                    <Form.Control
                                        className="mb-3"
                                        required
                                        type="name"
                                        placeholder="Name"
                                        value={typeName}
                                        onChange={e => setTypeName(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>
                                <FloatingLabel controlId="typeImage" label="Type Image Url" className="mb-3">
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="Enter Image url "
                                        value={typeImage}
                                        onChange={e => setTypeImage(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>

                                {/* {uploadingTypeImage && <Loader />}
                <Form.Group controlId='formFile' className='mb-3'>
                  <Form.Label>Upload Size Guide</Form.Label>
                  <Form.Control
                    type='file'
                    custom
                    onChange={uploadTypeImageFileHandler}
                  />
                </Form.Group> */}
                                <Button
                                    className="col-12 mb-3"
                                    variant="outline-dark"
                                    onClick={showImageOneUploaderHandle}
                                >
                                    Upload Type Image
                                </Button>
                                <DialogBox
                                    size={'lg'}
                                    handleClose={closeImageOneUploaderHandle}
                                    show={showImageUploader}
                                    title={'UPLOAD IMAGES'}
                                >
                                    <ImageUploader
                                        typeImageOne={typeImageOne}
                                        typeImageTwo={typeImageTwo}
                                        typeImageThree={typeImageThree}
                                    />
                                </DialogBox>
                                <FloatingLabel controlId="sizeGuide" label="Size Guide Url" className="mb-3">
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="Enter Size Guide url "
                                        value={sizeGuide}
                                        onChange={e => setSizeGuide(e.target.value)}
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
                                    className="col-12 mb-3"
                                    variant="outline-dark"
                                    onClick={showImageTwoUploaderHandle}
                                >
                                    Upload Size Guide
                                </Button>
                                <DialogBox
                                    size={'lg'}
                                    handleClose={closeImageTwoUploaderHandle}
                                    show={showImageUploader}
                                    title={'UPLOAD IMAGES'}
                                >
                                    <ImageUploader
                                        typeImageOne={typeImageOne}
                                        typeImageTwo={typeImageTwo}
                                        typeImageThree={typeImageThree}
                                    />
                                </DialogBox>
                                <FloatingLabel controlId="sizeChart" label="Size Chart Url" className="mb-3">
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="Enter Size Chart url "
                                        value={sizeChart}
                                        onChange={e => setSizeChart(e.target.value)}
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
                                    className="col-12 mb-3"
                                    variant="outline-dark"
                                    onClick={showImageThreeUploaderHandle}
                                >
                                    Upload Size Chart
                                </Button>
                                <DialogBox
                                    size={'lg'}
                                    handleClose={closeImageThreeUploaderHandle}
                                    show={showImageUploader}
                                    title={'UPLOAD IMAGES'}
                                >
                                    <ImageUploader
                                        typeImageOne={typeImageOne}
                                        typeImageTwo={typeImageTwo}
                                        typeImageThree={typeImageThree}
                                    />
                                </DialogBox>
                                <Form.Group controlId="isActive" className="mb-3">
                                    <Form.Check
                                        className="mb-3"
                                        type="checkbox"
                                        label="Is Active"
                                        checked={isActive}
                                        onChange={e => setIsActive(e.target.checked)}
                                    ></Form.Check>
                                </Form.Group>
                            </Col>
                            <Col className="mb-3">
                                <MaterialTable
                                    title="Variants"
                                    columns={variantColumns}
                                    data={variants}
                                    options={{
                                        paging: false,
                                        actionsColumnIndex: -1
                                    }}
                                    editable={{
                                        onRowAdd: newData =>
                                            new Promise((resolve, reject) => {
                                                setTimeout(() => {
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
                                        onRowDelete: oldData =>
                                            new Promise((resolve, reject) => {
                                                setTimeout(() => {
                                                    const dataDelete = [...variants];
                                                    const index = oldData.tableData.id;
                                                    dataDelete.splice(index, 1);
                                                    setVariants([...dataDelete]);

                                                    resolve();
                                                }, 1000);
                                            })
                                    }}
                                />
                            </Col>
                        </Row>
                        <Row className="justify-content-md-center">
                            <Col md={5} className="text-center">
                                <Button variant="dark" type="submit" className="col-12">
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

export default TypeCreateScreen;
