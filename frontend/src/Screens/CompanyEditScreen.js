import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, FloatingLabel, Container } from 'react-bootstrap';
import Loader from '../components/Loader';
import FormContainer from '../components/FormContainer';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import { logout } from '../actions/userActions';
import {
    COMPANY_CREATE_RESET,
    COMPANY_DETAILS_RESET,
    COMPANY_UPDATE_RESET,
} from '../constants/companyConstants';
import {
    getCompanyDetails,
    createCompany,
    updateCompany,
} from '../actions/companyActions';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import { validateGSTIN, validatePAN, validatePincode } from '../utils/taxCalculator';

const CompanyEditScreen = ({ match, history }) => {
    const companyId = match.params.id;
    const isEdit = !!companyId;

    const dispatch = useDispatch();

    const [name, setName] = useState('');
    const [companyType, setCompanyType] = useState('BUYER');
    const [gstin, setGstin] = useState('');
    const [pan, setPan] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [country, setCountry] = useState('India');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [branchName, setBranchName] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [validationError, setValidationError] = useState('');

    const companyDetails = useSelector((state) => state.companyDetails);
    const { loading, error, company } = companyDetails || {};

    const companyCreate = useSelector((state) => state.companyCreate);
    const {
        loading: loadingCreate,
        error: errorCreate,
        success: successCreate,
    } = companyCreate || {};

    const companyUpdate = useSelector((state) => state.companyUpdate);
    const {
        loading: loadingUpdate,
        error: errorUpdate,
        success: successUpdate,
    } = companyUpdate || {};

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);

    useEffect(() => {
        if (userInfo && !userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        }
    }, [dispatch, history, userInfo]);

    // Cleanup stale Redux state on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: COMPANY_CREATE_RESET });
            dispatch({ type: COMPANY_UPDATE_RESET });
            dispatch({ type: COMPANY_DETAILS_RESET });
        };
    }, [dispatch]);

    useEffect(() => {
        if (successCreate || successUpdate) {
            dispatch({ type: COMPANY_CREATE_RESET });
            dispatch({ type: COMPANY_UPDATE_RESET });
            dispatch({ type: COMPANY_DETAILS_RESET });
            history.push('/admin/billing/companies');
        } else if (isEdit) {
            if (!company || company._id !== companyId) {
                dispatch(getCompanyDetails(companyId));
            } else {
                setName(company.name || '');
                setCompanyType(company.companyType || 'BUYER');
                setGstin(company.gstin || '');
                setPan(company.pan || '');
                setAddressLine1(company.addressLine1 || '');
                setAddressLine2(company.addressLine2 || '');
                setCity(company.city || '');
                setState(company.state || '');
                setPincode(company.pincode || '');
                setCountry(company.country || 'India');
                setPhone(company.phone || '');
                setEmail(company.email || '');
                setBankName(company.bankName || '');
                setAccountNumber(company.accountNumber || '');
                setIfscCode(company.ifscCode || '');
                setBranchName(company.branchName || '');
                setIsDefault(company.isDefault || false);
            }
        }
    }, [dispatch, history, successCreate, successUpdate, company, companyId, isEdit]);

    const submitHandler = (e) => {
        e.preventDefault();
        window.scrollTo(0, 0);
        setValidationError('');

        if (gstin && !validateGSTIN(gstin)) {
            setValidationError('Invalid GSTIN format. Must be 15 characters (e.g., 07ABCDE1234F1Z5)');
            return;
        }
        if (pan && !validatePAN(pan)) {
            setValidationError('Invalid PAN format. Must be 10 characters (e.g., ABCDE1234F)');
            return;
        }
        if (pincode && !validatePincode(pincode)) {
            setValidationError('Invalid Pincode. Must be 6 digits');
            return;
        }

        const companyData = {
            name,
            companyType,
            gstin,
            pan,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            country,
            phone,
            email,
            bankName,
            accountNumber,
            ifscCode,
            branchName,
            isDefault,
        };
        if (isEdit) {
            dispatch(updateCompany(companyId, companyData));
        } else {
            dispatch(createCompany(companyData));
        }
    };

    return (
        <AdminPageLayout>
            <Meta
                title={`${isEdit ? 'Edit' : 'Create'} Company - AllSchoolUniform`}
                description={`${isEdit ? 'Edit' : 'Create'} Company Page`}
            />
            <Link to="/admin/billing/companies" className="btn btn-outline-dark my-3">
                Go Back
            </Link>
            <Container>
                <h1>{isEdit ? 'EDIT COMPANY' : 'CREATE COMPANY'}</h1>
                <FormContainer>
                    {(loadingCreate || loadingUpdate) && <Loader />}
                    {errorCreate && <Message variant="warning">{errorCreate}</Message>}
                    {errorUpdate && <Message variant="warning">{errorUpdate}</Message>}
                    {validationError && <Message variant="danger">{validationError}</Message>}
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <Message variant="danger">{error}</Message>
                    ) : (
                        <Form onSubmit={submitHandler}>
                            <FloatingLabel className="mb-3" controlId="name" label="Company Name *">
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder="Company Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </FloatingLabel>

                            <Form.Group className="mb-3">
                                <Form.Label>Company Type *</Form.Label>
                                <Form.Select
                                    value={companyType}
                                    onChange={(e) => setCompanyType(e.target.value)}
                                >
                                    <option value="SENDER">SENDER (Your Company)</option>
                                    <option value="BUYER">BUYER (Client/Customer)</option>
                                </Form.Select>
                            </Form.Group>

                            <h5 className="mt-4 mb-3">Tax Details</h5>
                            <Row>
                                <Col md={6}>
                                    <FloatingLabel className="mb-3" controlId="gstin" label="GSTIN">
                                        <Form.Control
                                            type="text"
                                            placeholder="GSTIN"
                                            value={gstin}
                                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                                            maxLength={15}
                                        />
                                    </FloatingLabel>
                                </Col>
                                <Col md={6}>
                                    <FloatingLabel className="mb-3" controlId="pan" label="PAN">
                                        <Form.Control
                                            type="text"
                                            placeholder="PAN"
                                            value={pan}
                                            onChange={(e) => setPan(e.target.value.toUpperCase())}
                                            maxLength={10}
                                        />
                                    </FloatingLabel>
                                </Col>
                            </Row>

                            <h5 className="mt-4 mb-3">Address</h5>
                            <FloatingLabel className="mb-3" controlId="addressLine1" label="Address Line 1 *">
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder="Address Line 1"
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                />
                            </FloatingLabel>
                            <FloatingLabel className="mb-3" controlId="addressLine2" label="Address Line 2">
                                <Form.Control
                                    type="text"
                                    placeholder="Address Line 2"
                                    value={addressLine2}
                                    onChange={(e) => setAddressLine2(e.target.value)}
                                />
                            </FloatingLabel>
                            <Row>
                                <Col md={4}>
                                    <FloatingLabel className="mb-3" controlId="city" label="City *">
                                        <Form.Control
                                            required
                                            type="text"
                                            placeholder="City"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                        />
                                    </FloatingLabel>
                                </Col>
                                <Col md={4}>
                                    <FloatingLabel className="mb-3" controlId="state" label="State *">
                                        <Form.Control
                                            required
                                            type="text"
                                            placeholder="State"
                                            value={state}
                                            onChange={(e) => setState(e.target.value)}
                                        />
                                    </FloatingLabel>
                                </Col>
                                <Col md={4}>
                                    <FloatingLabel className="mb-3" controlId="pincode" label="Pincode *">
                                        <Form.Control
                                            required
                                            type="text"
                                            placeholder="Pincode"
                                            value={pincode}
                                            onChange={(e) => setPincode(e.target.value)}
                                            maxLength={6}
                                        />
                                    </FloatingLabel>
                                </Col>
                            </Row>
                            <FloatingLabel className="mb-3" controlId="country" label="Country">
                                <Form.Control
                                    type="text"
                                    placeholder="Country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                />
                            </FloatingLabel>

                            <h5 className="mt-4 mb-3">Contact</h5>
                            <Row>
                                <Col md={6}>
                                    <FloatingLabel className="mb-3" controlId="phone" label="Phone">
                                        <Form.Control
                                            type="text"
                                            placeholder="Phone"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </FloatingLabel>
                                </Col>
                                <Col md={6}>
                                    <FloatingLabel className="mb-3" controlId="email" label="Email">
                                        <Form.Control
                                            type="email"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </FloatingLabel>
                                </Col>
                            </Row>

                            {companyType === 'SENDER' && (
                                <>
                                    <h5 className="mt-4 mb-3">Bank Details</h5>
                                    <Row>
                                        <Col md={6}>
                                            <FloatingLabel className="mb-3" controlId="bankName" label="Bank Name">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Bank Name"
                                                    value={bankName}
                                                    onChange={(e) => setBankName(e.target.value)}
                                                />
                                            </FloatingLabel>
                                        </Col>
                                        <Col md={6}>
                                            <FloatingLabel className="mb-3" controlId="accountNumber" label="Account Number">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Account Number"
                                                    value={accountNumber}
                                                    onChange={(e) => setAccountNumber(e.target.value)}
                                                />
                                            </FloatingLabel>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <FloatingLabel className="mb-3" controlId="ifscCode" label="IFSC Code">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="IFSC Code"
                                                    value={ifscCode}
                                                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                                />
                                            </FloatingLabel>
                                        </Col>
                                        <Col md={6}>
                                            <FloatingLabel className="mb-3" controlId="branchName" label="Branch Name">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Branch Name"
                                                    value={branchName}
                                                    onChange={(e) => setBranchName(e.target.value)}
                                                />
                                            </FloatingLabel>
                                        </Col>
                                    </Row>
                                </>
                            )}

                            <Form.Group controlId="isDefault" className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Set as default company"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                />
                            </Form.Group>

                            <Row className="justify-content-md-center">
                                <Col className="text-center">
                                    <Button variant="dark" type="submit" className="col-12">
                                        {isEdit ? 'UPDATE' : 'CREATE'}
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

export default CompanyEditScreen;
