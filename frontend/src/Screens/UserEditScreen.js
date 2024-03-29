import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import jsonwebtoken from 'jsonwebtoken';
import { Button, Form, Table, Col, Row, Container, FloatingLabel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import { getUserDetails, updateUser, logout } from '../actions/userActions';
import { USER_UPDATE_RESET } from '../constants/userConstants';

import Loader from '../components/Loader';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';

const UserEditScreen = ({ history, match }) => {
    const dispatch = useDispatch();
    const userId = match.params.id;

    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isAdmin, setIsAdmin] = useState('');
    const [name, setName] = useState('');
    const [savedAddress, setSavedAddress] = useState('');
    const [addressEdit, setAddressEdit] = useState(false);
    const [editIndex, setEditIndex] = useState(0);
    const [state, setState] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [message, setMessage] = useState('');

    const userDetails = useSelector((state) => state.userDetails);
    const { loading, error, user } = userDetails;

    const userUpdate = useSelector((state) => state.userUpdate);
    const { loading: loadingUpdate, error: errorUpdate, successUpdate } = userUpdate;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

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
            dispatch({ type: USER_UPDATE_RESET });
            history.push('/admin/userlist');
        } else {
            if (!user.name || user._id !== userId) {
                dispatch(getUserDetails(userId));
            } else {
                setName(user.name);
                setEmail(user.email);
                setIsAdmin(user.isAdmin);
                setPhone(user.phone);
                setSavedAddress([...user.savedAddress]);
            }
        }
    }, [user, userId, dispatch, successUpdate, history]);

    const submitHandler = (e) => {
        console.log('helo');
        e.preventDefault();
        window.scrollTo(0, 0);
        dispatch(updateUser({ _id: userId, name, email, phone, isAdmin, savedAddress }));
    };

    const editAddress = (id, index) => {
        setEditIndex(id);
        setAddressEdit(true);
        setAddress(savedAddress[index].address);
        setCity(savedAddress[index].city);
        setPostalCode(savedAddress[index].postalCode);
        setState(savedAddress[index].state);
        setCountry(savedAddress[index].country);
    };

    const saveAddress = (index) => {
        if (address && city && postalCode && country && state) {
            savedAddress[index].address = address;
            savedAddress[index].city = city;
            savedAddress[index].postalCode = postalCode;
            savedAddress[index].country = country;
            saveAddress[index].state = state;
            setMessage('');
            setAddressEdit(false);
        } else {
            setMessage('Please Fill required fields');
        }
    };

    const deleteAddress = (index) => {
        const newSavedAddress = [...savedAddress];
        newSavedAddress.splice(index, 1);
        setSavedAddress(newSavedAddress);
    };

    return (
        <AdminPageLayout>
            <Meta title={'User Edit - AllSchoolUniform'} description={'User Edit Page'} />
            <Link to="/admin/userlist" className="btn btn-outline-dark my-3">
                Go Back
            </Link>
            <Container>
                <h1>EDIT USER</h1>
                {message && <Message variant="danger">{message}</Message>}
                {loadingUpdate && <Loader />}
                {errorUpdate && <Message variant="warning">{errorUpdate}</Message>}
                {loading ? (
                    <Loader />
                ) : error ? (
                    <Message variant="danger">{error}</Message>
                ) : (
                    <Form onSubmit={submitHandler}>
                        <Row>
                            <Col md={3}>
                                <FloatingLabel className="mb-3" controlId="email" label="Email">
                                    <Form.Control
                                        className="mb-3"
                                        required
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>

                                <FloatingLabel className="mb-3" label="Name" controlId="name">
                                    <Form.Control
                                        className="mb-3"
                                        required
                                        type="name"
                                        placeholder="Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>
                                <FloatingLabel className="mb-3" controlId="phone" label="Mobile">
                                    <Form.Control
                                        className="mb-3"
                                        required
                                        type="phone"
                                        placeholder="Mobile "
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>
                                <Form.Group controlId="isAdmin" className="mb-3">
                                    <Form.Check
                                        className="mb-3"
                                        type="checkbox"
                                        label="Is Admin"
                                        checked={isAdmin}
                                        onChange={(e) => setIsAdmin(e.target.checked)}
                                    ></Form.Check>
                                </Form.Group>
                            </Col>
                            <Col>
                                {savedAddress.length > 0 && (
                                    <Form.Group controlId="savedAddress">
                                        <Form.Label>Saved Address</Form.Label>
                                        <Table striped bordered hover responsive className="table-sm">
                                            <thead>
                                                <tr className="text-center">
                                                    <th className="col-sm-1">S.No.</th>
                                                    <th className="col-sm-3">ADDRESS</th>
                                                    <th className="col-sm-2">CITY</th>
                                                    <th className="col-sm-2">STATE</th>
                                                    <th className="col-sm-2">POSTAL CODE</th>
                                                    <th className="col-sm-2">COUNTRY</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {savedAddress.map((x, index) =>
                                                    !(x._id === editIndex && addressEdit) ? (
                                                        <tr key={x._id}>
                                                            <td className="align-middle">{index + 1}</td>
                                                            <td className="align-middle">{x.address}</td>
                                                            <td className="align-middle">{x.city}</td>
                                                            <td className="align-middle">{x.state}</td>
                                                            <td className="align-middle">{x.postalCode}</td>
                                                            <td className="align-middle">{x.country}</td>
                                                            <td>
                                                                <Button
                                                                    variant="light"
                                                                    className="btn-sm mx-2"
                                                                    onClick={() => editAddress(x._id, index)}
                                                                >
                                                                    <i className="fas fa-edit" />
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    className="btn-sm mx-2"
                                                                    onClick={() => deleteAddress(index)}
                                                                >
                                                                    <i className="fas fa-trash" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        <tr>
                                                            <td>{index + 1}</td>

                                                            <td>
                                                                <Form>
                                                                    <Form.Control
                                                                        required
                                                                        type="text"
                                                                        placeholder="Enter Address"
                                                                        value={address}
                                                                        onChange={(e) => setAddress(e.target.value)}
                                                                    />
                                                                </Form>
                                                            </td>
                                                            <td>
                                                                <Form>
                                                                    <Form.Control
                                                                        required
                                                                        type="text"
                                                                        placeholder="Enter City"
                                                                        value={city}
                                                                        onChange={(e) => setCity(e.target.value)}
                                                                    />
                                                                </Form>
                                                            </td>
                                                            <td>
                                                                <Form>
                                                                    <Form.Control
                                                                        required
                                                                        type="text"
                                                                        placeholder="Enter Postal Code"
                                                                        value={postalCode}
                                                                        onChange={(e) => setPostalCode(e.target.value)}
                                                                    />
                                                                </Form>
                                                            </td>
                                                            <td>
                                                                <Form>
                                                                    <Form.Control
                                                                        required
                                                                        type="text"
                                                                        placeholder="Enter State"
                                                                        value={state}
                                                                        onChange={(e) => setState(e.target.value)}
                                                                    />
                                                                </Form>
                                                            </td>
                                                            <td>
                                                                <Form>
                                                                    <Form.Control
                                                                        required
                                                                        type="text"
                                                                        placeholder="Enter Country"
                                                                        value={country}
                                                                        onChange={(e) => setCountry(e.target.value)}
                                                                    />
                                                                </Form>
                                                            </td>

                                                            <td>
                                                                <Button
                                                                    type="submit"
                                                                    variant="light"
                                                                    className="btn-sm mx-2"
                                                                    onClick={() => saveAddress(index)}
                                                                >
                                                                    <i className="fas fa-save" />
                                                                </Button>
                                                                <Button
                                                                    type="submit"
                                                                    variant="danger"
                                                                    className="btn-sm mx-2"
                                                                    onClick={() => setAddressEdit(false)}
                                                                >
                                                                    <i className="fas fa-times" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </Table>
                                    </Form.Group>
                                )}
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

export default UserEditScreen;
