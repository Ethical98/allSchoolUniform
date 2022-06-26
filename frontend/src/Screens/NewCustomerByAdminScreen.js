import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { Button, Form, InputGroup } from 'react-bootstrap';
import Message from '../components/Message';
import { register, logout } from '../actions/userActions';
import Loader from '../components/Loader';
import validator from 'validator';
import './css/RegisterScreen.css';
import jsonwebtoken from 'jsonwebtoken';
import Meta from '../components/Meta';
import PageLayout from '../components/PageLayout';

const NewCustomerByAdmin = ({ history }) => {
    const dispatch = useDispatch();

    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const password = 'Asucustomer@123';

    const userRegister = useSelector(state => state.userRegister);
    const { loading, error, userInfo, success } = userRegister;

    const userLogin = useSelector(state => state.userLogin);
    const { userInfo: userLoginInfo } = userLogin;

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
        if (!(userLoginInfo && userLoginInfo.isAdmin)) {
            history.push('/');
        }
    }, [history, userLoginInfo]);

    useEffect(() => {
        if (success) {
            history.push('/products');
        }
    }, [history, success]);

    const submitHandler = e => {
        e.preventDefault();

        if (validator.isMobilePhone(phone)) {
            if (phone.toString().length > 10) {
                const number = Number(phone.toString().split('91')[1]);

                dispatch(register(name, email, number, password));
            } else {
                dispatch(register(name, email, phone, password));
            }
        } else {
            setMessage('Inavlid Mobile Number');
        }
    };

    return (
        <PageLayout>
            <Meta
                title={'Add New Cutomer - Allschooluniform'}
                description={'New Customer By Admin'}
                keyword={'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,customer,admin'}
            />
            <FormContainer>
                <h1>ADD NEW CUSTOMER</h1>
                {loading ? <Loader /> : error && <Message variant="danger">{error}</Message>}
                {message && <Message variant="danger">{message}</Message>}
                <Form onSubmit={submitHandler}>
                    <InputGroup className="mb-3">
                        <InputGroup.Text id="email" style={{ width: '2.5rem' }}>
                            <i className="fas fa-envelope" />
                        </InputGroup.Text>
                        <Form.Control
                            required
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        ></Form.Control>
                    </InputGroup>

                    <InputGroup controlId="name" className="mb-3">
                        <InputGroup.Text id="name">
                            <i className="fas fa-user" />
                        </InputGroup.Text>
                        <Form.Control
                            required
                            type="name"
                            placeholder="Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        ></Form.Control>
                    </InputGroup>

                    <InputGroup controlId="phone" className="mb-3">
                        <InputGroup.Text id="phone" style={{ width: '2.5rem' }}>
                            <i className="fas fa-phone-alt" />
                        </InputGroup.Text>
                        <Form.Control
                            required
                            type="phone"
                            placeholder="Phone"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                        ></Form.Control>
                    </InputGroup>

                    <Button type="submit" variant="info" className="col-12">
                        REGISTER
                    </Button>
                </Form>
            </FormContainer>
        </PageLayout>
    );
};

export default NewCustomerByAdmin;
