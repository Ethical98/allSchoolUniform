import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Row, Col, Card, Form, Button, Table, Alert, ListGroup, Badge,
} from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import AdminPageLayout from '../components/AdminPageLayout';
import ProductSearchModal from '../components/ProductSearchModal';
import { getOrderDetails } from '../actions/orderActions';
import { createReturn, getReturnsByOrder } from '../actions/returnActions';
import { RETURN_CREATE_RESET } from '../constants/returnConstants';
import { logout } from '../actions/userActions';

// Mirrors backend modules/returns/utils/refundDestination.js validation.
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_RE = /^\d{9,18}$/;

const RETURN_REASONS = [
    'DEFECTIVE',
    'WRONG_ITEM',
    'WRONG_SIZE',
    'QUALITY_ISSUE',
    'NOT_AS_DESCRIBED',
    'DAMAGED_IN_TRANSIT',
    'CHANGED_MIND',
    'OTHER',
];

const ReturnCreateScreen = ({ match, history }) => {
    const orderId = match.params.orderId;
    const dispatch = useDispatch();

    // Steps: 1=summary, 2=items, 3=type, 4=reason, 5=address, 6=review
    const [step, setStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState([]);
    const [returnType, setReturnType] = useState('RETURN');
    const [exchangeSelections, setExchangeSelections] = useState({});
    const [reason, setReason] = useState('');
    const [reasonDetails, setReasonDetails] = useState('');
    const [overrideWindow, setOverrideWindow] = useState(false);
    // COD refund destination (only used when order.paymentMethod === 'COD')
    const [refundMethod, setRefundMethod] = useState('');
    const [refundUpiId, setRefundUpiId] = useState('');
    const [refundBankDetails, setRefundBankDetails] = useState({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
    });
    const [pickupAddress, setPickupAddress] = useState({
        address: '',
        city: '',
        postalCode: '',
        state: '',
        phone: '',
    });
    const [showProductModal, setShowProductModal] = useState(false);
    const [modalTargetItemId, setModalTargetItemId] = useState(null);

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const orderDetails = useSelector((state) => state.orderDetails);
    const { loading: orderLoading, error: orderError, order } = orderDetails;

    const returnByOrder = useSelector((state) => state.returnByOrder);
    const { returns: existingReturns, error: returnByOrderError } = returnByOrder;

    const returnCreate = useSelector((state) => state.returnCreate);
    const {
        loading: createLoading,
        error: createError,
        success: createSuccess,
        returnRequest: createdReturn,
    } = returnCreate;

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
        dispatch(getOrderDetails(orderId));
        dispatch(getReturnsByOrder(orderId));
        // eslint-disable-next-line
    }, [dispatch, orderId, userInfo]);

    // Pre-fill pickup address from order
    useEffect(() => {
        if (order && order.shippingAddress) {
            setPickupAddress({
                address: order.shippingAddress.address || '',
                city: order.shippingAddress.city || '',
                postalCode: order.shippingAddress.postalCode || '',
                state: order.shippingAddress.state || '',
                phone: order.phone || '',
            });
        }
    }, [order]);

    // On success redirect
    useEffect(() => {
        if (createSuccess && createdReturn) {
            dispatch({ type: RETURN_CREATE_RESET });
            history.push(`/admin/returns/${createdReturn._id}`);
        }
    }, [createSuccess, createdReturn, dispatch, history]);

    // Calculate already returned qty per item (matches by product + size, same as backend)
    const getReturnedQty = (productId, size) => {
        if (!existingReturns || existingReturns.length === 0) return 0;
        let qty = 0;
        existingReturns.forEach((ret) => {
            if (ret.status !== 'REJECTED' && ret.status !== 'CANCELLED') {
                (ret.items || []).forEach((ri) => {
                    if (
                        (ri.product === productId || ri.product?._id === productId) &&
                        ri.size === size
                    ) {
                        qty += ri.returnQty || 0;
                    }
                });
            }
        });
        return qty;
    };

    const RETURN_WINDOW_DAYS = 7;
    const isWindowExpired = () => {
        if (!order) return false;
        const deliveredAt = order.tracking?.deliveredAt;
        if (!deliveredAt) return false;
        const days = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
        return days > RETURN_WINDOW_DAYS;
    };

    const toggleItem = (item) => {
        const itemKey = `${item.product}:${item.size}`;
        setSelectedItems((prev) => {
            const exists = prev.find((s) => s.itemKey === itemKey);
            if (exists) {
                return prev.filter((s) => s.itemKey !== itemKey);
            }
            const alreadyReturned = getReturnedQty(item.product, item.size);
            const available = Math.max(item.qty - alreadyReturned, 0);
            return [
                ...prev,
                {
                    itemKey,
                    orderItemId: item._id,
                    product: item.product,
                    name: item.name,
                    size: item.size,
                    price: item.price,
                    disc: item.disc || 0,
                    tax: item.tax || 0,
                    maxQty: available,
                    returnQty: available,
                    alreadyReturned,
                },
            ];
        });
    };

    const updateItemQty = (itemKey, qty) => {
        setSelectedItems((prev) =>
            prev.map((s) =>
                s.itemKey === itemKey
                    ? { ...s, returnQty: Math.min(Math.max(1, qty), s.maxQty) }
                    : s
            )
        );
    };

    const handleExchangeProductSelected = ({ productId, productName, size, price, stock }) => {
        if (!modalTargetItemId) return;
        setExchangeSelections((prev) => ({
            ...prev,
            [modalTargetItemId]: { product: productId, productId, name: productName, productName, size, price, stock },
        }));
        setModalTargetItemId(null);
    };

    const calculateRefund = () => {
        return selectedItems.reduce((sum, item) => {
            const discountedPrice = item.price * (1 - (item.disc || 0) / 100);
            return sum + discountedPrice * item.returnQty;
        }, 0).toFixed(2);
    };

    const submitHandler = () => {
        // Validate exchange selections
        if (returnType === 'EXCHANGE') {
            const missingExchange = selectedItems.filter(
                (item) => !exchangeSelections[item.orderItemId]?.product
            );
            if (missingExchange.length > 0) {
                alert('Please select exchange products for all items');
                return;
            }
        }

        // Validate address
        if (!pickupAddress.address || !pickupAddress.city || !pickupAddress.state || !pickupAddress.postalCode) {
            alert('Please fill in all address fields');
            setStep(5);
            return;
        }

        // COD returns need a refund destination (no original payment to reverse).
        const isCod = order?.paymentMethod === 'COD';
        let refundPayload = {};
        if (isCod) {
            if (refundMethod === 'UPI') {
                const upi = refundUpiId.trim();
                if (!UPI_RE.test(upi)) {
                    alert('A valid UPI ID is required for the refund (e.g. name@bank).');
                    return;
                }
                refundPayload = { refundMethod: 'UPI', refundUpiId: upi };
            } else if (refundMethod === 'BANK_TRANSFER') {
                const name = refundBankDetails.accountHolderName.trim();
                const acc = refundBankDetails.accountNumber.trim();
                const ifsc = refundBankDetails.ifscCode.trim().toUpperCase();
                if (name.length < 2) {
                    alert('Account holder name is required.');
                    return;
                }
                if (!ACCOUNT_RE.test(acc)) {
                    alert('A valid account number (9–18 digits) is required.');
                    return;
                }
                if (!IFSC_RE.test(ifsc)) {
                    alert('A valid IFSC code is required.');
                    return;
                }
                refundPayload = {
                    refundMethod: 'BANK_TRANSFER',
                    refundBankDetails: { accountHolderName: name, accountNumber: acc, ifscCode: ifsc },
                };
            } else {
                alert('Select a refund destination (UPI or bank) for this COD return.');
                return;
            }
        }

        const items = selectedItems.map((item) => ({
            product: item.product,
            size: item.size,
            returnQty: item.returnQty,
            ...(returnType === 'EXCHANGE' && exchangeSelections[item.orderItemId]
                ? {
                    exchangeProduct: exchangeSelections[item.orderItemId].product,
                    exchangeProductName: exchangeSelections[item.orderItemId].name || '',
                    exchangeSize: exchangeSelections[item.orderItemId].size,
                    exchangeUnitPrice: Number(exchangeSelections[item.orderItemId].price) || 0,
                  }
                : {}),
        }));

        dispatch(
            createReturn({
                orderId,
                type: returnType,
                reason,
                reasonDetails,
                items,
                pickupAddress,
                overrideReturnWindow: overrideWindow,
                ...refundPayload,
            })
        );
    };

    const nextStep = () => setStep((s) => Math.min(s + 1, 6));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const windowExpired = isWindowExpired();

    return (
        <AdminPageLayout>
            <h2>Create Return / Exchange</h2>

            {orderLoading ? (
                <Loader />
            ) : orderError ? (
                <Message variant="danger">{orderError}</Message>
            ) : !order ? (
                <Message variant="warning">Order not found</Message>
            ) : (
                <>
                    {createError && <Message variant="danger">{createError}</Message>}
                    {returnByOrderError && (
                        <Message variant="warning">
                            Warning: Could not load existing returns for this order ({returnByOrderError}).
                            Already-returned quantities may be inaccurate.
                        </Message>
                    )}
                    {createLoading && <Loader />}

                    {/* Step indicator */}
                    <Row className="mb-3">
                        {[1, 2, 3, 4, 5, 6].map((s) => (
                            <Col key={s} xs={2}>
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        backgroundColor: step === s ? '#007bff' : step > s ? '#28a745' : '#e9ecef',
                                        color: step >= s ? '#fff' : '#333',
                                        fontSize: '0.85rem',
                                        cursor: step > s ? 'pointer' : 'default',
                                    }}
                                    onClick={() => step > s && setStep(s)}
                                >
                                    {s === 1 && 'Order'}
                                    {s === 2 && 'Items'}
                                    {s === 3 && 'Type'}
                                    {s === 4 && 'Reason'}
                                    {s === 5 && 'Address'}
                                    {s === 6 && 'Review'}
                                </div>
                            </Col>
                        ))}
                    </Row>

                    {/* Step 1: Order Summary */}
                    {step === 1 && (
                        <Card className="mb-3">
                            <Card.Header>Order Summary</Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <p><strong>Order ID:</strong> {order.orderId}</p>
                                        <p><strong>Customer:</strong> {order.user?.name}</p>
                                        <p><strong>Order Date:</strong> {order.createdAt?.substring(0, 10)}</p>
                                        <p><strong>Total:</strong> ₹{order.totalPrice}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Payment:</strong> {order.paymentMethod}</p>
                                        <p><strong>Delivered:</strong> {order.tracking?.deliveredAt?.substring(0, 10) || 'Not delivered'}</p>
                                        <p>
                                            <strong>Return Window:</strong>{' '}
                                            {windowExpired ? (
                                                <span className="text-danger">Expired</span>
                                            ) : (
                                                <span className="text-success">Open</span>
                                            )}
                                        </p>
                                    </Col>
                                </Row>
                                {windowExpired && (
                                    <Alert variant="warning">
                                        <Form.Check
                                            type="checkbox"
                                            label="Override: Allow return despite expired window (admin override)"
                                            checked={overrideWindow}
                                            onChange={(e) => setOverrideWindow(e.target.checked)}
                                        />
                                    </Alert>
                                )}
                                <p><strong>Items:</strong></p>
                                <Table bordered size="sm">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Size</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(order.orderItems || []).map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.name}</td>
                                                <td>{item.size}</td>
                                                <td>{item.qty}</td>
                                                <td>₹{item.price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                <Button onClick={nextStep}>
                                    Next: Select Items
                                </Button>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Step 2: Item Selection */}
                    {step === 2 && (
                        <Card className="mb-3">
                            <Card.Header>Select Items to Return</Card.Header>
                            <Card.Body>
                                <Table bordered>
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>Product</th>
                                            <th>Size</th>
                                            <th>Ordered</th>
                                            <th>Already Returned</th>
                                            <th>Return Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(order.orderItems || []).map((item) => {
                                            const alreadyReturned = getReturnedQty(item.product, item.size);
                                            const available = item.qty - alreadyReturned;
                                            const itemKey = `${item.product}:${item.size}`;
                                            const selected = selectedItems.find(
                                                (s) => s.itemKey === itemKey
                                            );
                                            return (
                                                <tr key={item._id}>
                                                    <td>
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={!!selected}
                                                            disabled={available <= 0}
                                                            onChange={() => toggleItem(item)}
                                                        />
                                                    </td>
                                                    <td>{item.name}</td>
                                                    <td>{item.size}</td>
                                                    <td>{item.qty}</td>
                                                    <td>{alreadyReturned}</td>
                                                    <td>
                                                        {selected ? (
                                                            <Form.Control
                                                                type="number"
                                                                min={1}
                                                                max={available}
                                                                value={selected.returnQty}
                                                                onChange={(e) =>
                                                                    updateItemQty(
                                                                        itemKey,
                                                                        Number(e.target.value)
                                                                    )
                                                                }
                                                                style={{ width: '80px' }}
                                                            />
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                                <Button variant="secondary" className="mr-2" onClick={prevStep}>
                                    Back
                                </Button>
                                <Button
                                    onClick={nextStep}
                                    disabled={selectedItems.length === 0}
                                >
                                    Next: Select Type
                                </Button>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Step 3: Type Selection */}
                    {step === 3 && (
                        <Card className="mb-3">
                            <Card.Header>Return Type</Card.Header>
                            <Card.Body>
                                <Form.Group>
                                    {['RETURN'].map((t) => (
                                        <Form.Check
                                            key={t}
                                            type="radio"
                                            label={t}
                                            name="returnType"
                                            value={t}
                                            checked={returnType === t}
                                            onChange={(e) => setReturnType(e.target.value)}
                                            className="mb-2"
                                        />
                                    ))}
                                </Form.Group>

                                {returnType === 'EXCHANGE' && (
                                    <div className="mt-3">
                                        <h6>Exchange Selections</h6>
                                        {selectedItems.map((item) => {
                                            const sel = exchangeSelections[item.orderItemId];
                                            return (
                                                <Card key={item.orderItemId} className="mb-2 p-2">
                                                    <p className="mb-1">
                                                        <strong>{item.name}</strong> (returning size: {item.size})
                                                    </p>
                                                    {sel?.productId || sel?.product ? (
                                                        <div className="d-flex align-items-center">
                                                            <span className="mr-3">
                                                                <Badge bg="success">{sel.productName || sel.name}</Badge>{' '}
                                                                Size: <strong>{sel.size}</strong>{' '}
                                                                ₹{sel.price}
                                                                {sel.stock < (item.returnQty || 1) && (
                                                                    <Badge bg="danger" className="ml-2">Low Stock: {sel.stock}</Badge>
                                                                )}
                                                            </span>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setModalTargetItemId(item.orderItemId);
                                                                    setShowProductModal(true);
                                                                }}
                                                            >
                                                                Change
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setModalTargetItemId(item.orderItemId);
                                                                setShowProductModal(true);
                                                            }}
                                                        >
                                                            + Select Exchange Product
                                                        </Button>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="mt-3">
                                    <Button variant="secondary" className="mr-2" onClick={prevStep}>
                                        Back
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (returnType === 'EXCHANGE') {
                                                const missing = selectedItems.filter(
                                                    (item) => !exchangeSelections[item.orderItemId]?.productId &&
                                                              !exchangeSelections[item.orderItemId]?.product
                                                );
                                                if (missing.length > 0) {
                                                    alert(`Please select exchange products for: ${missing.map(i => i.name).join(', ')}`);
                                                    return;
                                                }
                                            }
                                            nextStep();
                                        }}
                                    >Next: Reason</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Step 4: Reason */}
                    {step === 4 && (
                        <Card className="mb-3">
                            <Card.Header>Reason for Return</Card.Header>
                            <Card.Body>
                                <Form.Group>
                                    <Form.Label>Reason</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    >
                                        <option value="">Select reason...</option>
                                        {RETURN_REASONS.map((r) => (
                                            <option key={r} value={r}>
                                                {r.replace(/_/g, ' ')}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group className="mt-2">
                                    <Form.Label>Details</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={reasonDetails}
                                        onChange={(e) => setReasonDetails(e.target.value)}
                                        placeholder="Additional details..."
                                    />
                                </Form.Group>
                                <div className="mt-3">
                                    <Button variant="secondary" className="mr-2" onClick={prevStep}>
                                        Back
                                    </Button>
                                    <Button onClick={nextStep} disabled={!reason}>
                                        Next: Pickup Address
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Step 5: Pickup Address */}
                    {step === 5 && (
                        <Card className="mb-3">
                            <Card.Header>Pickup Address</Card.Header>
                            <Card.Body>
                                <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={pickupAddress.address}
                                        onChange={(e) =>
                                            setPickupAddress((p) => ({ ...p, address: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                                <Row className="mt-2">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>City</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={pickupAddress.city}
                                                onChange={(e) =>
                                                    setPickupAddress((p) => ({ ...p, city: e.target.value }))
                                                }
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>State</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={pickupAddress.state}
                                                onChange={(e) =>
                                                    setPickupAddress((p) => ({ ...p, state: e.target.value }))
                                                }
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Postal Code</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={pickupAddress.postalCode}
                                                onChange={(e) =>
                                                    setPickupAddress((p) => ({
                                                        ...p,
                                                        postalCode: e.target.value,
                                                    }))
                                                }
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mt-2">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={pickupAddress.phone}
                                        onChange={(e) =>
                                            setPickupAddress((p) => ({ ...p, phone: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                                <div className="mt-3">
                                    <Button variant="secondary" className="mr-2" onClick={prevStep}>
                                        Back
                                    </Button>
                                    <Button
                                        onClick={nextStep}
                                        disabled={
                                            !pickupAddress.address?.trim() ||
                                            !pickupAddress.city?.trim() ||
                                            !pickupAddress.state?.trim() ||
                                            !pickupAddress.postalCode?.trim()
                                        }
                                    >
                                        Next: Review
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Step 6: Review */}
                    {step === 6 && (
                        <Card className="mb-3">
                            <Card.Header>Review & Submit</Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <h6>Order: {order.orderId}</h6>
                                        <p><strong>Type:</strong> {returnType}</p>
                                        <p><strong>Reason:</strong> {reason.replace(/_/g, ' ')}</p>
                                        {reasonDetails && <p><strong>Details:</strong> {reasonDetails}</p>}
                                        {overrideWindow && (
                                            <Alert variant="warning">Admin window override applied</Alert>
                                        )}
                                    </Col>
                                    <Col md={6}>
                                        <h6>Pickup Address</h6>
                                        <p>
                                            {pickupAddress.address}, {pickupAddress.city},{' '}
                                            {pickupAddress.state} - {pickupAddress.postalCode}
                                        </p>
                                        <p>Phone: {pickupAddress.phone}</p>
                                    </Col>
                                </Row>

                                <h6 className="mt-3">Items</h6>
                                <Table bordered size="sm">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Size</th>
                                            <th>Qty</th>
                                            <th>Unit Price</th>
                                            <th>Subtotal</th>
                                            {returnType === 'EXCHANGE' && <th>Exchange</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedItems.map((item) => (
                                            <tr key={item.orderItemId}>
                                                <td>{item.name}</td>
                                                <td>{item.size}</td>
                                                <td>{item.returnQty}</td>
                                                <td>₹{(item.price * (1 - (item.disc || 0) / 100)).toFixed(2)}{item.disc > 0 && <small className="text-muted ml-1">(MRP: ₹{item.price})</small>}</td>
                                                <td>₹{(item.price * (1 - (item.disc || 0) / 100) * item.returnQty).toFixed(2)}</td>
                                                {returnType === 'EXCHANGE' && (
                                                    <td>
                                                        {exchangeSelections[item.orderItemId]?.size
                                                            ? `Size: ${exchangeSelections[item.orderItemId].size}`
                                                            : '-'}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                <ListGroup className="mb-3">
                                    <ListGroup.Item>
                                        <strong>Estimated Refund: ₹{calculateRefund()}</strong>
                                    </ListGroup.Item>
                                </ListGroup>

                                {order?.paymentMethod === 'COD' && (
                                    <Card className="mb-3">
                                        <Card.Header>Refund Destination (COD)</Card.Header>
                                        <Card.Body>
                                            <Alert variant="info" className="py-2">
                                                This was a COD order, so there is no original payment to reverse.
                                                Enter the customer's UPI or bank details to send the refund.
                                            </Alert>
                                            <Form.Group>
                                                <Form.Check
                                                    type="radio"
                                                    label="UPI"
                                                    name="refundMethod"
                                                    value="UPI"
                                                    checked={refundMethod === 'UPI'}
                                                    onChange={(e) => setRefundMethod(e.target.value)}
                                                    className="mb-2"
                                                    inline
                                                />
                                                <Form.Check
                                                    type="radio"
                                                    label="Bank Transfer"
                                                    name="refundMethod"
                                                    value="BANK_TRANSFER"
                                                    checked={refundMethod === 'BANK_TRANSFER'}
                                                    onChange={(e) => setRefundMethod(e.target.value)}
                                                    className="mb-2"
                                                    inline
                                                />
                                            </Form.Group>

                                            {refundMethod === 'UPI' && (
                                                <Form.Group>
                                                    <Form.Label>UPI ID</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="name@bank"
                                                        value={refundUpiId}
                                                        onChange={(e) => setRefundUpiId(e.target.value)}
                                                    />
                                                </Form.Group>
                                            )}

                                            {refundMethod === 'BANK_TRANSFER' && (
                                                <>
                                                    <Form.Group>
                                                        <Form.Label>Account Holder Name</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={refundBankDetails.accountHolderName}
                                                            onChange={(e) => setRefundBankDetails((prev) => ({
                                                                ...prev, accountHolderName: e.target.value,
                                                            }))}
                                                        />
                                                    </Form.Group>
                                                    <Form.Group className="mt-2">
                                                        <Form.Label>Account Number</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={refundBankDetails.accountNumber}
                                                            onChange={(e) => setRefundBankDetails((prev) => ({
                                                                ...prev, accountNumber: e.target.value,
                                                            }))}
                                                        />
                                                    </Form.Group>
                                                    <Form.Group className="mt-2">
                                                        <Form.Label>IFSC Code</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={refundBankDetails.ifscCode}
                                                            onChange={(e) => setRefundBankDetails((prev) => ({
                                                                ...prev, ifscCode: e.target.value.toUpperCase(),
                                                            }))}
                                                        />
                                                    </Form.Group>
                                                </>
                                            )}
                                        </Card.Body>
                                    </Card>
                                )}

                                <Button variant="secondary" className="mr-2" onClick={prevStep}>
                                    Back
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={submitHandler}
                                    disabled={createLoading}
                                >
                                    {createLoading ? 'Submitting...' : 'Submit Return Request'}
                                </Button>
                            </Card.Body>
                        </Card>
                    )}
                </>
            )}
            <ProductSearchModal
                show={showProductModal}
                onHide={() => setShowProductModal(false)}
                onSelect={handleExchangeProductSelected}
                userInfo={userInfo}
                title="Select Exchange Product"
            />
        </AdminPageLayout>
    );
};

export default ReturnCreateScreen;
