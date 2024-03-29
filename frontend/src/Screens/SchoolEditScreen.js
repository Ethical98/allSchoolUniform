import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, FloatingLabel, Container } from 'react-bootstrap';
import Loader from '../components/Loader';
import FormContainer from '../components/FormContainer';
import { useDispatch, useSelector } from 'react-redux';
// Import axios from 'axios';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import jsonwebtoken from 'jsonwebtoken';
import { logout } from '../actions/userActions';
import {
    SCHOOL_DETAILS_RESET,
    SCHOOL_IMAGE_UPLOAD_RESET,
    SCHOOL_NAME_LIST_RESET,
    SCHOOL_UPDATE_RESET
} from '../constants/schoolConstants';
import { listSchoolDetails, updateSchool } from '../actions/schoolActions';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import DialogBox from '../components/DialogBox';
import ImageUploader from '../components/ImageUploader';
import { replace } from 'lodash';

const SchoolEditScreen = ({ match, history }) => {
    const schoolId = match.params.id;

    const dispatch = useDispatch();

    const [showImageUploader, setShowImageUploader] = useState(false);

    const [contact, setContact] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
    const [address, setAddress] = useState('');
    // Const [uploading, setUploading] = useState(false);
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');

    const schoolDetails = useSelector((state) => state.schoolDetails);
    const { loading, error, school } = schoolDetails;

    const schoolUpdate = useSelector((state) => state.schoolUpdate);
    const { loading: loadingUpdate, error: errorUpdate, success: successUpdate } = schoolUpdate;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const schoolImageUpload = useSelector((state) => state.schoolImageUpload);
    const { url } = schoolImageUpload;

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
        if (successUpdate) {
            dispatch({ type: SCHOOL_UPDATE_RESET });
            dispatch({ type: SCHOOL_DETAILS_RESET });
            dispatch({ type: SCHOOL_NAME_LIST_RESET });
            history.push('/admin/schoollist');
        } else {
            if (!school.name || school._id !== schoolId) {
                dispatch(listSchoolDetails(schoolId));
            } else {
                setName(school.name);
                setLogo(school.logo);
                setAddress(school.address);
                setContact(school.contact);
                setIsActive(school.isActive);
                setState(school.state);
                setDescription(school.description);
                setEmail(school.email);
                setWebsite(school.website);
                setCity(school.city);
                setCountry(school.country);
            }
        }
    }, [dispatch, history, successUpdate, school, schoolId]);

    useEffect(() => {
        if (url) {
            setShowImageUploader(false);
            setLogo(url);
            dispatch({ type: SCHOOL_IMAGE_UPLOAD_RESET });
        }
    }, [url, dispatch]);

    // Const uploadFileHandler = async (e) => {
    //   Const file = e.target.files[0];

    //   Const formData = new FormData();
    //   FormData.append('image', file);
    //   SetUploading(true);
    //   Try {
    //     Const config = {
    //       Headers: {
    //         'Content-Type': 'multipart/form-data',
    //       },
    //     };

    //     Const { data } = await axios.post('/api/upload', formData, config);

    //     SetLogo(data);
    //     SetUploading(false);
    //   } catch (error) {
    //     Console.error(error);
    //     SetUploading(false);
    //   }
    // };

    const submitHandler = (e) => {
        e.preventDefault();
        window.scrollTo(0, 0);
        dispatch(updateSchool({ _id: schoolId, name, contact, address, isActive, logo }));
    };

    const closeImageUploaderHandle = () => {
        setShowImageUploader(false);
    };
    const showImageUploaderHandle = () => {
        setLogo('');
        setShowImageUploader(true);
    };
    console.log(name);
    return (
        <AdminPageLayout>
            <Meta title={'Edit School - AllSchoolUniform'} description={'Edit School Page'} />
            <Link to="/admin/schoollist" className="btn btn-outline-dark my-3">
                Go Back
            </Link>
            <Container>
                <h1>EDIT SCHOOL</h1>
                <FormContainer>
                    {loadingUpdate && <Loader />}
                    {errorUpdate && <Message variant="warning">{errorUpdate}</Message>}
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <Message variant="danger">{error}</Message>
                    ) : (
                        <Form onSubmit={submitHandler}>
                            <FloatingLabel className="mb-3" controlId="name" label="Name">
                                <Form.Control
                                    className="mb-3"
                                    required
                                    type="name"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) => setName(replace(e.target.value, /-|\s+/g, ' '))}
                                ></Form.Control>
                            </FloatingLabel>

                            <FloatingLabel className="mb-3" label="Contact" controlId="contact">
                                <Form.Control
                                    className="mb-3"
                                    required
                                    type="phone"
                                    placeholder="Contact"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                ></Form.Control>
                            </FloatingLabel>
                            <FloatingLabel className="mb-3" label="Email" controlId="email">
                                <Form.Control
                                    className="mb-3"
                                    required
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                ></Form.Control>
                            </FloatingLabel>
                            <FloatingLabel className="mb-3" label="Website" controlId="website">
                                <Form.Control
                                    className="mb-3"
                                    required
                                    type="text"
                                    placeholder="Website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                ></Form.Control>
                            </FloatingLabel>
                            <FloatingLabel controlId="description" label="Description" className="mb-3">
                                <Form.Control
                                    as="textarea"
                                    style={{ height: '100px' }}
                                    type="text"
                                    placeholder="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></Form.Control>
                            </FloatingLabel>
                            <FloatingLabel controlId="address" label="Address" className="mb-3">
                                <Form.Control
                                    required
                                    as="textarea"
                                    style={{ height: '100px' }}
                                    type="text"
                                    placeholder="Address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                ></Form.Control>
                            </FloatingLabel>
                            <FloatingLabel className="mb-3" label="State" controlId="state">
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder="State"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                ></Form.Control>
                            </FloatingLabel>
                            <FloatingLabel className="mb-3" label="City" controlId="city">
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                ></Form.Control>
                            </FloatingLabel>
                            <FloatingLabel className="mb-3" label="Country" controlId="country">
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder="Country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                ></Form.Control>
                            </FloatingLabel>

                            <FloatingLabel controlId="logo" label="Logo Url" className="mb-3">
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder="Enter Image url "
                                    value={logo}
                                    onChange={(e) => setLogo(e.target.value)}
                                ></Form.Control>
                            </FloatingLabel>
                            {/* {uploading && <Loader />}
              <Form.Group controlId='formFile' className='mb-3'>
                <Form.Label>Upload Image</Form.Label>
                <Form.Control type='file' custom onChange={uploadFileHandler} />
              </Form.Group> */}
                            <Button className="col-12 mb-3" variant="outline-dark" onClick={showImageUploaderHandle}>
                                Upload Images
                            </Button>
                            <DialogBox
                                size={'lg'}
                                handleClose={closeImageUploaderHandle}
                                show={showImageUploader}
                                title={'UPLOAD IMAGES'}
                            >
                                <ImageUploader setUrl={setLogo} url={logo} school />
                            </DialogBox>

                            <Form.Group controlId="isActive" className="mb-3">
                                <Form.Check
                                    className="mb-3"
                                    type="checkbox"
                                    label="Is Active"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                ></Form.Check>
                            </Form.Group>

                            <Row className="justify-content-md-center">
                                <Col className="text-center">
                                    <Button variant="dark" type="submit" className="col-12">
                                        UPDATE
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    )}
                </FormContainer>
            </Container>
        </AdminPageLayout>
    );
};

export default SchoolEditScreen;
