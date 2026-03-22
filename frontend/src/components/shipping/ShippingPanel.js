import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Form, Row, Col, Table, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
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
    getPickupLocations,
    generateInvoice,
    addPickupLocation,
} from '../../actions/shippingActions';
import {
    SHIPPING_SERVICEABILITY_RESET,
    SHIPPING_CREATE_ORDER_RESET,
    SHIPPING_ASSIGN_COURIER_RESET,
    SHIPPING_SCHEDULE_PICKUP_RESET,
    SHIPPING_CANCEL_RESET,
    SHIPPING_NDR_REATTEMPT_RESET,
    SHIPPING_NDR_RTO_RESET,
    SHIPPING_ADD_PICKUP_RESET,
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
    const [selectedPickupLocation, setSelectedPickupLocation] = useState('');

    // NDR reattempt form
    const [reattemptAddress, setReattemptAddress] = useState('');
    const [reattemptPhone, setReattemptPhone] = useState('');
    const [reattemptDate, setReattemptDate] = useState('');
    const [reattemptRemarks, setReattemptRemarks] = useState('');

    // Add pickup location modal
    const [showAddPickup, setShowAddPickup] = useState(false);
    const [newPickup, setNewPickup] = useState({
        pickup_location: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pin_code: '',
    });

    // Redux states
    const { loading: loadingPickupLocations, locations: pickupLocations, fetched: pickupLocationsFetched } =
        useSelector((state) => state.shippingPickupLocations);
    const { loading: loadingServiceability, couriers, error: errorServiceability } =
        useSelector((state) => state.shippingServiceability);
    const { loading: loadingCreate, success: successCreate, error: errorCreate, data: createData } =
        useSelector((state) => state.shippingCreateOrder);
    const { loading: loadingAssign, success: successAssign, error: errorAssign } =
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
    const { loading: loadingInvoice, success: successInvoice, data: invoiceData, error: errorInvoice } =
        useSelector((state) => state.shippingGenerateInvoice);
    const { loading: loadingAddPickup, success: successAddPickup, error: errorAddPickup } =
        useSelector((state) => state.shippingAddPickup);

    // Fetch pickup locations on mount
    useEffect(() => {
        if (!pickupLocationsFetched && !loadingPickupLocations) {
            dispatch(getPickupLocations());
        }
    }, [dispatch, pickupLocationsFetched, loadingPickupLocations]);

    // Auto-select default pickup location when locations load
    useEffect(() => {
        if (pickupLocations.length > 0 && !selectedPickupLocation) {
            const defaultLocation = pickupLocations.find(
                (loc) => loc.pickup_location === 'ALLSCHOOLUNIFORM.COM'
            ) || pickupLocations[0];
            if (defaultLocation) {
                setSelectedPickupLocation(defaultLocation.pickup_location);
            }
        }
    }, [pickupLocations, selectedPickupLocation]);

    // Refresh order on successful actions
    useEffect(() => {
        if (successCreate || successAssign || successPickup || successCancel || successReattempt || successRto || successInvoice) {
            onRefresh?.();
            if (successCreate) dispatch({ type: SHIPPING_CREATE_ORDER_RESET });
            if (successAssign) dispatch({ type: SHIPPING_ASSIGN_COURIER_RESET });
            if (successPickup) dispatch({ type: SHIPPING_SCHEDULE_PICKUP_RESET });
            if (successCancel) dispatch({ type: SHIPPING_CANCEL_RESET });
            if (successReattempt) dispatch({ type: SHIPPING_NDR_REATTEMPT_RESET });
            if (successRto) dispatch({ type: SHIPPING_NDR_RTO_RESET });
        }
    }, [successCreate, successAssign, successPickup, successCancel, successReattempt, successRto, successInvoice, dispatch, onRefresh]);

    // Refetch pickup locations on successful add
    useEffect(() => {
        if (successAddPickup) {
            dispatch(getPickupLocations());
            dispatch({ type: SHIPPING_ADD_PICKUP_RESET });
            setShowAddPickup(false);
            setNewPickup({ pickup_location: '', phone: '', address: '', city: '', state: '', pin_code: '' });
        }
    }, [successAddPickup, dispatch]);

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
            dispatch({ type: SHIPPING_ADD_PICKUP_RESET });
        };
    }, [dispatch]);

    const handleCheckRates = () => {
        const deliveryPincode = order.shippingAddress?.postalCode;
        const selectedLoc = pickupLocations.find((loc) => loc.pickup_location === selectedPickupLocation);
        const pickupPincode = selectedLoc?.pin_code;
        if (!pickupPincode) {
            alert('Please select a pickup location');
            return;
        }
        dispatch(checkServiceability(pickupPincode, deliveryPincode, weight, order.paymentMethod === 'COD'));
    };

    // Single-step: create order + assign courier in one call
    const handleShipOrder = () => {
        if (!selectedCourier) {
            alert('Please select a courier first');
            return;
        }
        const selectedC = courierList.find((c) => c.courier_company_id === selectedCourier);
        dispatch(createShippingOrder(order._id, {
            weight: Number(weight),
            dimensions: { length: Number(length), breadth: Number(breadth), height: Number(height) },
            pickupLocation: selectedPickupLocation,
            courierId: selectedCourier,
            courierCharges: selectedC?.rate || selectedC?.freight_charge,
            estimatedDeliveryDate: selectedC?.etd || selectedC?.estimated_delivery_date,
            courierName: selectedC?.courier_name,
        }));
    };

    // Fallback: create order without courier (legacy flow)
    const handleCreateOrder = () => {
        dispatch(createShippingOrder(order._id, {
            weight: Number(weight),
            dimensions: { length: Number(length), breadth: Number(breadth), height: Number(height) },
            pickupLocation: selectedPickupLocation,
        }));
    };

    const handleAssignCourier = () => {
        if (!selectedCourier) {
            alert('Please select a courier first');
            return;
        }
        const selectedC = courierList.find((c) => c.courier_company_id === selectedCourier);
        dispatch(assignCourier(order._id, {
            courierId: selectedCourier,
            courierCharges: selectedC?.rate || selectedC?.freight_charge,
            estimatedDeliveryDate: selectedC?.etd || selectedC?.estimated_delivery_date,
            courierName: selectedC?.courier_name,
        }));
    };

    const handleSchedulePickup = () => dispatch(schedulePickup(order._id));
    const handleGenerateLabel = () => dispatch(generateLabel(order._id));
    const handleGenerateManifest = () => dispatch(generateManifest(order._id));
    const handleGenerateInvoice = () => dispatch(generateInvoice(order._id));
    const handleRefreshTracking = () => dispatch(trackShippingOrder(order._id));
    const handleCancelShipment = () => {
        if (window.confirm('Are you sure you want to cancel this shipment?')) {
            dispatch(cancelShipment(order._id));
        }
    };

    const handlePrintLabel = (url) => {
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            printWindow.addEventListener('load', () => {
                printWindow.print();
            });
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

    const handleAddPickup = () => {
        dispatch(addPickupLocation(newPickup));
    };

    // Parse courier list from serviceability response
    const courierList = couriers?.data?.available_courier_companies || [];

    // Order items to display
    const displayItems = order?.modified && order?.modifiedItems?.length > 0
        ? order.modifiedItems
        : order?.orderItems || [];

    const labelUrl = shipping.labelUrl || (successLabel && labelData?.labelUrl);
    const manifestUrl = shipping.manifestUrl || (successManifest && manifestData?.manifestUrl);
    const shippingInvoiceUrl = shipping.invoiceUrl || (successInvoice && invoiceData?.invoiceUrl);

    return (
        <div className="py-3">
            {/* Status badges */}
            <div className="d-flex align-items-center mb-3">
                <h5 className="mb-0 me-3">
                    <i className="fas fa-shipping-fast me-2" />
                    Shipping
                </h5>
                {isShipped && (
                    <Badge bg={shipping.status === 'CANCELLED' ? 'danger' : shipping.status === 'DELIVERED' ? 'success' : 'primary'} className="me-2">
                        {shipping.status || 'Shipped'}
                    </Badge>
                )}
                {isNDR && <Badge bg="danger" className="me-2">NDR</Badge>}
                {isRTO && <Badge bg="warning" text="dark" className="me-2">RTO</Badge>}
            </div>

            {/* Error messages */}
            {errorCreate && <Message variant="danger">{errorCreate}</Message>}
            {successCreate && createData?.awbError && (
                <Message variant="warning">
                    Order created but courier assignment failed: {createData.awbError}. You can assign courier manually from below.
                </Message>
            )}
            {errorAssign && <Message variant="danger">{errorAssign}</Message>}
            {errorPickup && <Message variant="danger">{errorPickup}</Message>}
            {errorLabel && <Message variant="danger">{errorLabel}</Message>}
            {errorManifest && <Message variant="danger">{errorManifest}</Message>}
            {errorCancel && <Message variant="danger">{errorCancel}</Message>}
            {errorServiceability && <Message variant="danger">{errorServiceability}</Message>}
            {errorInvoice && <Message variant="danger">{errorInvoice}</Message>}

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
                    {/* Order Items Summary */}
                    <Card className="mb-3">
                        <Card.Header as="h6">Order Items Summary</Card.Header>
                        <Card.Body className="p-0">
                            <Table size="sm" bordered className="mb-0">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Size</th>
                                        <th>SKU</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayItems.map((item, i) => (
                                        <tr key={i}>
                                            <td>{item.name}</td>
                                            <td>{item.size}</td>
                                            <td>{item.productCode || `ASU-${item.product}`}</td>
                                            <td>{item.qty}</td>
                                            <td>&#8377;{Number((item.price * (1 - (item.disc || 0) / 100)).toFixed(2))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <div className="p-2 d-flex justify-content-between bg-light">
                                <span><strong>Total:</strong> &#8377;{order?.totalPrice}</span>
                                <span><strong>Payment:</strong> {order?.paymentMethod === 'COD' ? 'COD' : 'Prepaid'}</span>
                                <span><strong>Delivery Pincode:</strong> {order?.shippingAddress?.postalCode}</span>
                            </div>
                        </Card.Body>
                    </Card>

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
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Pickup Location</Form.Label>
                                <div className="d-flex">
                                    {loadingPickupLocations ? (
                                        <Spinner size="sm" animation="border" />
                                    ) : (
                                        <Form.Select
                                            value={selectedPickupLocation}
                                            onChange={(e) => setSelectedPickupLocation(e.target.value)}
                                        >
                                            <option value="">Select pickup location...</option>
                                            {pickupLocations.map((loc) => (
                                                <option key={loc.id || loc.pickup_location} value={loc.pickup_location}>
                                                    {loc.pickup_location} — {loc.address}, {loc.city} ({loc.pin_code})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="ms-2"
                                        onClick={() => setShowAddPickup(true)}
                                        title="Add new pickup location"
                                    >
                                        <i className="fas fa-plus" />
                                    </Button>
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Button
                                variant="outline-primary"
                                onClick={handleCheckRates}
                                disabled={loadingServiceability || !selectedPickupLocation}
                                className="w-100"
                            >
                                {loadingServiceability ? <Spinner size="sm" animation="border" /> : 'Check Rates'}
                            </Button>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            {courierList.length > 0 && selectedCourier ? (
                                <Button
                                    variant="success"
                                    onClick={handleShipOrder}
                                    disabled={loadingCreate}
                                    className="w-100"
                                >
                                    {loadingCreate ? <Spinner size="sm" animation="border" /> : 'Ship Order'}
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleCreateOrder}
                                    disabled={loadingCreate || !selectedPickupLocation}
                                    className="w-100"
                                >
                                    {loadingCreate ? <Spinner size="sm" animation="border" /> : 'Ship without Courier'}
                                </Button>
                            )}
                        </Col>
                    </Row>

                    {/* Courier options table */}
                    {courierList.length > 0 && (
                        <>
                            <h6>Available Couriers — Select one to ship</h6>
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
                                            <td>&#8377;{c.rate || c.freight_charge}</td>
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
                        <Col md={3}>
                            <strong>Weight:</strong> {shipping.weight || 'N/A'} kg
                        </Col>
                        <Col md={3}>
                            <strong>Charges:</strong> {shipping.courierCharges ? `₹${shipping.courierCharges}` : 'N/A'}
                        </Col>
                        <Col md={3}>
                            <strong>EDD:</strong>{' '}
                            {shipping.estimatedDeliveryDate
                                ? new Date(shipping.estimatedDeliveryDate).toLocaleDateString('en-IN')
                                : 'N/A'}
                        </Col>
                        <Col md={3}>
                            <strong>Provider:</strong> {shipping.provider || 'shiprocket'}
                        </Col>
                    </Row>

                    {/* Provider IDs */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <small className="text-muted">SR Order ID:</small>{' '}
                            <Badge bg="secondary">{shipping.providerOrderId || '-'}</Badge>
                        </Col>
                        <Col md={4}>
                            <small className="text-muted">SR Shipment ID:</small>{' '}
                            <Badge bg="secondary">{shipping.providerShipmentId || '-'}</Badge>
                        </Col>
                        <Col md={4}>
                            {shipping.pickupTokenNumber && (
                                <>
                                    <small className="text-muted">Pickup Token:</small>{' '}
                                    <Badge bg="secondary">{shipping.pickupTokenNumber}</Badge>
                                </>
                            )}
                        </Col>
                    </Row>

                    {/* Action buttons for unassigned orders */}
                    {!hasAwb && (
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Pickup Location</Form.Label>
                                    {loadingPickupLocations ? (
                                        <Spinner size="sm" animation="border" />
                                    ) : (
                                        <Form.Select
                                            value={selectedPickupLocation}
                                            onChange={(e) => setSelectedPickupLocation(e.target.value)}
                                        >
                                            <option value="">Select pickup location...</option>
                                            {pickupLocations.map((loc) => (
                                                <option key={loc.id || loc.pickup_location} value={loc.pickup_location}>
                                                    {loc.pickup_location} — {loc.address}, {loc.city} ({loc.pin_code})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6} className="d-flex align-items-end">
                                <Button
                                    variant="outline-primary"
                                    onClick={handleCheckRates}
                                    disabled={loadingServiceability || !selectedPickupLocation}
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
                                            <td>&#8377;{c.rate || c.freight_charge}</td>
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
                        <Row className="mb-3 g-2">
                            <Col md={2}>
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
                            <Col md={2}>
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
                            <Col md={2}>
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
                            <Col md={2}>
                                <Button
                                    variant="outline-dark"
                                    size="sm"
                                    onClick={handleGenerateInvoice}
                                    disabled={loadingInvoice}
                                    className="w-100"
                                >
                                    {loadingInvoice ? <Spinner size="sm" animation="border" /> : 'Generate Invoice'}
                                </Button>
                            </Col>
                            <Col md={2}>
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

                    {/* Download / Print links */}
                    {labelUrl && (
                        <Alert variant="info" className="py-2 d-flex align-items-center justify-content-between">
                            <a href={labelUrl} target="_blank" rel="noopener noreferrer">
                                <i className="fas fa-download me-1" /> Download Label
                            </a>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handlePrintLabel(labelUrl)}
                            >
                                <i className="fas fa-print me-1" /> Print Label
                            </Button>
                        </Alert>
                    )}
                    {manifestUrl && (
                        <Alert variant="info" className="py-2">
                            <a href={manifestUrl} target="_blank" rel="noopener noreferrer">
                                <i className="fas fa-download me-1" /> Download Manifest
                            </a>
                        </Alert>
                    )}
                    {shippingInvoiceUrl && (
                        <Alert variant="info" className="py-2">
                            <a href={shippingInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                <i className="fas fa-download me-1" /> Download Shipping Invoice
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

            {/* ==================== ADD PICKUP LOCATION MODAL ==================== */}
            <Modal show={showAddPickup} onHide={() => setShowAddPickup(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Pickup Location</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {errorAddPickup && <Message variant="danger">{errorAddPickup}</Message>}
                    <Form.Group className="mb-3">
                        <Form.Label>Location Name *</Form.Label>
                        <Form.Control
                            value={newPickup.pickup_location}
                            onChange={(e) => setNewPickup({ ...newPickup, pickup_location: e.target.value })}
                            placeholder="e.g. Warehouse Delhi"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Phone *</Form.Label>
                        <Form.Control
                            value={newPickup.phone}
                            onChange={(e) => setNewPickup({ ...newPickup, phone: e.target.value })}
                            placeholder="10-digit phone number"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Address *</Form.Label>
                        <Form.Control
                            value={newPickup.address}
                            onChange={(e) => setNewPickup({ ...newPickup, address: e.target.value })}
                            placeholder="Full address"
                        />
                    </Form.Group>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>City *</Form.Label>
                                <Form.Control
                                    value={newPickup.city}
                                    onChange={(e) => setNewPickup({ ...newPickup, city: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>State *</Form.Label>
                                <Form.Control
                                    value={newPickup.state}
                                    onChange={(e) => setNewPickup({ ...newPickup, state: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Pin Code *</Form.Label>
                        <Form.Control
                            value={newPickup.pin_code}
                            onChange={(e) => setNewPickup({ ...newPickup, pin_code: e.target.value })}
                            placeholder="6-digit pin code"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddPickup(false)}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleAddPickup}
                        disabled={loadingAddPickup || !newPickup.pickup_location || !newPickup.phone || !newPickup.address || !newPickup.city || !newPickup.state || !newPickup.pin_code}
                    >
                        {loadingAddPickup ? <Spinner size="sm" animation="border" /> : 'Add Location'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ShippingPanel;
