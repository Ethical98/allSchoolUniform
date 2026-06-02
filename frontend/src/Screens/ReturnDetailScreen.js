import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Row, Col, Card, Table, Button, Tabs, Tab, Badge, Modal, Form,
} from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import AdminPageLayout from '../components/AdminPageLayout';
import ReturnStatusBadge from '../components/ReturnStatusBadge';
import ReturnTimeline from '../components/ReturnTimeline';
import QCDispositionForm from '../components/QCDispositionForm';
import {
    getReturnDetails,
    updateReturnStatus,
    updateQCDisposition,
    generateCreditNote,
    createExchangeOrder,
    processRefund,
    addReturnNote,
    generateReturnLabel,
    initiateReturnPickup,
} from '../actions/returnActions';
import {
    RETURN_UPDATE_STATUS_RESET,
    RETURN_QC_UPDATE_RESET,
    RETURN_CREDIT_NOTE_RESET,
    RETURN_EXCHANGE_ORDER_RESET,
    RETURN_REFUND_RESET,
    RETURN_NOTE_RESET,
    RETURN_LABEL_RESET,
    RETURN_INITIATE_PICKUP_RESET,
} from '../constants/returnConstants';
import { logout } from '../actions/userActions';

const ReturnDetailScreen = ({ match, history }) => {
    const returnId = match.params.id;
    const dispatch = useDispatch();

    const [activeTab, setActiveTab] = useState('overview');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundMethod, setRefundMethod] = useState('ORIGINAL');
    const [refundReference, setRefundReference] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteText, setNoteText] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const returnDetailsState = useSelector((state) => state.returnDetails);
    const { loading, error, returnRequest, nextStatuses: stateNextStatuses } = returnDetailsState;

    const returnUpdateStatus = useSelector((state) => state.returnUpdateStatus);
    const { loading: statusLoading, success: statusSuccess, error: statusError } = returnUpdateStatus;

    const returnQCUpdate = useSelector((state) => state.returnQCUpdate);
    const { loading: qcLoading, success: qcSuccess, error: qcError } = returnQCUpdate;

    const returnCreditNote = useSelector((state) => state.returnCreditNote);
    const { loading: cnLoading, success: cnSuccess, error: cnError } = returnCreditNote;

    const returnExchangeOrder = useSelector((state) => state.returnExchangeOrder);
    const { loading: exLoading, success: exSuccess, error: exError } = returnExchangeOrder;

    const returnRefund = useSelector((state) => state.returnRefund);
    const { loading: refundLoading, success: refundSuccess, error: refundError } = returnRefund;

    const returnNote = useSelector((state) => state.returnNote);
    const { loading: noteLoading, success: noteSuccess, error: noteError } = returnNote;

    const returnLabel = useSelector((state) => state.returnLabel);
    const { loading: labelLoading, success: labelSuccess, error: labelError } = returnLabel;

    const returnInitiatePickup = useSelector((state) => state.returnInitiatePickup);
    const { loading: initiateLoading, success: initiateSuccess, error: initiateError } = returnInitiatePickup;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
            return;
        }
        if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
            return;
        }
        dispatch(getReturnDetails(returnId));
        // eslint-disable-next-line
    }, [dispatch, returnId, userInfo]);

    // Handle success resets and refetch
    useEffect(() => {
        if (statusSuccess) {
            dispatch(getReturnDetails(returnId));
            setShowRejectModal(false);
            dispatch({ type: RETURN_UPDATE_STATUS_RESET });
        }
    }, [statusSuccess, dispatch, returnId]);

    useEffect(() => {
        if (qcSuccess) {
            dispatch({ type: RETURN_QC_UPDATE_RESET });
            dispatch(getReturnDetails(returnId));
        }
    }, [qcSuccess, dispatch, returnId]);

    useEffect(() => {
        if (cnSuccess) {
            dispatch({ type: RETURN_CREDIT_NOTE_RESET });
            dispatch(getReturnDetails(returnId));
        }
    }, [cnSuccess, dispatch, returnId]);

    useEffect(() => {
        if (exSuccess) {
            dispatch({ type: RETURN_EXCHANGE_ORDER_RESET });
            dispatch(getReturnDetails(returnId));
        }
    }, [exSuccess, dispatch, returnId]);

    useEffect(() => {
        if (refundSuccess) {
            dispatch({ type: RETURN_REFUND_RESET });
            dispatch(getReturnDetails(returnId));
            setShowRefundModal(false);
        }
    }, [refundSuccess, dispatch, returnId]);

    useEffect(() => {
        if (noteSuccess) {
            dispatch({ type: RETURN_NOTE_RESET });
            dispatch(getReturnDetails(returnId));
            setShowNoteModal(false);
            setNoteText('');
        }
    }, [noteSuccess, dispatch, returnId]);

    useEffect(() => {
        if (labelSuccess) {
            dispatch(getReturnDetails(returnId));
            dispatch({ type: RETURN_LABEL_RESET });
        }
    }, [labelSuccess, dispatch, returnId]);

    useEffect(() => {
        if (initiateSuccess) {
            dispatch(getReturnDetails(returnId));
            dispatch({ type: RETURN_INITIATE_PICKUP_RESET });
        }
    }, [initiateSuccess, dispatch, returnId]);

    useEffect(() => {
        return () => {
            dispatch({ type: RETURN_LABEL_RESET });
        };
    }, [dispatch]);

    const handleStatusUpdate = (newStatus, extra = {}) => {
        dispatch(updateReturnStatus(returnId, { status: newStatus, ...extra }));
    };

    const handleReject = () => {
        dispatch(updateReturnStatus(returnId, { status: 'REJECTED', note: rejectReason }));
    };

    const handleQCSubmit = (items) => {
        dispatch(updateQCDisposition(returnId, items));
    };

    const handleRefundSubmit = () => {
        dispatch(
            processRefund(returnId, {
                refundMethod: refundMethod === 'ORIGINAL' ? 'ORIGINAL_PAYMENT' : refundMethod,
                refundTransactionId: refundReference || undefined,
            })
        );
    };

    const handleAddNote = () => {
        if (noteText.trim()) {
            dispatch(addReturnNote(returnId, noteText));
        }
    };

    const ret = returnRequest;
    const nextStatuses = stateNextStatuses || [];

    const renderActionButtons = () => {
        if (!ret) return null;
        return (
            <div className="mb-3">
                {nextStatuses.includes('APPROVED') && (
                    <Button
                        variant="success"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('APPROVED')}
                        disabled={statusLoading}
                    >
                        Approve
                    </Button>
                )}
                {nextStatuses.includes('REJECTED') && (
                    <Button
                        variant="danger"
                        className="mr-2 mb-1"
                        onClick={() => setShowRejectModal(true)}
                        disabled={statusLoading}
                    >
                        Reject
                    </Button>
                )}
                {nextStatuses.includes('PICKUP_SCHEDULED') && (
                    <Button
                        variant="primary"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('PICKUP_SCHEDULED')}
                        disabled={statusLoading}
                    >
                        Schedule Pickup
                    </Button>
                )}
                {nextStatuses.includes('IN_TRANSIT') && (
                    <Button
                        variant="info"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('IN_TRANSIT')}
                        disabled={statusLoading}
                    >
                        Mark In Transit
                    </Button>
                )}
                {nextStatuses.includes('PICKUP_FAILED') && (
                    <Button
                        variant="warning"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('PICKUP_FAILED')}
                        disabled={statusLoading}
                    >
                        Mark Pickup Failed
                    </Button>
                )}
                {nextStatuses.includes('RECEIVED') && (
                    <Button
                        variant="info"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('RECEIVED')}
                        disabled={statusLoading}
                    >
                        Mark Received
                    </Button>
                )}
                {nextStatuses.includes('QC_IN_PROGRESS') && (
                    <Button
                        variant="warning"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('QC_IN_PROGRESS')}
                        disabled={statusLoading}
                    >
                        Start QC
                    </Button>
                )}
                {nextStatuses.includes('REFUND_INITIATED') && (
                    <Button
                        variant="success"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('REFUND_INITIATED')}
                        disabled={statusLoading}
                    >
                        Initiate Refund
                    </Button>
                )}
                {(ret.type === 'EXCHANGE' || ret.type === 'REPLACEMENT') &&
                 !ret.exchangeOrderId &&
                 (nextStatuses.includes('EXCHANGE_SHIPPED') || nextStatuses.includes('REPLACEMENT_SHIPPED')) && (
                    <Button
                        variant="success"
                        className="mr-2 mb-1"
                        onClick={() => dispatch(createExchangeOrder(returnId))}
                        disabled={exLoading}
                    >
                        Create {ret.type === 'REPLACEMENT' ? 'Replacement' : 'Exchange'} Order
                    </Button>
                )}
                {nextStatuses.includes('REFUND_INITIATED') && ret.type === 'RETURN' && (
                    <Button
                        variant="outline-success"
                        className="mr-2 mb-1"
                        onClick={() => {
                            setRefundAmount(ret.refundAmount || '');
                            setShowRefundModal(true);
                        }}
                        disabled={refundLoading}
                    >
                        Record Refund
                    </Button>
                )}
                {nextStatuses.includes('COMPLETED') && (
                    <Button
                        variant="dark"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('COMPLETED')}
                        disabled={statusLoading}
                    >
                        Mark Completed
                    </Button>
                )}
                {nextStatuses.includes('CANCELLED') && (
                    <Button
                        variant="outline-danger"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('CANCELLED')}
                        disabled={statusLoading}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    variant="outline-secondary"
                    className="mb-1"
                    onClick={() => setShowNoteModal(true)}
                >
                    <i className="fas fa-sticky-note" /> Add Note
                </Button>
            </div>
        );
    };

    return (
        <AdminPageLayout>
            <h2>
                Return Details{' '}
                {ret && (
                    <>
                        <small className="text-muted">#{ret.returnId}</small>{' '}
                        <ReturnStatusBadge status={ret.status} />
                    </>
                )}
            </h2>

            {statusError && <Message variant="danger">{statusError}</Message>}
            {qcError && <Message variant="danger">{qcError}</Message>}
            {cnError && <Message variant="danger">{cnError}</Message>}
            {exError && <Message variant="danger">{exError}</Message>}
            {refundError && <Message variant="danger">{refundError}</Message>}
            {noteError && <Message variant="danger">{noteError}</Message>}
            {labelError && <Message variant="danger">{labelError}</Message>}
            {initiateError && <Message variant="danger">{initiateError}</Message>}
            {(statusLoading || qcLoading || cnLoading || exLoading || refundLoading || noteLoading || labelLoading || initiateLoading) && <Loader />}

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : !ret ? (
                <Message variant="warning">Return not found</Message>
            ) : (
                <>
                    {renderActionButtons()}

                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                        {/* Overview Tab */}
                        <Tab eventKey="overview" title="Overview">
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Card>
                                        <Card.Header>Return Info</Card.Header>
                                        <Card.Body>
                                            <p><strong>Return ID:</strong> {ret.returnId}</p>
                                            <p><strong>Order ID:</strong>{' '}
                                                <a href={`/admin/order/${ret.order}/edit`} target="_blank" rel="noopener noreferrer">
                                                    {ret.orderId}
                                                </a>
                                            </p>
                                            <p><strong>Customer:</strong> {ret.customerName || '-'}</p>
                                            <p><strong>Email:</strong> {ret.customerEmail || '-'}</p>
                                            <p><strong>Phone:</strong> {ret.customerPhone || '-'}</p>
                                            <p><strong>Type:</strong> <Badge bg="primary">{ret.type}</Badge></p>
                                            <p><strong>Status:</strong> <ReturnStatusBadge status={ret.status} /></p>
                                            <p><strong>Reason:</strong> {ret.reason?.replace(/_/g, ' ')}</p>
                                            {ret.reasonDetails && <p><strong>Details:</strong> {ret.reasonDetails}</p>}
                                            <p><strong>Created:</strong> {ret.createdAt?.substring(0, 10)}</p>
                                            <p><strong>Created By:</strong> {ret.createdByName || '-'}</p>
                                            {ret.overrideReturnWindow && (
                                                <Badge bg="warning">Return Window Override</Badge>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card>
                                        <Card.Header>Financials</Card.Header>
                                        <Card.Body>
                                            <p><strong>Refund Amount:</strong> ₹{ret.refundAmount || 0}</p>
                                            {ret.shippingRefundAmount > 0 && (
                                                <p><strong>Shipping Refund:</strong> ₹{ret.shippingRefundAmount}</p>
                                            )}
                                            <p><strong>Total Refund:</strong> ₹{(ret.refundAmount || 0) + (ret.shippingRefundAmount || 0)}</p>
                                            <p><strong>Refund Method:</strong> {ret.refundMethod?.replace(/_/g, ' ') || '-'}</p>
                                            {ret.refundTransactionId && (
                                                <p><strong>Transaction ID:</strong> {ret.refundTransactionId}</p>
                                            )}
                                            {ret.refundProcessedAt && (
                                                <p><strong>Refund Processed:</strong> {ret.refundProcessedAt.substring(0, 10)}</p>
                                            )}
                                            {ret.priceDifference !== 0 && (
                                                <p>
                                                    <strong>Price Difference:</strong> ₹{Math.abs(ret.priceDifference)}{' '}
                                                    {ret.priceDifference > 0 ? '(customer owes)' : '(refund due)'}
                                                    {ret.priceDifference > 0 && (
                                                        <Badge bg={ret.priceDifferenceCollected ? 'success' : 'warning'} className="ml-2">
                                                            {ret.priceDifferenceCollected ? 'Collected' : 'Pending'}
                                                        </Badge>
                                                    )}
                                                </p>
                                            )}
                                            {ret.creditNoteNumber && (
                                                <p><strong>Credit Note:</strong> {ret.creditNoteNumber}</p>
                                            )}
                                            {ret.exchangeOrderNumber && (
                                                <p><strong>Exchange Order:</strong> {ret.exchangeOrderNumber}</p>
                                            )}
                                            {!ret.creditNote && ret.status !== 'REJECTED' && ret.status !== 'CANCELLED' && (
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => dispatch(generateCreditNote(returnId))}
                                                    disabled={cnLoading}
                                                >
                                                    Generate Credit Note
                                                </Button>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Items Table */}
                            <Card className="mb-3">
                                <Card.Header>Items</Card.Header>
                                <Card.Body>
                                    <Table bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Size</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>QC Disposition</th>
                                                <th>QC Notes</th>
                                                {ret.type === 'EXCHANGE' && <th>Exchange</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(ret.items || []).map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.productName || item.name || '-'}</td>
                                                    <td>{item.size || '-'}</td>
                                                    <td>{item.returnQty}</td>
                                                    <td>₹{item.price || 0}</td>
                                                    <td>
                                                        {item.qcDisposition ? (
                                                            <Badge
                                                                bg={
                                                                    item.qcDisposition === 'GOOD'
                                                                        ? 'success'
                                                                        : item.qcDisposition === 'DAMAGED'
                                                                        ? 'danger'
                                                                        : 'warning'
                                                                }
                                                            >
                                                                {item.qcDisposition}
                                                            </Badge>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                    <td>{item.qcNotes || '-'}</td>
                                                    {ret.type === 'EXCHANGE' && (
                                                        <td>
                                                            {item.exchangeSize
                                                                ? `Size: ${item.exchangeSize}`
                                                                : '-'}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            {/* Pickup Address */}
                            {ret.pickupAddress && (
                                <Card className="mb-3">
                                    <Card.Header>Pickup Address</Card.Header>
                                    <Card.Body>
                                        <p>
                                            {ret.pickupAddress.address}, {ret.pickupAddress.city},{' '}
                                            {ret.pickupAddress.state} - {ret.pickupAddress.postalCode}
                                        </p>
                                        <p>Phone: {ret.pickupAddress.phone}</p>
                                    </Card.Body>
                                </Card>
                            )}
                        </Tab>

                        {/* Timeline Tab */}
                        <Tab eventKey="timeline" title="Timeline">
                            <ReturnTimeline timeline={ret.timeline || []} />
                        </Tab>

                        {/* QC Tab */}
                        {['QC_IN_PROGRESS', 'QC_COMPLETED', 'REFUND_INITIATED', 'EXCHANGE_SHIPPED',
                           'REPLACEMENT_SHIPPED', 'COMPLETED'].includes(ret.status) && (
                            <Tab eventKey="qc" title="QC Inspection">
                                {ret.status === 'QC_IN_PROGRESS' ? (
                                    <QCDispositionForm
                                        items={ret.items || []}
                                        onSubmit={handleQCSubmit}
                                    />
                                ) : (
                                    <Card>
                                        <Card.Header>QC Results (Read-Only)</Card.Header>
                                        <Card.Body>
                                            <Table bordered size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Size</th>
                                                        <th>Qty</th>
                                                        <th>Disposition</th>
                                                        <th>Notes</th>
                                                        <th>Refund</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(ret.items || []).map((item, i) => (
                                                        <tr key={i}>
                                                            <td>{item.productName || item.name || '-'}</td>
                                                            <td>{item.size}</td>
                                                            <td>{item.returnQty}</td>
                                                            <td>
                                                                <Badge bg={
                                                                    item.qcDisposition === 'GOOD' ? 'success' :
                                                                    item.qcDisposition === 'DAMAGED' ? 'warning' :
                                                                    item.qcDisposition === 'UNSELLABLE' ? 'danger' :
                                                                    item.qcDisposition === 'NOT_RECEIVED' ? 'secondary' : 'light'
                                                                }>
                                                                    {item.qcDisposition || 'PENDING'}
                                                                </Badge>
                                                            </td>
                                                            <td>{item.qcNotes || '-'}</td>
                                                            <td>
                                                                {item.qcDisposition === 'NOT_RECEIVED' || item.qcDisposition === 'UNSELLABLE'
                                                                    ? <span className="text-muted">No refund</span>
                                                                    : `₹${item.refundAmount || 0}`}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                )}
                            </Tab>
                        )}

                        {/* Shipping Tab */}
                        <Tab eventKey="shipping" title="Shipping">
                            <Card>
                                <Card.Header>Reverse Pickup Details</Card.Header>
                                <Card.Body>
                                    {ret.reverseShipping?.awbCode || ret.reverseShipping?.providerOrderId ? (
                                        <>
                                            <p><strong>Provider:</strong> {ret.reverseShipping.provider || 'Shiprocket'}</p>
                                            <p><strong>AWB:</strong> {ret.reverseShipping.awbCode || '-'}</p>
                                            <p><strong>Courier:</strong> {ret.reverseShipping.courierName || '-'}</p>
                                            <p><strong>Status:</strong> {ret.reverseShipping.status || '-'}</p>
                                            <p><strong>Pickup Date:</strong> {ret.reverseShipping.pickupScheduledDate?.substring(0, 10) || '-'}</p>
                                            {ret.reverseShipping.receivedAt && (
                                                <p><strong>Received:</strong> {ret.reverseShipping.receivedAt.substring(0, 10)}</p>
                                            )}
                                            <p><strong>Shiprocket Order ID:</strong> {ret.reverseShipping.providerOrderId || '-'}</p>
                                            {ret.reverseShipping.trackingUrl && (
                                                <a
                                                    href={ret.reverseShipping.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Track Shipment
                                                </a>
                                            )}
                                            {ret.reverseShipping?.providerShipmentId && (
                                                <div className="mt-2 d-flex gap-2" style={{ gap: '8px' }}>
                                                    <Button
                                                        variant="outline-warning"
                                                        size="sm"
                                                        disabled={initiateLoading}
                                                        onClick={() => dispatch(initiateReturnPickup(returnId))}
                                                    >
                                                        {initiateLoading ? 'Requesting…' : '📦 Initiate Pickup on ShipRocket'}
                                                    </Button>
                                                    {!ret.reverseShipping?.labelUrl && (
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            disabled={labelLoading}
                                                            onClick={() => dispatch(generateReturnLabel(returnId))}
                                                        >
                                                            {labelLoading ? 'Generating…' : 'Generate Return Label'}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            {ret.reverseShipping?.labelUrl && (
                                                <p className="mt-2">
                                                    <a href={ret.reverseShipping.labelUrl} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline-success" size="sm">Download Return Label</Button>
                                                    </a>
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-muted">No reverse shipment created yet.</p>
                                    )}
                                </Card.Body>
                            </Card>
                            {ret.exchangeOrderNumber && ret.exchangeOrderId && (
                                <Card className="mt-3">
                                    <Card.Header>Exchange / Replacement Order</Card.Header>
                                    <Card.Body>
                                        <p><strong>Order Number:</strong> {ret.exchangeOrderNumber}</p>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="mr-2"
                                            onClick={() => window.open(`/admin/order/${ret.exchangeOrderId}/edit`, '_blank')}
                                        >
                                            View Exchange Order
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => window.open(`/admin/shipping/orders/${ret.exchangeOrderId}`, '_blank')}
                                        >
                                            Ship This Order →
                                        </Button>
                                    </Card.Body>
                                </Card>
                            )}
                        </Tab>
                    </Tabs>

                    {/* Reject Modal */}
                    <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Reject Return</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group>
                                <Form.Label>Reason for rejection</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Enter rejection reason..."
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || statusLoading}
                            >
                                Reject
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Refund Modal */}
                    <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Record Refund</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group>
                                <Form.Label>Refund Amount</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={refundAmount}
                                    readOnly
                                    disabled
                                    className="bg-light"
                                />
                                <Form.Text className="text-muted">
                                    Amount calculated from QC results. Shipping refund (if any) is added automatically.
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Refund Method</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={refundMethod}
                                    onChange={(e) => setRefundMethod(e.target.value)}
                                >
                                    <option value="ORIGINAL">Original Payment Method</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="STORE_CREDIT">Store Credit</option>
                                    <option value="UPI">UPI</option>
                                </Form.Control>
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Reference / Transaction ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={refundReference}
                                    onChange={(e) => setRefundReference(e.target.value)}
                                    placeholder="Optional transaction reference"
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleRefundSubmit}
                                disabled={refundLoading}
                            >
                                Record Refund
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Add Note Modal */}
                    <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Add Note</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group>
                                <Form.Label>Note</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Enter note..."
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddNote}
                                disabled={!noteText.trim() || noteLoading}
                            >
                                Add Note
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            )}
        </AdminPageLayout>
    );
};

export default ReturnDetailScreen;
