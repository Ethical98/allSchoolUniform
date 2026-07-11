import React, { useEffect, useState } from 'react';
import { Button, Badge, Modal, Form, Row, Col, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import DocumentPrintTemplate from '../components/billing/DocumentPrintTemplate';
import {
    getQuotationDetails,
    updateQuotationStatus,
    convertQuotation,
    cloneQuotation,
    deleteQuotation,
    recordPayment,
    getBillingConfig,
} from '../actions/billingActions';
import {
    QUOTATION_STATUS_RESET,
    QUOTATION_CONVERT_RESET,
    QUOTATION_CLONE_RESET,
    RECORD_PAYMENT_RESET,
} from '../constants/billingConstants';
import { logout } from '../actions/userActions';

const STATUS_COLORS = {
    DRAFT: 'secondary',
    SENT: 'info',
    ACCEPTED: 'success',
    CONVERTED: 'primary',
    EXPIRED: 'warning',
    CANCELLED: 'danger',
};

const PAYMENT_STATUS_COLORS = {
    UNPAID: 'danger',
    PARTIAL: 'warning',
    PAID: 'success',
    OVERDUE: 'dark',
};

const QuotationViewScreen = ({ match, history }) => {
    const quotationId = match.params.id;
    const dispatch = useDispatch();

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [paymentRef, setPaymentRef] = useState('');
    const [paymentRemarks, setPaymentRemarks] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const quotationDetails = useSelector((state) => state.quotationDetails);
    const { loading, error, quotation } = quotationDetails;

    const quotationStatus = useSelector((state) => state.quotationStatus);
    const { success: successStatus } = quotationStatus;

    const quotationConvert = useSelector((state) => state.quotationConvert);
    const { success: successConvert, quotation: convertedDoc } = quotationConvert;

    const quotationClone = useSelector((state) => state.quotationClone);
    const { success: successClone, quotation: clonedDoc } = quotationClone;

    const paymentState = useSelector((state) => state.recordPayment);
    const { loading: loadingPayment, error: errorPayment, success: successPayment } = paymentState;

    const billingConfig = useSelector((state) => state.billingConfig);
    const { config: billingCfg } = billingConfig;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        } else if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        }
    }, [history, userInfo, dispatch]);

    useEffect(() => {
        dispatch(getQuotationDetails(quotationId));
        dispatch(getBillingConfig());
    }, [dispatch, quotationId]);

    useEffect(() => {
        if (successStatus) {
            dispatch({ type: QUOTATION_STATUS_RESET });
            dispatch(getQuotationDetails(quotationId));
        }
    }, [successStatus, dispatch, quotationId]);

    useEffect(() => {
        if (successConvert && convertedDoc) {
            dispatch({ type: QUOTATION_CONVERT_RESET });
            history.push(`/admin/billing/quotation/${convertedDoc._id}/view`);
        }
    }, [successConvert, convertedDoc, dispatch, history]);

    useEffect(() => {
        if (successClone && clonedDoc) {
            dispatch({ type: QUOTATION_CLONE_RESET });
            history.push(`/admin/billing/quotation/${clonedDoc._id}/edit`);
        }
    }, [successClone, clonedDoc, dispatch, history]);

    useEffect(() => {
        if (successPayment) {
            dispatch({ type: RECORD_PAYMENT_RESET });
            setShowPaymentModal(false);
            setPaymentAmount('');
            setPaymentMethod('BANK_TRANSFER');
            setPaymentRef('');
            setPaymentRemarks('');
            dispatch(getQuotationDetails(quotationId));
        }
    }, [successPayment, dispatch, quotationId]);

    const handleStatusChange = (newStatus) => {
        if (window.confirm(`Change status to ${newStatus}?`)) {
            dispatch(updateQuotationStatus(quotationId, newStatus));
        }
    };

    const handleConvert = () => {
        const targetMap = {
            QUOTATION: 'PROFORMA_INVOICE',
            PROFORMA_INVOICE: 'TAX_INVOICE',
        };
        const target = targetMap[quotation.documentType];
        if (target && window.confirm(`Convert to ${target.replace(/_/g, ' ')}?`)) {
            dispatch(convertQuotation(quotationId, target));
        }
    };

    const handleClone = () => {
        if (window.confirm('Clone this document as a new DRAFT?')) {
            dispatch(cloneQuotation(quotationId));
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure? This will cancel the document.')) {
            dispatch(deleteQuotation(quotationId));
            history.push('/admin/billing');
        }
    };

    const handleRecordPayment = (e) => {
        e.preventDefault();
        dispatch(recordPayment(quotationId, {
            amount: Number(paymentAmount),
            method: paymentMethod,
            referenceNo: paymentRef,
            remarks: paymentRemarks,
        }));
    };

    const outstanding = quotation ? (quotation.grandTotal || 0) - (quotation.amountPaid || 0) : 0;

    return (
        <AdminPageLayout>
            <Meta title={`${quotation?.documentNumber || 'Document'} - AllSchoolUniform`} />

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : quotation ? (
                <>
                    {/* Action Bar - hidden on print */}
                    <div className="no-print mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <Link to="/admin/billing" className="btn btn-outline-dark me-2">
                                    <i className="fas fa-arrow-left"></i> Back to Billing
                                </Link>
                            </div>
                            <div>
                                <Badge bg={STATUS_COLORS[quotation.status]} className="me-2 fs-6">
                                    {quotation.status}
                                </Badge>
                                {quotation.paymentStatus && quotation.documentType !== 'QUOTATION' && (
                                    <Badge bg={PAYMENT_STATUS_COLORS[quotation.paymentStatus]} className="fs-6">
                                        {quotation.paymentStatus}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                            <Button variant="outline-primary" onClick={() => window.print()}>
                                <i className="fas fa-print me-1"></i> Print
                            </Button>

                            {quotation.status === 'DRAFT' && (
                                <>
                                    <Link
                                        to={`/admin/billing/quotation/${quotation._id}/edit`}
                                        className="btn btn-outline-secondary"
                                    >
                                        <i className="fas fa-edit me-1"></i> Edit
                                    </Link>
                                    <Button
                                        variant="outline-info"
                                        onClick={() => handleStatusChange('SENT')}
                                    >
                                        <i className="fas fa-paper-plane me-1"></i> Mark as Sent
                                    </Button>
                                </>
                            )}

                            {quotation.status === 'SENT' && (
                                <Button
                                    variant="outline-success"
                                    onClick={() => handleStatusChange('ACCEPTED')}
                                >
                                    <i className="fas fa-check me-1"></i> Mark as Accepted
                                </Button>
                            )}

                            {['QUOTATION', 'PROFORMA_INVOICE'].includes(quotation.documentType) &&
                                ['ACCEPTED', 'SENT'].includes(quotation.status) && (
                                <Button variant="outline-primary" onClick={handleConvert}>
                                    <i className="fas fa-exchange-alt me-1"></i>
                                    Convert to{' '}
                                    {quotation.documentType === 'QUOTATION'
                                        ? 'Proforma Invoice'
                                        : 'Tax Invoice'}
                                </Button>
                            )}

                            {['TAX_INVOICE', 'CASH_BILL'].includes(quotation.documentType) &&
                                ['UNPAID', 'PARTIAL'].includes(quotation.paymentStatus) && (
                                <Button
                                    variant="outline-success"
                                    onClick={() => setShowPaymentModal(true)}
                                >
                                    <i className="fas fa-rupee-sign me-1"></i> Record Payment
                                </Button>
                            )}

                            {['TAX_INVOICE'].includes(quotation.documentType) &&
                                quotation.paymentStatus === 'PAID' && (
                                <Link
                                    to={`/admin/billing/credit-note/${quotation._id}`}
                                    className="btn btn-outline-warning"
                                >
                                    <i className="fas fa-undo me-1"></i> Create Credit Note
                                </Link>
                            )}

                            <Button variant="outline-secondary" onClick={handleClone}>
                                <i className="fas fa-copy me-1"></i> Clone
                            </Button>

                            {quotation.status === 'DRAFT' && (
                                <Button variant="outline-danger" onClick={handleDelete}>
                                    <i className="fas fa-trash me-1"></i> Delete
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Conversion Chain Info */}
                    {(quotation.parentDocument || quotation.convertedTo || quotation.clonedFrom || quotation.linkedInvoice) && (
                        <Card className="mb-3 no-print">
                            <Card.Body className="py-2">
                                <small className="text-muted">
                                    {quotation.parentDocument && (
                                        <span>
                                            Converted from:{' '}
                                            <Link to={`/admin/billing/quotation/${quotation.parentDocument}/view`}>
                                                View Parent
                                            </Link>
                                            {' | '}
                                        </span>
                                    )}
                                    {quotation.convertedTo && (
                                        <span>
                                            Converted to:{' '}
                                            <Link to={`/admin/billing/quotation/${quotation.convertedTo}/view`}>
                                                View Converted
                                            </Link>
                                            {' | '}
                                        </span>
                                    )}
                                    {quotation.clonedFrom && (
                                        <span>
                                            Cloned from:{' '}
                                            <Link to={`/admin/billing/quotation/${quotation.clonedFrom}/view`}>
                                                View Original
                                            </Link>
                                            {' | '}
                                        </span>
                                    )}
                                    {quotation.linkedInvoice && (
                                        <span>
                                            Against Invoice:{' '}
                                            <Link to={`/admin/billing/quotation/${quotation.linkedInvoice}/view`}>
                                                View Invoice
                                            </Link>
                                        </span>
                                    )}
                                    {' | '}Version: {quotation.version || 1}
                                </small>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Document Print Template */}
                    <DocumentPrintTemplate document={quotation} billingConfig={billingCfg} />

                    {/* Payment Modal */}
                    <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Record Payment</Modal.Title>
                        </Modal.Header>
                        <Form onSubmit={handleRecordPayment}>
                            <Modal.Body>
                                {errorPayment && <Message variant="danger">{errorPayment}</Message>}
                                <p className="text-muted mb-3">
                                    Outstanding: <strong>
                                        ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </strong>
                                </p>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Amount *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                max={outstanding}
                                                min="1"
                                                step="0.01"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Payment Method</Form.Label>
                                            <Form.Select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                            >
                                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                                <option value="CASH">Cash</option>
                                                <option value="UPI">UPI</option>
                                                <option value="CARD">Card</option>
                                                <option value="CHEQUE">Cheque</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label>Reference No.</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={paymentRef}
                                        onChange={(e) => setPaymentRef(e.target.value)}
                                        placeholder="Transaction ID, Cheque No, etc."
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Remarks</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={paymentRemarks}
                                        onChange={(e) => setPaymentRemarks(e.target.value)}
                                    />
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" disabled={loadingPayment}>
                                    {loadingPayment ? 'Recording...' : 'Record Payment'}
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>
                </>
            ) : null}
        </AdminPageLayout>
    );
};

export default QuotationViewScreen;
