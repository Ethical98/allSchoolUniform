import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { Button, FloatingLabel, Form, ListGroup } from 'react-bootstrap';
import { saveShippingAddress, saveShippingAddressDatabase, getSavedAddress } from '../actions/cartActions';
import CheckoutSteps from '../components/CheckoutSteps';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const ShippingScreen = ({ history }) => {
    const dispatch = useDispatch();

    const cart = useSelector((state) => state.cart);
    const { savedAddress, loading, error } = cart;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const [newAddress, setNewAddress] = useState(false);
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);

    // Auth verification handled by backend via HTTP-only cookies

    // useEffect(() => {
    //     if (!loading && cartSuccess && cartItems.length === 0) {
    //         history.push('/cart');
    //     }
    //     // eslint-disable-next-line
    // }, [cartItems, cartSuccess, loading]);

    useEffect(() => {
        dispatch(getSavedAddress());
    }, [dispatch]);

    const submitHandler = (e) => {
        e.preventDefault();
        dispatch(saveShippingAddress({ address, city, postalCode, state, country }));
        history.push('/payment');
    };
    const shippingAddressSave = (e) => {
        e.preventDefault();
        dispatch(saveShippingAddress({ address, city, postalCode, state, country }));
        dispatch(saveShippingAddressDatabase({ address, city, postalCode, state, country }));
        history.push('/payment');
    };

    const handleNewAddress = () => {
        setNewAddress(true);
    };

    return (
        <PageLayout>
            <Meta title={'Shipping - AllSchoolUniform'} description={'Enter Shipping Details'} />
            <FormContainer>
                <CheckoutSteps step1 step2 />
                <h1>SHIPPING</h1>
                {loading ? (
                    <Loader />
                ) : error ? (
                    <Message variant="danger">{error}</Message>
                ) : newAddress ? (
                    <Form onSubmit={shippingAddressSave}>
                        <FloatingLabel className="mb-3" label="Address" controlId="address">
                            <Form.Control
                                required
                                type="text"
                                placeholder="Enter Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            ></Form.Control>
                        </FloatingLabel>

                        <FloatingLabel className="mb-3" label="Postal Code" controlId="postalCode">
                            <Form.Control
                                required
                                type="text"
                                placeholder="Postal Code"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
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
                        <FloatingLabel className="mb-3" label="State" controlId="state">
                            <Form.Control
                                required
                                type="text"
                                placeholder="State"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
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
                        <Button className="col-12" type="submit" variant="outline-dark">
                            Continue
                        </Button>
                    </Form>
                ) : savedAddress && savedAddress.length !== 0 ? (
                    <>
                        <Form onSubmit={submitHandler}>
                            <Form.Group>
                                <ListGroup>
                                    {savedAddress &&
                                        savedAddress.map((x) => {
                                            const label = `${x.address} ${x.city} ${x.postalCode} ${x.state} ${x.country}`;
                                            return (
                                                <ListGroup.Item key={x._id}>
                                                    <Form.Check
                                                        required
                                                        name="Shipping"
                                                        type="radio"
                                                        label={label}
                                                        id={x._id}
                                                        onChange={() => {
                                                            setAddress(x.address);
                                                            setCity(x.city);
                                                            setState(x.state);
                                                            setPostalCode(x.postalCode);
                                                            setCountry(x.country);
                                                        }}
                                                    ></Form.Check>
                                                </ListGroup.Item>
                                            );
                                        })}
                                </ListGroup>
                            </Form.Group>
                            <Button variant="info" className="my-3" size="sm" onClick={handleNewAddress}>
                                <i className="fas fa-plus" />
                                Add New Address
                            </Button>
                            <Button variant="outline-dark" className="col-12" type="submit">
                                Continue
                            </Button>
                        </Form>
                    </>
                ) : (
                    <Form onSubmit={shippingAddressSave}>
                        <FloatingLabel className="mb-3" label="Address" controlId="address">
                            <Form.Control
                                required
                                type="text"
                                placeholder="Enter Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            ></Form.Control>
                        </FloatingLabel>

                        <FloatingLabel className="mb-3" label="Postal Code" controlId="postalCode">
                            <Form.Control
                                required
                                type="text"
                                placeholder="Postal Code"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
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
                        <FloatingLabel className="mb-3" label="State" controlId="state">
                            <Form.Control
                                required
                                type="text"
                                placeholder="State"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
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
                        <Button className="col-12" type="submit" variant="outline-dark">
                            Continue
                        </Button>
                    </Form>
                )}
            </FormContainer>
        </PageLayout>
    );
};

export default ShippingScreen;
