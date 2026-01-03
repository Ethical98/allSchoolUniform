import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, FloatingLabel, Container } from 'react-bootstrap';
import Loader from '../components/Loader';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import { logout } from '../actions/userActions';
import { TYPE_DETAILS_RESET, TYPE_IMAGE_UPLOAD_RESET, TYPE_UPDATE_RESET } from '../constants/typeConstants';
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

    const typeDetails = useSelector(state => state.typeDetails);
    const { loading, error, type } = typeDetails;

    const typeUpdate = useSelector(state => state.typeUpdate);
    const { loading: loadingUpdate, error: errorUpdate, success: successUpdate } = typeUpdate;

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
                rowData.isActive ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i>
            // EditComponent: (props) => (
            //   <Form.Group controlId='isActive' className='mb-3'>
            //     <Form.Check
            //       ClassName='mb-3'
            //       Type='checkbox'
            //       Label='Is Active'
            //       Checked={props.value}
            //       OnChange={(e) => props.onChange(e.target.checked)}
            //     ></Form.Check>
            //   </Form.Group>
            // ),
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
        if (userInfo && !userInfo.isAdmin) {
            // logout handled by 401 interceptor
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
        // SetShowImageTwoUploader(false);
        // SetShowImageThreeUploader(false);
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

    const submitHandler = e => {
        e.preventDefault();
        window.scrollTo(0, 0);
        dispatch(
            updateType({
                _id: typeId,
                typeName,
                typeImage,
                sizeGuide,
                sizeChart,
                variants: variants.sort((a, b) => (a.size > b.size ? 1 : b.size > a.size ? -1 : 0)),
                isActive
            })
        );
    };

    return (
        <AdminPageLayout>
            <Meta title={'Edit Product Type - AllSchoolUniform'} description={'Edit Product Type Page'} />
            <Link to="/admin/typelist" className="btn btn-outline-dark my-3">
                Go Back
            </Link>
            <Container>
                <h1>EDIT TYPE</h1>

                {loadingUpdate && <Loader />}
                {errorUpdate && <Message variant="warning">{errorUpdate}</Message>}
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
                                    show={showImageTwoUploader}
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
                                    show={showImageThreeUploader}
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
                                        // OnRowUpdate: (newData, oldData) =>
                                        //   New Promise((resolve, reject) => {
                                        //     SetTimeout(() => {
                                        //       Const dataUpdate = [...variants];
                                        //       Const index = oldData.tableData.id;
                                        //       DataUpdate[index] = newData;
                                        //       SetVariants([...dataUpdate]);

                                        //       Resolve();
                                        //     }, 1000);
                                        //   }),
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
