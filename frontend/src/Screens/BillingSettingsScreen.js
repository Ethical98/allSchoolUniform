import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { getBillingConfig, updateBillingConfig } from '../actions/billingActions';
import { BILLING_CONFIG_UPDATE_RESET } from '../constants/billingConstants';
import { logout } from '../actions/userActions';

const BillingSettingsScreen = ({ history }) => {
    const dispatch = useDispatch();

    const [showHSN, setShowHSN] = useState(true);
    const [showSKU, setShowSKU] = useState(true);
    const [showPaymentInfo, setShowPaymentInfo] = useState(true);
    const [taxEnabled, setTaxEnabled] = useState(true);
    const [defaultTaxRate, setDefaultTaxRate] = useState(5);
    const [defaultHSNCode, setDefaultHSNCode] = useState('6203');
    const [ratesInput, setRatesInput] = useState('0, 5, 12, 18, 28');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const billingConfig = useSelector((state) => state.billingConfig);
    const { loading, error, config } = billingConfig;

    const billingConfigUpdate = useSelector((state) => state.billingConfigUpdate);
    const { loading: updating, success: updateSuccess, error: updateError } = billingConfigUpdate;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        } else if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        } else {
            dispatch(getBillingConfig());
        }
    }, [history, userInfo, dispatch]);

    useEffect(() => {
        if (config && config._id) {
            setShowHSN(config.showHSN ?? true);
            setShowSKU(config.showSKU ?? true);
            setShowPaymentInfo(config.showPaymentInfo ?? true);
            setTaxEnabled(config.taxEnabled ?? true);
            setDefaultTaxRate(config.defaultTaxRate ?? 5);
            setDefaultHSNCode(config.defaultHSNCode || '6203');
            setRatesInput((config.standardTaxRates || [0, 5, 12, 18, 28]).join(', '));
        }
    }, [config]);

    useEffect(() => {
        if (updateSuccess) {
            setTimeout(() => dispatch({ type: BILLING_CONFIG_UPDATE_RESET }), 3000);
        }
    }, [updateSuccess, dispatch]);

    const handleSave = (e) => {
        e.preventDefault();
        const standardTaxRates = ratesInput
            .split(',')
            .map((s) => parseFloat(s.trim()))
            .filter((n) => !isNaN(n) && n >= 0);

        dispatch(
            updateBillingConfig({
                showHSN,
                showSKU,
                showPaymentInfo,
                taxEnabled,
                defaultTaxRate: Number(defaultTaxRate),
                defaultHSNCode,
                standardTaxRates,
            })
        );
    };

    const parsedRates = ratesInput
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n) && n >= 0);

    return (
        <AdminPageLayout>
            <Meta title="Billing Settings - Allschooluniform" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>BILLING SETTINGS</h1>
                <Link to="/admin/billing" className="btn btn-outline-dark">
                    <i className="fas fa-arrow-left me-1"></i> Back to Billing
                </Link>
            </div>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <Form onSubmit={handleSave}>
                    {updateSuccess && <Message variant="success">Settings saved successfully</Message>}
                    {updateError && <Message variant="danger">{updateError}</Message>}

                    <Row className="g-4">
                        {/* Document Display Settings */}
                        <Col lg={6}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <h5 className="fw-bold mb-4">
                                        <i className="fas fa-file-alt me-2 text-primary"></i>
                                        Document Display
                                    </h5>
                                    <p className="text-muted small mb-4">
                                        Control which fields appear on invoices, quotations, and printed documents.
                                    </p>

                                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                        <div>
                                            <div className="fw-bold">HSN Code</div>
                                            <small className="text-muted">
                                                Show HSN/SAC code column in documents
                                            </small>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={showHSN}
                                            onChange={(e) => setShowHSN(e.target.checked)}
                                            id="switch-hsn"
                                        />
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                        <div>
                                            <div className="fw-bold">SKU Code</div>
                                            <small className="text-muted">
                                                Show SKU code alongside product names
                                            </small>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={showSKU}
                                            onChange={(e) => setShowSKU(e.target.checked)}
                                            id="switch-sku"
                                        />
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center py-3">
                                        <div>
                                            <div className="fw-bold">Payment / Bank Details</div>
                                            <small className="text-muted">
                                                Show bank account and UPI details on printed documents
                                            </small>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={showPaymentInfo}
                                            onChange={(e) => setShowPaymentInfo(e.target.checked)}
                                            id="switch-payment"
                                        />
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Tax Configuration */}
                        <Col lg={6}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <h5 className="fw-bold mb-4">
                                        <i className="fas fa-percentage me-2 text-success"></i>
                                        Tax Configuration
                                    </h5>
                                    <p className="text-muted small mb-4">
                                        Configure GST tax settings for new documents.
                                    </p>

                                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                        <div>
                                            <div className="fw-bold">Enable Tax</div>
                                            <small className="text-muted">
                                                Show tax breakdown (CGST/SGST/IGST) in documents
                                            </small>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={taxEnabled}
                                            onChange={(e) => setTaxEnabled(e.target.checked)}
                                            id="switch-tax"
                                        />
                                    </div>

                                    {taxEnabled && (
                                        <>
                                            <div className="py-3 border-bottom">
                                                <Form.Label className="fw-bold">Default Tax Rate</Form.Label>
                                                <Form.Select
                                                    value={defaultTaxRate}
                                                    onChange={(e) => setDefaultTaxRate(e.target.value)}
                                                    style={{ maxWidth: '200px' }}
                                                >
                                                    {parsedRates.map((r) => (
                                                        <option key={r} value={r}>{r}%</option>
                                                    ))}
                                                </Form.Select>
                                                <small className="text-muted">
                                                    Applied to new items by default
                                                </small>
                                            </div>

                                            <div className="py-3 border-bottom">
                                                <Form.Label className="fw-bold">Default HSN Code</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={defaultHSNCode}
                                                    onChange={(e) => setDefaultHSNCode(e.target.value)}
                                                    style={{ maxWidth: '200px' }}
                                                    placeholder="e.g. 6203"
                                                />
                                                <small className="text-muted">
                                                    Applied to new items when HSN is enabled
                                                </small>
                                            </div>

                                            <div className="py-3">
                                                <Form.Label className="fw-bold">Standard Tax Rates</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={ratesInput}
                                                    onChange={(e) => setRatesInput(e.target.value)}
                                                    placeholder="e.g. 0, 5, 12, 18, 28"
                                                />
                                                <small className="text-muted">
                                                    Comma-separated GST slab rates shown in dropdown
                                                </small>
                                                <div className="mt-2 d-flex gap-1 flex-wrap">
                                                    {parsedRates.map((r, i) => (
                                                        <Badge key={i} bg="light" text="dark" style={{ fontSize: '12px' }}>
                                                            {r}%
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <div className="mt-4 d-flex justify-content-end">
                        <Button type="submit" variant="primary" size="lg" disabled={updating}>
                            {updating ? (
                                <>
                                    <i className="fas fa-spinner fa-spin me-2"></i>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save me-2"></i>
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </div>
                </Form>
            )}
        </AdminPageLayout>
    );
};

export default BillingSettingsScreen;
