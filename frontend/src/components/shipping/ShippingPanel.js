import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Form, Row, Col, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import {
    checkServiceability,
    createShippingOrder,
    assignCourier,
    schedulePickup,
    generateLabel,
    generateManifest,
    trackShippingOrder,
    cancelShipment,
    reattemptDelivery,
    initiateRTO,
} from '../../actions/shippingActions';
import {
    SHIPPING_SERVICEABILITY_RESET,
    SHIPPING_CREATE_ORDER_RESET,
    SHIPPING_ASSIGN_COURIER_RESET,
    SHIPPING_SCHEDULE_PICKUP_RESET,
    SHIPPING_CANCEL_RESET,
    SHIPPING_NDR_REATTEMPT_RESET,
    SHIPPING_NDR_RTO_RESET,
} from '../../constants/shippingConstants';
import Message from '../Message';
import Loader from '../Loader';

const ShippingPanel = ({ order, onRefresh }) => {
    const dispatch = useDispatch();

    const shipping = order?.shipping || {};
    const isShipped = shipping.isShipped;
    const hasAwb = !!shipping.awbCode;
    const isNDR = shipping.ndr?.isNDR;
    const isRTO = shipping.isRTO;

    // Form state
    const [weight, setWeight] = useState(shipping.weight || 0.5);
    const [length, setLength] = useState(shipping.dimensions?.length || 25);
    const [breadth, setBreadth] = useState(shipping.dimensions?.breadth || 20);
    const [height, setHeight] = useState(shipping.dimensions?.height || 10);
    const [selectedCourier, setSelectedCourier] = useState(null);
    const [pickupPostcode, setPickupPostcode] = useState('');

    // NDR reattempt form
    const [reattemptAddress, setReattemptAddress] = useState('');
    const [reattemptPhone, setReattemptPhone] = useState('');
    const [reattemptDate, setReattemptDate] = useState('');
    const [reattemptRemarks, setReattemptRemarks] = useState('');

    // Redux states
    const { loading: loadingServiceability, couriers, error: errorServiceability } =
        useSelector((state) => state.shippingServiceability);
    const { loading: loadingCreate, success: successCreate, error: errorCreate } =
        useSelector((state) => state.shippingCreateOrder);
    const { loading: loadingAssign, success: successAssign, error: errorAssign, data: assignData } =
        useSelector((state) => state.shippingAssignCourier);
    const { loading: loadingPickup, success: successPickup, error: errorPickup } =
        useSelector((state) => state.shippingSchedulePickup);
    const { loading: loadingLabel, success: successLabel, data: labelData, error: errorLabel } =
        useSelector((state) => state.shippingGenerateLabel);
    const { loading: loadingManifest, success: successManifest, data: manifestData, error: errorManifest } =
        useSelector((state) => state.shippingGenerateManifest);
    const { loading: loadingTrack, tracking, error: errorTrack } =
        useSelector((state) => state.shippingTrackOrder);
    const { loading: loadingCancel, success: successCancel, error: errorCancel } =
        useSelector((state) => state.shippingCancel);
    const { loading: loadingReattempt, success: successReattempt, error: errorReattempt } =
        useSelector((state) => state.shippingNdrReattempt);
    const { loading: loadingRto, success: successRto, error: errorRto } =
        useSelector((state) => state.shippingNdrRto);

    // Refresh order on successful actions
    useEffect(() => {
        if (successCreate || successAssign || successPickup || successCancel || successReattempt || successRto) {
            onRefresh?.();
            // Reset action states
            if (successCreate) dispatch({ type: SHIPPING_CREATE_ORDER_RESET });
            if (successAssign) dispatch({ type: SHIPPING_ASSIGN_COURIER_RESET });
            if (successPickup) dispatch({ type: SHIPPING_SCHEDULE_PICKUP_RESET });
            if (successCancel) dispatch({ type: SHIPPING_CANCEL_RESET });
            if (successReattempt) dispatch({ type: SHIPPING_NDR_REATTEMPT_RESET });
            if (successRto) dispatch({ type: SHIPPING_NDR_RTO_RESET });
        }
    }, [successCreate, successAssign, successPickup, successCancel, successReattempt, successRto, dispatch, onRefresh]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: SHIPPING_SERVICEABILITY_RESET });
            dispatch({ type: SHIPPING_CREATE_ORDER_RESET });
            dispatch({ type: SHIPPING_ASSIGN_COURIER_RESET });
            dispatch({ type: SHIPPING_SCHEDULE_PICKUP_RESET });
            dispatch({ type: SHIPPING_CANCEL_RESET });
            dispatch({ type: SHIPPING_NDR_REATTEMPT_RESET });
            dispatch({ type: SHIPPING_NDR_RTO_RESET });
        };
    }, [dispatch]);

    const handleCheckRates = () => {
        const deliveryPincode = order.shippingAddress?.postalCode;
        if (!pickupPostcode) {
            alert('Please enter pickup postcode');
            return;
        }
        dispatch(checkServiceability(pickupPostcode, deliveryPincode, weight, order.paymentMethod === 'COD'));
    };

    const handleCreateOrder = () => {
        dispatch(createShippingOrder(order._id, {
            weight: Number(weight),
            dimensions: { length: Number(length), breadth: Number(breadth), height: Number(height) },
        }));
    };

    const handleAssignCourier = () => {
        if (!selectedCourier) {
            alert('Please select a courier first');
            return;
        }
        dispatch(assignCourier(order._id, selectedCourier));
    };

    const handleSchedulePickup = () => dispatch(schedulePickup(order._id));
    const handleGenerateLabel = () => dispatch(generateLabel(order._id));
    const handleGenerateManifest = () => dispatch(generateManifest(order._id));
    const handleRefreshTracking = () => dispatch(trackShippingOrder(order._id));
    const handleCancelShipment = () => {
        if (window.confirm('Are you sure you want to cancel this shipment?')) {
            dispatch(cancelShipment(order._id));
        }
    };

    const handleReattempt = () => {
        dispatch(reattemptDelivery(order._id, {
            newAddress: reattemptAddress || undefined,
            newPhone: reattemptPhone || undefined,
            preferredDate: reattemptDate || undefined,
            remarks: reattemptRemarks || 'Reattempt requested',
        }));
    };

    const handleInitiateRTO = () => {
        if (window.confirm('Are you sure you want to initiate Return To Origin?')) {
            dispatch(initiateRTO(order._id, 'Admin initiated RTO'));
        }
    };

    // Parse courier list from serviceability response
    const courierList = couriers?.data?.available_courier_companies || [];

    return (
        <Card className="my-3">
            <Card.Header as="h5">
                <i className="fas fa-shipping-fast me-2" />
                Shipping
                {isShipped && (
                    <Badge bg={shipping.status === 'CANCELLED' ? 'danger' : 'success'} className="ms-2">
                        {shipping.status || 'Shipped'}
                    </Badge>
                )}
                {isNDR && <Badge bg="danger" className="ms-2">NDR</Badge>}
                {isRTO && <Badge bg="warning" text="dark" className="ms-2">RTO</Badge>}
            </Card.Header>
            <Card.Body>
                {/* Error messages */}
                {errorCreate && <Message variant="danger">{errorCreate}</Message>}
                {errorAssign && <Message variant="danger">{errorAssign}</Message>}
                {errorPickup && <Message variant="danger">{errorPickup}</Message>}
                {errorLabel && <Message variant="danger">{errorLabel}</Message>}
                {errorManifest && <Message variant="danger">{errorManifest}</Message>}
                {errorCancel && <Message variant="danger">{errorCancel}</Message>}
                {errorServiceability && <Message variant="danger">{errorServiceability}</Message>}

                {/* Shipping errors from order */}
                {shipping.errors?.length > 0 && (
                    <Alert variant="warning">
                        <strong>Shipping Errors:</strong>
                        <ul className="mb-0 mt-1">
                            {shipping.errors.map((err, i) => (
                                <li key={i}>{err.action}: {err.message}</li>
                            ))}
                        </ul>
                    </Alert>
                )}

                {/* ==================== PRE-SHIP STATE ==================== */}
                {!isShipped && (
                    <>
                        <h6>Package Details</h6>
                        <Row className="mb-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Weight (kg)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.1"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Length (cm)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={length}
                                        onChange={(e) => setLength(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Breadth (cm)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={breadth}
                                        onChange={(e) => setBreadth(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Height (cm)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Pickup Postcode</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter pickup pincode"
                                        value={pickupPostcode}
                                        onChange={(e) => setPickupPostcode(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4} className="d-flex align-items-end">
                                <Button
                                    variant="outline-primary"
                                    onClick={handleCheckRates}
                                    disabled={loadingServiceability}
                                    className="w-100"
                                >
                                    {loadingServiceability ? <Spinner size="sm" animation="border" /> : 'Check Rates'}
                                </Button>
                            </Col>
                            <Col md={4} className="d-flex align-items-end">
                                <Button
                                    variant="primary"
                                    onClick={handleCreateOrder}
                                    disabled={loadingCreate}
                                    className="w-100"
                                >
                                    {loadingCreate ? <Spinner size="sm" animation="border" /> : 'Ship via ShipRocket'}
                                </Button>
                            </Col>
                        </Row>

                        {/* Courier options table */}
                        {courierList.length > 0 && (
                            <>
                                <h6>Available Couriers</h6>
                                <Table striped bordered hover size="sm" responsive>
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Courier</th>
                                            <th>Rate</th>
                                            <th>EDD</th>
                                            <th>Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courierList.map((c) => (
                                            <tr
                                                key={c.courier_company_id}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setSelectedCourier(c.courier_company_id)}
                                                className={selectedCourier === c.courier_company_id ? 'table-primary' : ''}
                                            >
                                                <td>
                                                    <Form.Check
                                                        type="radio"
                                                        checked={selectedCourier === c.courier_company_id}
                                                        onChange={() => setSelectedCourier(c.courier_company_id)}
                                                    />
                                                </td>
                                                <td>{c.courier_name}</td>
                                                <td>&#8377;{c.rate}</td>
                                                <td>{c.etd}</td>
                                                <td>{c.rating ? `${c.rating}/5` : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </>
                        )}
                    </>
                )}

                {/* ==================== POST-SHIP STATE ==================== */}
                {isShipped && shipping.status !== 'CANCELLED' && (
                    <>
                        {/* Shipping info */}
                        <Row className="mb-3">
                            <Col md={4}>
                                <strong>AWB:</strong>{' '}
                                <Badge bg="info" className="fs-6">{shipping.awbCode || 'Pending'}</Badge>
                            </Col>
                            <Col md={4}>
                                <strong>Courier:</strong> {shipping.courierName || 'Pending'}
                            </Col>
                            <Col md={4}>
                                <strong>Status:</strong>{' '}
                                <Badge bg="primary">{shipping.status}</Badge>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={4}>
                                <strong>Weight:</strong> {shipping.weight || 'N/A'} kg
                            </Col>
                            <Col md={4}>
                                <strong>Charges:</strong> {shipping.courierCharges ? `₹${shipping.courierCharges}` : 'N/A'}
                            </Col>
                            <Col md={4}>
                                <strong>EDD:</strong>{' '}
                                {shipping.estimatedDeliveryDate
                                    ? new Date(shipping.estimatedDeliveryDate).toLocaleDateString('en-IN')
                                    : 'N/A'}
                            </Col>
                        </Row>

                        {/* Action buttons */}
                        {!hasAwb && (
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Pickup Postcode</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={pickupPostcode}
                                            onChange={(e) => setPickupPostcode(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4} className="d-flex align-items-end">
                                    <Button
                                        variant="outline-primary"
                                        onClick={handleCheckRates}
                                        disabled={loadingServiceability}
                                        className="w-100"
                                    >
                                        {loadingServiceability ? <Spinner size="sm" animation="border" /> : 'Check Rates'}
                                    </Button>
                                </Col>
                            </Row>
                        )}

                        {/* Courier selection for unassigned orders */}
                        {!hasAwb && courierList.length > 0 && (
                            <>
                                <Table striped bordered hover size="sm" responsive>
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Courier</th>
                                            <th>Rate</th>
                                            <th>EDD</th>
                                            <th>Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courierList.map((c) => (
                                            <tr
                                                key={c.courier_company_id}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setSelectedCourier(c.courier_company_id)}
                                                className={selectedCourier === c.courier_company_id ? 'table-primary' : ''}
                                            >
                                                <td>
                                                    <Form.Check
                                                        type="radio"
                                                        checked={selectedCourier === c.courier_company_id}
                                                        onChange={() => setSelectedCourier(c.courier_company_id)}
                                                    />
                                                </td>
                                                <td>{c.courier_name}</td>
                                                <td>&#8377;{c.rate}</td>
                                                <td>{c.etd}</td>
                                                <td>{c.rating ? `${c.rating}/5` : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                <Button
                                    variant="success"
                                    onClick={handleAssignCourier}
                                    disabled={loadingAssign || !selectedCourier}
                                    className="mb-3"
                                >
                                    {loadingAssign ? <Spinner size="sm" animation="border" /> : 'Assign Courier'}
                                </Button>
                            </>
                        )}

                        {/* Post-AWB actions */}
                        {hasAwb && (
                            <Row className="mb-3">
                                <Col md={3}>
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={handleSchedulePickup}
                                        disabled={loadingPickup}
                                        className="w-100"
                                    >
                                        {loadingPickup ? <Spinner size="sm" animation="border" /> : 'Schedule Pickup'}
                                    </Button>
                                </Col>
                                <Col md={3}>
                                    <Button
                                        variant="outline-info"
                                        size="sm"
                                        onClick={handleGenerateLabel}
                                        disabled={loadingLabel}
                                        className="w-100"
                                    >
                                        {loadingLabel ? <Spinner size="sm" animation="border" /> : 'Generate Label'}
                                    </Button>
                                </Col>
                                <Col md={3}>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={handleGenerateManifest}
                                        disabled={loadingManifest}
                                        className="w-100"
                                    >
                                        {loadingManifest ? <Spinner size="sm" animation="border" /> : 'Generate Manifest'}
                                    </Button>
                                </Col>
                                <Col md={3}>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={handleRefreshTracking}
                                        disabled={loadingTrack}
                                        className="w-100"
                                    >
                                        {loadingTrack ? <Spinner size="sm" animation="border" /> : 'Refresh Tracking'}
                                    </Button>
                                </Col>
                            </Row>
                        )}

                        {/* Label/Manifest download links */}
                        {(shipping.labelUrl || (successLabel && labelData?.labelUrl)) && (
                            <Alert variant="info" className="py-2">
                                <a href={shipping.labelUrl || labelData?.labelUrl} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-download me-1" /> Download Shipping Label
                                </a>
                            </Alert>
                        )}
                        {(shipping.manifestUrl || (successManifest && manifestData?.manifestUrl)) && (
                            <Alert variant="info" className="py-2">
                                <a href={shipping.manifestUrl || manifestData?.manifestUrl} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-download me-1" /> Download Manifest
                                </a>
                            </Alert>
                        )}

                        {/* Tracking timeline */}
                        {(shipping.trackingHistory?.length > 0 || tracking?.trackingHistory?.length > 0) && (
                            <>
                                <h6 className="mt-3">Tracking Timeline</h6>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <Table size="sm" bordered>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Location</th>
                                                <th>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(tracking?.trackingHistory || shipping.trackingHistory || [])
                                                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                                .map((entry, i) => (
                                                    <tr key={i}>
                                                        <td>{new Date(entry.timestamp).toLocaleString('en-IN')}</td>
                                                        <td><Badge bg="secondary">{entry.status}</Badge></td>
                                                        <td>{entry.location || '-'}</td>
                                                        <td>{entry.remarks || '-'}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </>
                        )}

                        {/* ==================== NDR STATE ==================== */}
                        {isNDR && (
                            <Card className="mt-3 border-danger">
                                <Card.Header className="bg-danger text-white">
                                    <i className="fas fa-exclamation-triangle me-2" />
                                    Non-Delivery Report (NDR)
                                </Card.Header>
                                <Card.Body>
                                    <p>
                                        <strong>Reason:</strong> {shipping.ndr?.lastNdrReason || 'Unknown'}
                                    </p>
                                    <p>
                                        <strong>Attempt Count:</strong> {shipping.ndr?.ndrCount || 0}
                                    </p>
                                    {errorReattempt && <Message variant="danger">{errorReattempt}</Message>}
                                    {errorRto && <Message variant="danger">{errorRto}</Message>}

                                    <h6>Reattempt Delivery</h6>
                                    <Row className="mb-2">
                                        <Col md={6}>
                                            <Form.Control
                                                placeholder="New address (optional)"
                                                value={reattemptAddress}
                                                onChange={(e) => setReattemptAddress(e.target.value)}
                                                className="mb-2"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Control
                                                placeholder="New phone (optional)"
                                                value={reattemptPhone}
                                                onChange={(e) => setReattemptPhone(e.target.value)}
                                                className="mb-2"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Control
                                                type="date"
                                                value={reattemptDate}
                                                onChange={(e) => setReattemptDate(e.target.value)}
                                                className="mb-2"
                                            />
                                        </Col>
                                    </Row>
                                    <Form.Control
                                        placeholder="Remarks"
                                        value={reattemptRemarks}
                                        onChange={(e) => setReattemptRemarks(e.target.value)}
                                        className="mb-3"
                                    />
                                    <Row>
                                        <Col md={6}>
                                            <Button
                                                variant="warning"
                                                onClick={handleReattempt}
                                                disabled={loadingReattempt}
                                                className="w-100"
                                            >
                                                {loadingReattempt ? <Spinner size="sm" animation="border" /> : 'Reattempt Delivery'}
                                            </Button>
                                        </Col>
                                        <Col md={6}>
                                            <Button
                                                variant="danger"
                                                onClick={handleInitiateRTO}
                                                disabled={loadingRto}
                                                className="w-100"
                                            >
                                                {loadingRto ? <Spinner size="sm" animation="border" /> : 'Initiate RTO'}
                                            </Button>
                                        </Col>
                                    </Row>

                                    {/* NDR action history */}
                                    {shipping.ndr?.ndrActions?.length > 0 && (
                                        <>
                                            <h6 className="mt-3">NDR Action History</h6>
                                            <Table size="sm" bordered>
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Action</th>
                                                        <th>Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {shipping.ndr.ndrActions.map((action, i) => (
                                                        <tr key={i}>
                                                            <td>{new Date(action.actionAt).toLocaleString('en-IN')}</td>
                                                            <td>
                                                                <Badge bg={action.action === 'rto' ? 'danger' : 'warning'}>
                                                                    {action.action}
                                                                </Badge>
                                                            </td>
                                                            <td>{action.reason || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* ==================== RTO STATE ==================== */}
                        {isRTO && !isNDR && (
                            <Alert variant="warning" className="mt-3">
                                <strong>RTO Status:</strong> Package is being returned to origin.
                                {shipping.rtoDeliveredAt && (
                                    <span> Returned on {new Date(shipping.rtoDeliveredAt).toLocaleDateString('en-IN')}. Stock restored.</span>
                                )}
                            </Alert>
                        )}

                        {/* Cancel shipment button (only before pickup) */}
                        {hasAwb && !shipping.pickupScheduledDate && shipping.status !== 'CANCELLED' && (
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={handleCancelShipment}
                                disabled={loadingCancel}
                                className="mt-2"
                            >
                                {loadingCancel ? <Spinner size="sm" animation="border" /> : 'Cancel Shipment'}
                            </Button>
                        )}

                        {/* Last synced */}
                        {shipping.syncedAt && (
                            <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.8rem' }}>
                                Last synced: {new Date(shipping.syncedAt).toLocaleString('en-IN')}
                            </p>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default ShippingPanel;
