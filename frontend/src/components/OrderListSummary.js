import React, { useMemo, useState } from 'react';
import { Card, Badge, ListGroup, Image, Button, Offcanvas, Form, Row, Col } from 'react-bootstrap';
import { groupBy, sumBy } from 'lodash';

const OrderListSummary = ({ orders = [] }) => {
    const [showPicking, setShowPicking] = useState(false);
    const [showShipping, setShowShipping] = useState(false);
    const [expandedPickItem, setExpandedPickItem] = useState(null);
    const [expandedShipItem, setExpandedShipItem] = useState(null);
    const [pickedItems, setPickedItems] = useState({});

    const handleClosePicking = () => setShowPicking(false);
    const handleShowPicking = () => setShowPicking(true);
    const handleCloseShipping = () => setShowShipping(false);
    const handleShowShipping = () => setShowShipping(true);

    // Calculate summary statistics
    const orderSummary = useMemo(() => {
        if (!orders || orders.length === 0) {
            return {
                totalOrders: 0,
                totalRevenue: 0,
                totalUnitsToShip: 0,
                pendingShipment: 0,
                deliveredOrders: 0,
                canceledOrders: 0,
                modifiedOrders: 0,
                itemsToPick: [],
                itemsToShip: []
            };
        }

        // Orders that need to be shipped (not delivered and not cancelled)
        const ordersToShip = orders.filter((order) => !order.tracking.isDelivered && !order.tracking.isCanceled);

        // Count modified orders
        const modifiedOrders = orders.filter((order) => order.modified === true).length;

        // Separate orders for picking (Received status only) and shipping (Confirmed, Processing, Out for Delivery)
        const ordersForPicking = ordersToShip.filter(
            (order) => !order.tracking.isConfirmed && !order.tracking.isProcessing && !order.tracking.isOutForDelivery
        );

        const ordersForShipping = ordersToShip.filter(
            (order) => order.tracking.isConfirmed || order.tracking.isProcessing || order.tracking.isOutForDelivery
        );

        // Collect items for picking (Received status)
        const allItemsToPick = [];
        ordersForPicking.forEach((order) => {
            const itemsToProcess = order.modified && order.modifiedItems ? order.modifiedItems : order.orderItems;
            itemsToProcess.forEach((item) => {
                allItemsToPick.push({
                    orderId: order.orderId,
                    name: item.name,
                    size: item.size,
                    qty: item.qty,
                    image: item.image,
                    isModified: order.modified === true,
                    orderStatus: 'Received'
                });
            });
        });

        // Collect items for shipping (other statuses)
        const allItemsToShip = [];
        ordersForShipping.forEach((order) => {
            const itemsToProcess = order.modified && order.modifiedItems ? order.modifiedItems : order.orderItems;
            itemsToProcess.forEach((item) => {
                allItemsToShip.push({
                    orderId: order.orderId,
                    name: item.name,
                    size: item.size,
                    qty: item.qty,
                    image: item.image,
                    isModified: order.modified === true,
                    orderStatus: order.tracking.isOutForDelivery
                        ? 'Out For Delivery'
                        : order.tracking.isProcessing
                        ? 'Processing'
                        : 'Confirmed'
                });
            });
        });

        // Calculate total units to ship
        const totalUnitsToShip = ordersToShip.reduce(
            (sum, order) =>
                sum +
                (order.modified && order.modifiedItems ? order.modifiedItems : order.orderItems).reduce(
                    (itemSum, item) => itemSum + item.qty,
                    0
                ),
            0
        );

        // Group items by product name and size for picking
        const groupedPickItems = groupBy(allItemsToPick, (item) => `${item.name}|${item.size}`);
        const itemsToPick = Object.entries(groupedPickItems).map(([key, items]) => ({
            id: key,
            productName: items[0].name,
            size: items[0].size,
            totalQty: sumBy(items, 'qty'),
            image: items[0].image,
            orderDetails: items.map((i) => ({
                orderId: i.orderId,
                qty: i.qty,
                status: i.orderStatus,
                isModified: i.isModified
            }))
        }));

        // Group items by product name and size for shipping
        const groupedShipItems = groupBy(allItemsToShip, (item) => `${item.name}|${item.size}`);
        const itemsToShip = Object.entries(groupedShipItems).map(([key, items]) => ({
            id: key,
            productName: items[0].name,
            size: items[0].size,
            totalQty: sumBy(items, 'qty'),
            image: items[0].image,
            orderDetails: items.map((i) => ({
                orderId: i.orderId,
                qty: i.qty,
                status: i.orderStatus,
                isModified: i.isModified
            }))
        }));

        return {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
            totalUnitsToShip: totalUnitsToShip,
            pendingShipment: ordersToShip.length,
            deliveredOrders: orders.filter((order) => order.tracking.isDelivered).length,
            canceledOrders: orders.filter((order) => order.tracking.isCanceled).length,
            modifiedOrders: modifiedOrders,
            itemsToPick: itemsToPick.sort((a, b) => b.totalQty - a.totalQty),
            itemsToShip: itemsToShip.sort((a, b) => b.totalQty - a.totalQty)
        };
    }, [orders]);

    // Handle checkbox change
    const handleCheckboxChange = (itemId) => {
        setPickedItems((prev) => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    // Separate picked and unpicked items
    const unpickedItems = orderSummary.itemsToPick.filter((item) => !pickedItems[item.id]);
    const pickedItemsList = orderSummary.itemsToPick.filter((item) => pickedItems[item.id]);

    return (
        <>
            {/* Summary Cards - Outside */}
            <Row className="g-3 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small">Total Orders</p>
                                    <h2 className="mb-0 fw-bold">{orderSummary.totalOrders}</h2>
                                </div>
                                <div className="fs-1 text-muted opacity-25">
                                    <i className="fas fa-shopping-cart"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small">Revenue</p>
                                    <h2 className="mb-0 fw-bold">₹{(orderSummary.totalRevenue / 1000).toFixed(1)}k</h2>
                                </div>
                                <div className="fs-1 text-muted opacity-25">
                                    <i className="fas fa-rupee-sign"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small">Pending Orders</p>
                                    <h2 className="mb-0 fw-bold">{orderSummary.pendingShipment}</h2>
                                </div>
                                <div className="fs-1 text-muted opacity-25">
                                    <i className="fas fa-clock"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small">Units to Ship</p>
                                    <h2 className="mb-0 fw-bold">{orderSummary.totalUnitsToShip}</h2>
                                </div>
                                <div className="fs-1 text-muted opacity-25">
                                    <i className="fas fa-box"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={2}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small">Delivered</p>
                                    <h3 className="mb-0 fw-bold">{orderSummary.deliveredOrders}</h3>
                                </div>
                                <div className="fs-3 text-muted opacity-25">
                                    <i className="fas fa-truck"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={2}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small">Canceled</p>
                                    <h3 className="mb-0 fw-bold">{orderSummary.canceledOrders}</h3>
                                </div>
                                <div className="fs-3 text-muted opacity-25">
                                    <i className="fas fa-times-circle"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={2}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small">Modified</p>
                                    <h3 className="mb-0 fw-bold">{orderSummary.modifiedOrders}</h3>
                                </div>
                                <div className="fs-3 text-muted opacity-25">
                                    <i className="fas fa-edit"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Button
                        onClick={handleShowPicking}
                        variant="outline-dark"
                        className="w-100 h-100 border-2"
                        style={{ minHeight: '80px' }}
                    >
                        <i className="fas fa-clipboard-list me-2 fs-4"></i>
                        <div className="d-inline-block">
                            <div className="fw-bold">Warehouse Picking</div>
                            <small className="text-muted">
                                {unpickedItems.length} to pick • {pickedItemsList.length} picked
                            </small>
                        </div>
                    </Button>
                </Col>

                <Col md={3}>
                    <Button
                        onClick={handleShowShipping}
                        variant="outline-dark"
                        className="w-100 h-100 border-2"
                        style={{ minHeight: '80px' }}
                    >
                        <i className="fas fa-shipping-fast me-2 fs-4"></i>
                        <div className="d-inline-block">
                            <div className="fw-bold">Ready to Ship</div>
                            <small className="text-muted">{orderSummary.itemsToShip.length} items ready</small>
                        </div>
                    </Button>
                </Col>
            </Row>

            {/* Picking Drawer - Right Side */}
            <Offcanvas show={showPicking} onHide={handleClosePicking} placement="end" style={{ width: '700px' }}>
                <Offcanvas.Header closeButton className="border-bottom">
                    <Offcanvas.Title className="fw-semibold">Warehouse Picking List</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    {/* Progress Summary */}
                    <div className="p-3 bg-light border-bottom">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Picking Progress</span>
                            <span className="fw-semibold">
                                {pickedItemsList.length} / {orderSummary.itemsToPick.length}
                            </span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                            <div
                                className="progress-bar bg-dark"
                                style={{
                                    width: `${(pickedItemsList.length / orderSummary.itemsToPick.length) * 100 || 0}%`
                                }}
                            ></div>
                        </div>
                        <small className="text-muted mt-2 d-block " style={{ height: 'unset' }}>
                            <i className="fas fa-info-circle me-1"></i>
                            Received orders only
                        </small>
                    </div>

                    {/* Content Container */}
                    <div style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        {/* Unpicked Items */}
                        {unpickedItems.length > 0 && (
                            <>
                                <div className="p-3 border-bottom bg-white sticky-top">
                                    <h6 className="fw-semibold mb-0 small text-uppercase">
                                        TO PICK ({unpickedItems.length})
                                    </h6>
                                </div>
                                <ListGroup variant="flush">
                                    {unpickedItems.map((item, index) => (
                                        <ListGroup.Item key={item.id} className="border-0 border-bottom px-3 py-3">
                                            <div className="d-flex align-items-start gap-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={!!pickedItems[item.id]}
                                                    onChange={() => handleCheckboxChange(item.id)}
                                                    className="mt-1"
                                                    style={{ transform: 'scale(1.2)' }}
                                                />
                                                <Image
                                                    src={item.image}
                                                    alt={item.productName}
                                                    rounded
                                                    loading="lazy"
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        border: '1px solid #dee2e6'
                                                    }}
                                                />
                                                <div
                                                    className="flex-grow-1"
                                                    style={{ minWidth: 0, cursor: 'pointer' }}
                                                    onClick={() =>
                                                        setExpandedPickItem(expandedPickItem === index ? null : index)
                                                    }
                                                >
                                                    <div className="fw-semibold text-truncate small mb-1">
                                                        {item.productName}
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        <Badge bg="light" text="dark" className="small">
                                                            Size {item.size}
                                                        </Badge>
                                                        <small className="text-muted">
                                                            {item.orderDetails.length} orders
                                                        </small>
                                                        {item.orderDetails.some((o) => o.isModified) && (
                                                            <Badge bg="dark" className="small">
                                                                Modified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold fs-5">{item.totalQty}</div>
                                                    <small className="text-muted">units</small>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {expandedPickItem === index && (
                                                <div className="mt-3 pt-3 border-top">
                                                    <div className="small fw-semibold text-muted mb-2">
                                                        ORDER BREAKDOWN
                                                    </div>
                                                    <div className="d-flex flex-column gap-2">
                                                        {item.orderDetails.map((order, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="p-2 bg-light rounded d-flex justify-content-between align-items-center"
                                                                style={{
                                                                    border: order.isModified
                                                                        ? '1px solid #6c757d'
                                                                        : '1px solid transparent'
                                                                }}
                                                            >
                                                                <div>
                                                                    <div className="small fw-semibold mb-1">
                                                                        {order.orderId}
                                                                    </div>
                                                                    <div className="d-flex gap-1 flex-wrap">
                                                                        <Badge bg="light" text="dark" className="small">
                                                                            {order.status}
                                                                        </Badge>
                                                                        {order.isModified && (
                                                                            <Badge bg="dark" className="small">
                                                                                Modified
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="fw-bold">× {order.qty}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </>
                        )}

                        {/* Picked Items */}
                        {pickedItemsList.length > 0 && (
                            <>
                                <div className="p-3 border-bottom bg-light sticky-top">
                                    <h6 className="fw-semibold mb-0 small text-uppercase text-muted">
                                        PICKED ({pickedItemsList.length})
                                    </h6>
                                </div>
                                <ListGroup variant="flush">
                                    {pickedItemsList.map((item) => (
                                        <ListGroup.Item
                                            key={item.id}
                                            className="border-0 border-bottom px-3 py-3 bg-light"
                                        >
                                            <div className="d-flex align-items-start gap-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={true}
                                                    onChange={() => handleCheckboxChange(item.id)}
                                                    className="mt-1"
                                                    style={{ transform: 'scale(1.2)' }}
                                                />
                                                <Image
                                                    src={item.image}
                                                    alt={item.productName}
                                                    rounded
                                                    loading="lazy"
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        border: '1px solid #dee2e6',
                                                        opacity: 0.6
                                                    }}
                                                />
                                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                    <div
                                                        className="fw-semibold text-truncate small mb-1 text-muted"
                                                        style={{
                                                            textDecoration: 'line-through',
                                                            textDecorationThickness: '2px'
                                                        }}
                                                    >
                                                        {item.productName}
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        <Badge bg="secondary" className="small opacity-75">
                                                            Size {item.size}
                                                        </Badge>
                                                        <small className="text-muted">
                                                            {item.orderDetails.length} orders
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold fs-5 text-muted">{item.totalQty}</div>
                                                    <small className="text-muted">units</small>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </>
                        )}

                        {orderSummary.itemsToPick.length === 0 && (
                            <div className="text-center py-5 text-muted">
                                <i className="fas fa-inbox fs-1 mb-3 d-block" style={{ height: 'unset' }}></i>
                                <p>No items to pick</p>
                            </div>
                        )}
                    </div>
                </Offcanvas.Body>
            </Offcanvas>

            {/* Shipping Drawer - Left Side */}
            <Offcanvas show={showShipping} onHide={handleCloseShipping} placement="start" style={{ width: '700px' }}>
                <Offcanvas.Header closeButton className="border-bottom">
                    <Offcanvas.Title className="fw-semibold">Ready to Ship</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    {/* Shipping Summary */}
                    <div className="p-3 bg-light border-bottom">
                        <div className="d-flex justify-content-between">
                            <span className="text-muted small">Items Ready for Shipment</span>
                            <span className="fw-semibold">{orderSummary.itemsToShip.length} Products</span>
                        </div>
                        <small className="text-muted mt-2 d-block" style={{ height: 'unset' }}>
                            <i className="fas fa-info-circle me-1"></i>
                            Confirmed, Processing & Out for Delivery orders
                        </small>
                    </div>

                    {/* Shipping Items List */}
                    <div style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                        {orderSummary.itemsToShip.length > 0 ? (
                            <ListGroup variant="flush">
                                {orderSummary.itemsToShip.map((item, index) => (
                                    <ListGroup.Item key={item.id} className="border-0 border-bottom px-3 py-3">
                                        <div
                                            onClick={() =>
                                                setExpandedShipItem(expandedShipItem === index ? null : index)
                                            }
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex align-items-start gap-3">
                                                <Image
                                                    src={item.image}
                                                    alt={item.productName}
                                                    rounded
                                                    loading="lazy"
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        border: '1px solid #dee2e6'
                                                    }}
                                                />
                                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                    <div className="fw-semibold text-truncate small mb-1">
                                                        {item.productName}
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        <Badge bg="light" text="dark" className="small">
                                                            Size {item.size}
                                                        </Badge>
                                                        <small className="text-muted">
                                                            {item.orderDetails.length} orders
                                                        </small>
                                                        {item.orderDetails.some((o) => o.isModified) && (
                                                            <Badge bg="dark" className="small">
                                                                Modified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold fs-5">{item.totalQty}</div>
                                                    <small className="text-muted">units</small>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {expandedShipItem === index && (
                                                <div className="mt-3 pt-3 border-top">
                                                    <div className="small fw-semibold text-muted mb-2">
                                                        ORDER BREAKDOWN
                                                    </div>
                                                    <div className="d-flex flex-column gap-2">
                                                        {item.orderDetails.map((order, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="p-2 bg-light rounded d-flex justify-content-between align-items-center"
                                                                style={{
                                                                    border: order.isModified
                                                                        ? '1px solid #6c757d'
                                                                        : '1px solid transparent'
                                                                }}
                                                            >
                                                                <div>
                                                                    <div className="small fw-semibold mb-1">
                                                                        {order.orderId}
                                                                    </div>
                                                                    <div className="d-flex gap-1 flex-wrap">
                                                                        <Badge
                                                                            bg={
                                                                                order.status === 'Confirmed'
                                                                                    ? 'info'
                                                                                    : order.status === 'Processing'
                                                                                    ? 'primary'
                                                                                    : 'warning'
                                                                            }
                                                                            text={
                                                                                order.status === 'Out For Delivery'
                                                                                    ? 'dark'
                                                                                    : 'white'
                                                                            }
                                                                            className="small"
                                                                        >
                                                                            {order.status}
                                                                        </Badge>
                                                                        {order.isModified && (
                                                                            <Badge bg="dark" className="small">
                                                                                Modified
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="fw-bold">× {order.qty}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        ) : (
                            <div className="text-center py-5 text-muted">
                                <i className="fas fa-inbox fs-1 mb-3 d-block" style={{ height: 'unset' }}></i>
                                <p>No items ready to ship</p>
                            </div>
                        )}
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default OrderListSummary;
