import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Table, Badge, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { getBillingReport } from '../actions/billingActions';
import { logout } from '../actions/userActions';

const PAYMENT_STATUS_COLORS = {
    UNPAID: 'danger',
    PARTIAL: 'warning',
    PAID: 'success',
    OVERDUE: 'dark',
};

const DOC_TYPES = ['TAX_INVOICE', 'CASH_BILL', 'QUOTATION', 'PROFORMA_INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE'];

const BillingReportScreen = ({ history }) => {
    const dispatch = useDispatch();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [buyerName, setBuyerName] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const billingReport = useSelector((state) => state.billingReport);
    const { loading, error, report } = billingReport;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        } else if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        }
    }, [history, userInfo, dispatch]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(getBillingReport(startDate, endDate, documentType, buyerName));
        }
    }, [dispatch, userInfo, startDate, endDate, documentType, buyerName]);

    const summary = report?.summary || {};
    const taxSummary = report?.taxSummary || {};

    return (
        <AdminPageLayout>
            <Meta title="Billing Report - AllSchoolUniform" />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Billing Report</h4>
                <Link to="/admin/billing" className="btn btn-outline-dark">
                    <i className="fas fa-arrow-left me-1"></i> Back to Billing
                </Link>
            </div>

            {/* Filters */}
            <Row className="mb-3 g-2">
                <Col md={2}>
                    <Form.Label className="small text-muted">Start Date</Form.Label>
                    <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </Col>
                <Col md={2}>
                    <Form.Label className="small text-muted">End Date</Form.Label>
                    <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </Col>
                <Col md={3}>
                    <Form.Label className="small text-muted">Document Type</Form.Label>
                    <Form.Select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {DOC_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
                <Col md={3}>
                    <Form.Label className="small text-muted">Buyer</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Search buyer..."
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                    />
                </Col>
                <Col md={2} className="d-flex align-items-end">
                    <Button
                        variant="outline-secondary"
                        onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setDocumentType('');
                            setBuyerName('');
                        }}
                    >
                        Clear
                    </Button>
                </Col>
            </Row>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : report ? (
                <>
                    {/* Summary Cards */}
                    {summary.invoiceCount !== undefined && (
                        <Row className="mb-4">
                            <Col md={2}>
                                <Card className="text-center">
                                    <Card.Body className="py-2">
                                        <small className="text-muted">Invoiced</small>
                                        <h5 className="mb-0">
                                            ₹{summary.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h5>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={2}>
                                <Card className="text-center border-success">
                                    <Card.Body className="py-2">
                                        <small className="text-muted">Collected</small>
                                        <h5 className="mb-0 text-success">
                                            ₹{summary.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h5>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={2}>
                                <Card className="text-center border-danger">
                                    <Card.Body className="py-2">
                                        <small className="text-muted">Outstanding</small>
                                        <h5 className="mb-0 text-danger">
                                            ₹{summary.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h5>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={2}>
                                <Card className="text-center border-warning">
                                    <Card.Body className="py-2">
                                        <small className="text-muted">Credit Notes</small>
                                        <h5 className="mb-0">
                                            ₹{summary.totalCreditNotes.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h5>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={2}>
                                <Card className="text-center">
                                    <Card.Body className="py-2">
                                        <small className="text-muted">Invoices</small>
                                        <h5 className="mb-0">{summary.invoiceCount}</h5>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={2}>
                                <Card className="text-center border-dark">
                                    <Card.Body className="py-2">
                                        <small className="text-muted">Overdue</small>
                                        <h5 className="mb-0 text-danger">{summary.overdueCount}</h5>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Tax Summary */}
                    {taxSummary.totalTax !== undefined && (
                        <Card className="mb-4">
                            <Card.Header><strong>Tax Summary (Invoices)</strong></Card.Header>
                            <Card.Body className="py-2">
                                <Row>
                                    <Col md={2}>
                                        <small className="text-muted">Taxable Amount</small>
                                        <div className="fw-bold">
                                            ₹{taxSummary.totalTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </Col>
                                    <Col md={2}>
                                        <small className="text-muted">CGST</small>
                                        <div>₹{taxSummary.totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </Col>
                                    <Col md={2}>
                                        <small className="text-muted">SGST</small>
                                        <div>₹{taxSummary.totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </Col>
                                    <Col md={2}>
                                        <small className="text-muted">IGST</small>
                                        <div>₹{taxSummary.totalIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </Col>
                                    <Col md={2}>
                                        <small className="text-muted">Total Tax</small>
                                        <div className="fw-bold">
                                            ₹{taxSummary.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Overdue Invoices */}
                    {report.overdueInvoices && report.overdueInvoices.length > 0 && (
                        <Card className="mb-4 border-danger">
                            <Card.Header className="bg-danger text-white">
                                <strong>Overdue Invoices ({report.overdueInvoices.length})</strong>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table bordered hover size="sm" className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Document #</th>
                                            <th>Buyer</th>
                                            <th>Date</th>
                                            <th className="text-end">Total</th>
                                            <th className="text-end">Paid</th>
                                            <th className="text-end">Outstanding</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.overdueInvoices.map((doc) => (
                                            <tr key={doc._id}>
                                                <td>
                                                    <Link to={`/admin/billing/quotation/${doc._id}/view`}>
                                                        {doc.documentNumber}
                                                    </Link>
                                                </td>
                                                <td>{doc.buyer?.name || doc.walkInCustomer?.name || '-'}</td>
                                                <td>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                                                <td className="text-end">
                                                    ₹{(doc.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-end">
                                                    ₹{(doc.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-end text-danger fw-bold">
                                                    ₹{((doc.grandTotal || 0) - (doc.amountPaid || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}

                    {/* All Documents */}
                    <h5>All Documents ({report.documents?.length || 0})</h5>
                    <Table bordered hover responsive size="sm">
                        <thead className="table-light">
                            <tr>
                                <th>Document #</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Buyer</th>
                                <th>Date</th>
                                <th className="text-end">Total</th>
                                <th className="text-end">Paid</th>
                                <th>Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.documents && report.documents.length > 0 ? (
                                report.documents.map((doc) => (
                                    <tr key={doc._id}>
                                        <td>
                                            <Link to={`/admin/billing/quotation/${doc._id}/view`}>
                                                {doc.documentNumber}
                                            </Link>
                                        </td>
                                        <td>
                                            <small>{doc.documentType?.replace(/_/g, ' ')}</small>
                                        </td>
                                        <td>
                                            <Badge bg="secondary" className="text-uppercase">
                                                {doc.status}
                                            </Badge>
                                        </td>
                                        <td>{doc.buyer?.name || doc.walkInCustomer?.name || '-'}</td>
                                        <td>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td className="text-end">
                                            ₹{(doc.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-end">
                                            ₹{(doc.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            {doc.paymentStatus && (
                                                <Badge bg={PAYMENT_STATUS_COLORS[doc.paymentStatus] || 'secondary'}>
                                                    {doc.paymentStatus}
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center text-muted py-3">
                                        No documents found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </>
            ) : null}
        </AdminPageLayout>
    );
};

export default BillingReportScreen;
