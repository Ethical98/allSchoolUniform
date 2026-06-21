import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Row, Col, Card, Table, Button, Badge, Modal, Form, Collapse,
} from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import AdminPageLayout from '../components/AdminPageLayout';
import ReturnStatusBadge from '../components/ReturnStatusBadge';
import ReturnTimeline from '../components/ReturnTimeline';
import QCDispositionForm from '../components/QCDispositionForm';
import ReturnStatusStepper from '../components/returns/ReturnStatusStepper';
import ReturnActionBar from '../components/returns/ReturnActionBar';
import CopyRow from '../components/returns/CopyRow';
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

// QC disposition → react-bootstrap Badge variant (shared by both QC tables).
const QC_BADGE_VARIANT = {
    GOOD: 'success',
    DAMAGED: 'danger',
    UNSELLABLE: 'dark',
    NOT_RECEIVED: 'secondary',
};

const ReturnDetailScreen = ({ match, history }) => {
    const returnId = match.params.id;
    const dispatch = useDispatch();

    const [showTimeline, setShowTimeline] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');
    const [refundReference, setRefundReference] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [fullRefundOverride, setFullRefundOverride] = useState(false);

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const returnDetailsState = useSelector((state) => state.returnDetails);
    const { loading, error, returnRequest, nextStatuses: stateNextStatuses, payment } = returnDetailsState;

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
                refundMethod,
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

    // Where to send the refund. COD returns carry a customer-provided UPI/bank
    // destination on the return; PREPAID returns reference the original
    // Razorpay payment (from the order, via the `payment` field).
    const renderRefundDestination = () => {
        const isCod = payment ? payment.paymentMethod === 'COD' : !!ret?.refundUpiId || !!ret?.refundBankDetails;
        if (isCod) {
            if (ret?.refundMethod === 'UPI' && ret?.refundUpiId) {
                return (
                    <>
                        <p className="mb-1"><strong>Refund via:</strong> UPI</p>
                        <CopyRow label="UPI ID" value={ret.refundUpiId} />
                    </>
                );
            }
            if (ret?.refundMethod === 'BANK_TRANSFER' && ret?.refundBankDetails) {
                const b = ret.refundBankDetails;
                return (
                    <>
                        <p className="mb-1"><strong>Refund via:</strong> Bank Transfer</p>
                        <p className="mb-1"><strong>Account Holder:</strong> {b.accountHolderName || '-'}</p>
                        <CopyRow label="Account Number" value={b.accountNumber || '-'} />
                        <CopyRow label="IFSC" value={b.ifscCode || '-'} />
                    </>
                );
            }
            return <p className="mb-1 text-muted">COD order — no refund destination was provided by the customer.</p>;
        }
        // Prepaid → Razorpay reference for refunding to the original payment.
        if (payment && (payment.razorpayPaymentId || payment.razorpayOrderId)) {
            return (
                <>
                    <p className="mb-1"><strong>Refund to:</strong> Original payment (Razorpay)</p>
                    {payment.razorpayPaymentId && <CopyRow label="Razorpay Payment ID" value={payment.razorpayPaymentId} />}
                    {payment.razorpayOrderId && <CopyRow label="Razorpay Order ID" value={payment.razorpayOrderId} />}
                </>
            );
        }
        return <p className="mb-1 text-muted">Prepaid order — refund to original payment method.</p>;
    };

    const handleAction = (actionKey) => {
        if (actionKey === 'createExchangeOrder') dispatch(createExchangeOrder(returnId));
    };
    const handleOpenModal = (modalKey) => {
        if (modalKey === 'reject') return setShowRejectModal(true);
        if (modalKey === 'note') return setShowNoteModal(true);
        if (modalKey === 'refund') {
            setRefundAmount(ret.refundAmount || '');
            if (ret.refundMethod === 'UPI' || ret.refundMethod === 'BANK_TRANSFER') {
                setRefundMethod(ret.refundMethod);
            }
            return setShowRefundModal(true);
        }
    };
    const anyBusy = statusLoading || exLoading;

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
                    <div className="mb-2">
                        <ReturnStatusStepper status={ret.status} />
                    </div>

                    <ReturnActionBar
                        ret={ret}
                        nextStatuses={nextStatuses}
                        busy={anyBusy}
                        fullRefundOverride={fullRefundOverride}
                        onToggleFullRefundOverride={setFullRefundOverride}
                        onStatusUpdate={handleStatusUpdate}
                        onAction={handleAction}
                        onOpenModal={handleOpenModal}
                    />

                    <Row>
                        {/* LEFT: items/QC + customer reason */}
                        <Col lg={7}>
                            <Card className="mb-3">
                                <Card.Header>Items {ret.status === 'QC_IN_PROGRESS' && '· QC Inspection'}</Card.Header>
                                <Card.Body>
                                    {ret.status === 'QC_IN_PROGRESS' ? (
                                        <QCDispositionForm items={ret.items || []} onSubmit={handleQCSubmit} />
                                    ) : (
                                        <Table bordered hover responsive size="sm">
                                            <thead>
                                                <tr>
                                                    <th>Product</th><th>Size</th><th>Qty</th><th>Price</th>
                                                    <th>QC</th><th>QC Notes</th>{ret.type === 'EXCHANGE' && <th>Exchange</th>}
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
                                                                <Badge bg={QC_BADGE_VARIANT[item.qcDisposition] || 'warning'}>
                                                                    {item.qcDisposition}
                                                                </Badge>
                                                            ) : '-'}
                                                        </td>
                                                        <td>{item.qcNotes || '-'}</td>
                                                        {ret.type === 'EXCHANGE' && (
                                                            <td>{item.exchangeSize ? `Size: ${item.exchangeSize}` : '-'}</td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card className="mb-3">
                                <Card.Header>Customer Reason</Card.Header>
                                <Card.Body>
                                    <p className="mb-1"><strong>Reason:</strong> {ret.reason?.replace(/_/g, ' ') || '-'}</p>
                                    {ret.reasonDetails && <p className="mb-1"><strong>Details:</strong> {ret.reasonDetails}</p>}
                                    {Array.isArray(ret.evidenceImages) && ret.evidenceImages.length > 0 && (
                                        <div className="d-flex flex-wrap mt-2" style={{ gap: '8px' }}>
                                            {ret.evidenceImages.map((src, i) => (
                                                <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                                                    <img src={src} alt={`Evidence ${i + 1}`}
                                                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* RIGHT: financials + shipping + customer */}
                        <Col lg={5}>
                            <Card className="mb-3">
                                <Card.Header>Financials</Card.Header>
                                <Card.Body>
                                    <p className="mb-1"><strong>Refund Amount:</strong> ₹{ret.refundAmount || 0}</p>
                                    <p className="mb-1"><strong>Refund Method:</strong> {ret.refundMethod?.replace(/_/g, ' ') || '-'}</p>
                                    <div className="border rounded p-2 my-2 bg-light">
                                        <p className="mb-1 text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.03em' }}>
                                            Refund Destination
                                        </p>
                                        {renderRefundDestination()}
                                    </div>
                                    {ret.refundTransactionId && <p className="mb-1"><strong>Transaction ID:</strong> {ret.refundTransactionId}</p>}
                                    {ret.refundProcessedAt && <p className="mb-1"><strong>Refund Processed:</strong> {ret.refundProcessedAt.substring(0, 10)}</p>}
                                    {ret.priceDifference !== 0 && (
                                        <p className="mb-1">
                                            <strong>Price Difference:</strong> ₹{Math.abs(ret.priceDifference)}{' '}
                                            {ret.priceDifference > 0 ? '(customer owes)' : '(refund due)'}
                                            {ret.priceDifference > 0 && (
                                                <Badge bg={ret.priceDifferenceCollected ? 'success' : 'warning'} className="ml-2">
                                                    {ret.priceDifferenceCollected ? 'Collected' : 'Pending'}
                                                </Badge>
                                            )}
                                        </p>
                                    )}
                                    {ret.creditNoteNumber && <p className="mb-1"><strong>Credit Note:</strong> {ret.creditNoteNumber}</p>}
                                    {ret.exchangeOrderNumber && <p className="mb-1"><strong>Exchange Order:</strong> {ret.exchangeOrderNumber}</p>}
                                    {!ret.creditNote && ret.status !== 'REJECTED' && ret.status !== 'CANCELLED' && (
                                        <Button variant="outline-primary" size="sm" className="mt-1"
                                            onClick={() => dispatch(generateCreditNote(returnId))} disabled={cnLoading}>
                                            Generate Credit Note
                                        </Button>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card className="mb-3">
                                <Card.Header>Shipping</Card.Header>
                                <Card.Body>
                                    {ret.reverseShipping?.awbCode || ret.reverseShipping?.providerOrderId ? (
                                        <>
                                            <p className="mb-1"><strong>Provider:</strong> {ret.reverseShipping.provider || 'Shiprocket'}</p>
                                            <p className="mb-1"><strong>AWB:</strong> {ret.reverseShipping.awbCode || '-'}</p>
                                            <p className="mb-1"><strong>Courier:</strong> {ret.reverseShipping.courierName || '-'}</p>
                                            <p className="mb-1"><strong>Status:</strong> {ret.reverseShipping.status || '-'}</p>
                                            {ret.reverseShipping.providerOrderId && (
                                                <p className="mb-1"><strong>Shiprocket Order ID:</strong> {ret.reverseShipping.providerOrderId}</p>
                                            )}
                                            {ret.reverseShipping.trackingUrl && (
                                                <a href={ret.reverseShipping.trackingUrl} target="_blank" rel="noopener noreferrer">Track Shipment</a>
                                            )}
                                            {ret.reverseShipping?.providerShipmentId && (
                                                <div className="mt-2 d-flex" style={{ gap: '8px' }}>
                                                    <Button variant="outline-warning" size="sm" disabled={initiateLoading}
                                                        onClick={() => dispatch(initiateReturnPickup(returnId))}>
                                                        {initiateLoading ? 'Requesting…' : '📦 Initiate Pickup'}
                                                    </Button>
                                                    {!ret.reverseShipping?.labelUrl && (
                                                        <Button variant="outline-primary" size="sm" disabled={labelLoading}
                                                            onClick={() => dispatch(generateReturnLabel(returnId))}>
                                                            {labelLoading ? 'Generating…' : 'Generate Label'}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            {ret.reverseShipping?.labelUrl && (
                                                <p className="mt-2 mb-0">
                                                    <a href={ret.reverseShipping.labelUrl} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline-success" size="sm">Download Label</Button>
                                                    </a>
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-muted mb-0">No reverse shipment created yet.</p>
                                    )}
                                    {ret.exchangeOrderNumber && ret.exchangeOrderId && (
                                        <div className="mt-3 pt-2 border-top">
                                            <p className="mb-1"><strong>Exchange Order:</strong> {ret.exchangeOrderNumber}</p>
                                            <Button variant="primary" size="sm"
                                                onClick={() => window.open(`/admin/shipping/orders/${ret.exchangeOrderId}`, '_blank')}>
                                                Ship This Order →
                                            </Button>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card className="mb-3">
                                <Card.Header>Customer & Order</Card.Header>
                                <Card.Body>
                                    <p className="mb-1"><strong>Customer:</strong> {ret.customerName || '-'}</p>
                                    <p className="mb-1"><strong>Email:</strong> {ret.customerEmail || '-'}</p>
                                    <p className="mb-1"><strong>Phone:</strong> {ret.customerPhone || '-'}</p>
                                    <p className="mb-1"><strong>Order:</strong>{' '}
                                        <a href={`/admin/order/${ret.order}/edit`} target="_blank" rel="noopener noreferrer">{ret.orderId}</a>
                                    </p>
                                    <p className="mb-1"><strong>Created:</strong> {ret.createdAt?.substring(0, 10)} by {ret.createdByName || '-'}</p>
                                    {ret.overrideReturnWindow && (
                                        <Badge bg="warning" className="mb-1">Return Window Override</Badge>
                                    )}
                                    {ret.pickupAddress && (
                                        <p className="mb-0 mt-2"><strong>Pickup:</strong> {ret.pickupAddress.address}, {ret.pickupAddress.city}, {ret.pickupAddress.state} - {ret.pickupAddress.postalCode} · {ret.pickupAddress.phone}</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="mb-3">
                        <Card.Header style={{ cursor: 'pointer' }} onClick={() => setShowTimeline((v) => !v)}>
                            Timeline {showTimeline ? '▾' : '▸'}
                        </Card.Header>
                        <Collapse in={showTimeline}>
                            <Card.Body><ReturnTimeline timeline={ret.timeline || []} /></Card.Body>
                        </Collapse>
                    </Card>

                    {/* Reject / Refund / Note modals — KEEP existing blocks here, unchanged */}

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
                            <div className="border rounded p-2 mb-3 bg-light">
                                <p className="mb-1 text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.03em' }}>
                                    Send refund to
                                </p>
                                {renderRefundDestination()}
                            </div>
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
                                    Amount calculated from QC results.
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Refund Method</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={refundMethod}
                                    onChange={(e) => setRefundMethod(e.target.value)}
                                >
                                    <option value="ORIGINAL_PAYMENT">Original Payment Method</option>
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
