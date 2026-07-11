import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Card, Badge, ListGroup, Image, Button, Offcanvas, Form, Row, Col } from 'react-bootstrap';
import { groupBy, sumBy } from 'lodash';

// Size ordering for sorting
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

const getSizeSortKey = (size) => {
    const upperSize = (size || '').toUpperCase().trim();
    const idx = SIZE_ORDER.indexOf(upperSize);
    if (idx !== -1) return idx;
    // Numeric sizes (e.g., "28", "30", "32")
    const num = parseFloat(upperSize);
    if (!isNaN(num)) return 100 + num;
    // Fallback: alphabetical
    return 200;
};

// Helper to group flat items into product-level groups with nested sizes
const groupItemsByProduct = (flatItems) => {
    // First group by product name
    const byProduct = groupBy(flatItems, 'name');

    return Object.entries(byProduct)
        .map(([productName, items]) => {
            // Group this product's items by size
            const bySize = groupBy(items, 'size');
            const sizes = Object.entries(bySize)
                .map(([size, sizeItems]) => ({
                    size,
                    totalQty: sumBy(sizeItems, 'qty'),
                    orderDetails: sizeItems.map((i) => ({
                        orderId: i.orderId,
                        qty: i.qty,
                        status: i.orderStatus,
                        isModified: i.isModified
                    }))
                }))
                .sort((a, b) => getSizeSortKey(a.size) - getSizeSortKey(b.size));

            const totalOrders = new Set(items.map((i) => i.orderId)).size;

            return {
                id: productName,
                productName,
                image: items[0].image,
                totalQty: sumBy(items, 'qty'),
                totalOrders,
                hasModified: items.some((i) => i.isModified),
                sizes
            };
        })
        .sort((a, b) => b.totalQty - a.totalQty);
};

// Indeterminate checkbox component
const IndeterminateCheckbox = ({ checked, indeterminate, onChange, className, style }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);
    return (
        <Form.Check
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className={className}
            style={style}
        />
    );
};

const OrderListSummary = ({ orders = [] }) => {
    const [showPicking, setShowPicking] = useState(false);
    const [showShipping, setShowShipping] = useState(false);
    const [expandedPickItem, setExpandedPickItem] = useState(null);
    const [expandedShipItem, setExpandedShipItem] = useState(null);
    const [pickedSizes, setPickedSizes] = useState({}); // keyed by "productName|size"

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
                itemsToShip: [],
                totalSizesToPick: 0
            };
        }

        const ordersToShip = orders.filter((order) => !order.tracking.isDelivered && !order.tracking.isCanceled);
        const modifiedOrders = orders.filter((order) => order.modified === true).length;

        const ordersForPicking = ordersToShip.filter(
            (order) => !order.tracking.isConfirmed && !order.tracking.isProcessing && !order.tracking.isOutForDelivery
        );

        const ordersForShipping = ordersToShip.filter(
            (order) => order.tracking.isConfirmed || order.tracking.isProcessing || order.tracking.isOutForDelivery
        );

        // Collect flat items for picking
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

        // Collect flat items for shipping
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

        const totalUnitsToShip = ordersToShip.reduce(
            (sum, order) =>
                sum +
                (order.modified && order.modifiedItems ? order.modifiedItems : order.orderItems).reduce(
                    (itemSum, item) => itemSum + item.qty,
                    0
                ),
            0
        );

        // Group by product with nested sizes
        const itemsToPick = groupItemsByProduct(allItemsToPick);
        const itemsToShip = groupItemsByProduct(allItemsToShip);

        // Count total size entries for progress tracking
        const totalSizesToPick = itemsToPick.reduce((sum, p) => sum + p.sizes.length, 0);

        return {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
            totalUnitsToShip,
            pendingShipment: ordersToShip.length,
            deliveredOrders: orders.filter((order) => order.tracking.isDelivered).length,
            canceledOrders: orders.filter((order) => order.tracking.isCanceled).length,
            modifiedOrders,
            itemsToPick,
            itemsToShip,
            totalSizesToPick
        };
    }, [orders]);

    // Handle individual size checkbox
    const handleSizeCheck = useCallback((productName, size) => {
        const key = `${productName}|${size}`;
        setPickedSizes((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    }, []);

    // Handle product-level checkbox (toggle all sizes)
    const handleProductCheck = useCallback((product) => {
        const allPicked = product.sizes.every((s) => pickedSizes[`${product.productName}|${s.size}`]);
        setPickedSizes((prev) => {
            const next = { ...prev };
            product.sizes.forEach((s) => {
                next[`${product.productName}|${s.size}`] = !allPicked;
            });
            return next;
        });
    }, [pickedSizes]);

    // Check if a product is fully picked, partially picked
    const getProductPickState = useCallback(
        (product) => {
            const pickedCount = product.sizes.filter((s) => pickedSizes[`${product.productName}|${s.size}`]).length;
            if (pickedCount === 0) return 'none';
            if (pickedCount === product.sizes.length) return 'all';
            return 'partial';
        },
        [pickedSizes]
    );

    // Separate products into unpicked (any size unpicked) and fully picked
    const unpickedProducts = orderSummary.itemsToPick.filter((p) => getProductPickState(p) !== 'all');
    const pickedProducts = orderSummary.itemsToPick.filter((p) => getProductPickState(p) === 'all');

    // Count picked sizes for progress
    const pickedSizeCount = orderSummary.itemsToPick.reduce(
        (sum, p) => sum + p.sizes.filter((s) => pickedSizes[`${p.productName}|${s.size}`]).length,
        0
    );

    return (
        <>
            {/* Summary Cards */}
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
                                {unpickedProducts.length} to pick • {pickedProducts.length} picked
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
                            <small className="text-muted">{orderSummary.itemsToShip.length} products ready</small>
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
                                {pickedSizeCount} / {orderSummary.totalSizesToPick} sizes
                            </span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                            <div
                                className="progress-bar bg-dark"
                                style={{
                                    width: `${(pickedSizeCount / orderSummary.totalSizesToPick) * 100 || 0}%`
                                }}
                            ></div>
                        </div>
                        <small className="text-muted mt-2 d-block" style={{ height: 'unset' }}>
                            <i className="fas fa-info-circle me-1"></i>
                            Received orders only • {orderSummary.itemsToPick.length} products, {orderSummary.totalSizesToPick} sizes
                        </small>
                    </div>

                    {/* Content Container */}
                    <div style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        {/* Unpicked Products */}
                        {unpickedProducts.length > 0 && (
                            <>
                                <div className="p-3 border-bottom bg-white sticky-top">
                                    <h6 className="fw-semibold mb-0 small text-uppercase">
                                        TO PICK ({unpickedProducts.length} products)
                                    </h6>
                                </div>
                                <ListGroup variant="flush">
                                    {unpickedProducts.map((product, index) => {
                                        const pickState = getProductPickState(product);
                                        const isExpanded = expandedPickItem === index;
                                        return (
                                            <ListGroup.Item
                                                key={product.id}
                                                className="border-0 border-bottom px-3 py-0"
                                            >
                                                {/* Product Header */}
                                                <div className="d-flex align-items-start gap-3 py-3">
                                                    <IndeterminateCheckbox
                                                        checked={pickState === 'all'}
                                                        indeterminate={pickState === 'partial'}
                                                        onChange={() => handleProductCheck(product)}
                                                        className="mt-1"
                                                        style={{ transform: 'scale(1.2)' }}
                                                    />
                                                    <Image
                                                        src={product.image}
                                                        alt={product.productName}
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
                                                            {product.productName}
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                                            <small className="text-muted">
                                                                {product.sizes.length} sizes • {product.totalOrders} orders
                                                            </small>
                                                            {product.hasModified && (
                                                                <Badge bg="dark" className="small">
                                                                    Modified
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="fw-bold fs-5">{product.totalQty}</div>
                                                        <small className="text-muted">units</small>
                                                    </div>
                                                </div>

                                                {/* Sizes Table */}
                                                <div
                                                    className="mb-3 ms-4 ps-3"
                                                    style={{
                                                        borderLeft: '2px solid #e9ecef'
                                                    }}
                                                >
                                                    {product.sizes.map((sizeEntry) => {
                                                        const sizeKey = `${product.productName}|${sizeEntry.size}`;
                                                        const isSizePicked = !!pickedSizes[sizeKey];
                                                        return (
                                                            <div
                                                                key={sizeEntry.size}
                                                                className="d-flex align-items-center gap-2 py-2"
                                                                style={{
                                                                    borderBottom: '1px solid #f8f9fa',
                                                                    opacity: isSizePicked ? 0.5 : 1
                                                                }}
                                                            >
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    checked={isSizePicked}
                                                                    onChange={() =>
                                                                        handleSizeCheck(
                                                                            product.productName,
                                                                            sizeEntry.size
                                                                        )
                                                                    }
                                                                    style={{ transform: 'scale(1.0)' }}
                                                                />
                                                                <Badge
                                                                    bg={isSizePicked ? 'secondary' : 'dark'}
                                                                    style={{
                                                                        minWidth: '42px',
                                                                        textDecoration: isSizePicked
                                                                            ? 'line-through'
                                                                            : 'none'
                                                                    }}
                                                                >
                                                                    {sizeEntry.size}
                                                                </Badge>
                                                                <span
                                                                    className={`fw-semibold small ${isSizePicked ? 'text-muted' : ''}`}
                                                                    style={{
                                                                        textDecoration: isSizePicked
                                                                            ? 'line-through'
                                                                            : 'none'
                                                                    }}
                                                                >
                                                                    × {sizeEntry.totalQty}
                                                                </span>
                                                                <small className="text-muted ms-auto">
                                                                    {sizeEntry.orderDetails.length} orders
                                                                </small>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Order Breakdown Toggle */}
                                                    <div
                                                        className="py-2 small text-muted d-flex align-items-center gap-1"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() =>
                                                            setExpandedPickItem(isExpanded ? null : index)
                                                        }
                                                    >
                                                        <i
                                                            className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} me-1`}
                                                        ></i>
                                                        Order Breakdown
                                                    </div>

                                                    {/* Expanded Order Details */}
                                                    {isExpanded && (
                                                        <div className="pb-2">
                                                            {product.sizes.map((sizeEntry) => (
                                                                <div key={sizeEntry.size} className="mb-2">
                                                                    <div className="small fw-semibold text-muted mb-1">
                                                                        Size {sizeEntry.size}
                                                                    </div>
                                                                    <div className="d-flex flex-column gap-1">
                                                                        {sizeEntry.orderDetails.map((order, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="p-2 bg-light rounded d-flex justify-content-between align-items-center"
                                                                                style={{
                                                                                    border: order.isModified
                                                                                        ? '1px solid #6c757d'
                                                                                        : '1px solid transparent',
                                                                                    fontSize: '0.8rem'
                                                                                }}
                                                                            >
                                                                                <div>
                                                                                    <span className="fw-semibold">
                                                                                        {order.orderId}
                                                                                    </span>
                                                                                    {order.isModified && (
                                                                                        <Badge
                                                                                            bg="dark"
                                                                                            className="small ms-2"
                                                                                        >
                                                                                            Modified
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                                <span className="fw-bold">
                                                                                    × {order.qty}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </ListGroup.Item>
                                        );
                                    })}
                                </ListGroup>
                            </>
                        )}

                        {/* Fully Picked Products */}
                        {pickedProducts.length > 0 && (
                            <>
                                <div className="p-3 border-bottom bg-light sticky-top">
                                    <h6 className="fw-semibold mb-0 small text-uppercase text-muted">
                                        PICKED ({pickedProducts.length} products)
                                    </h6>
                                </div>
                                <ListGroup variant="flush">
                                    {pickedProducts.map((product) => (
                                        <ListGroup.Item
                                            key={product.id}
                                            className="border-0 border-bottom px-3 py-0 bg-light"
                                        >
                                            {/* Product Header */}
                                            <div className="d-flex align-items-start gap-3 py-3">
                                                <IndeterminateCheckbox
                                                    checked={true}
                                                    indeterminate={false}
                                                    onChange={() => handleProductCheck(product)}
                                                    className="mt-1"
                                                    style={{ transform: 'scale(1.2)' }}
                                                />
                                                <Image
                                                    src={product.image}
                                                    alt={product.productName}
                                                    rounded
                                                    loading="lazy"
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        border: '1px solid #dee2e6',
                                                        opacity: 0.5
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
                                                        {product.productName}
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        {product.sizes.map((s) => (
                                                            <Badge
                                                                key={s.size}
                                                                bg="secondary"
                                                                className="small opacity-50"
                                                            >
                                                                {s.size} × {s.totalQty}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold fs-5 text-muted">
                                                        {product.totalQty}
                                                    </div>
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
                                {orderSummary.itemsToShip.map((product, index) => {
                                    const isExpanded = expandedShipItem === index;
                                    return (
                                        <ListGroup.Item
                                            key={product.id}
                                            className="border-0 border-bottom px-3 py-0"
                                        >
                                            {/* Product Header */}
                                            <div
                                                className="d-flex align-items-start gap-3 py-3"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() =>
                                                    setExpandedShipItem(isExpanded ? null : index)
                                                }
                                            >
                                                <Image
                                                    src={product.image}
                                                    alt={product.productName}
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
                                                        {product.productName}
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        <small className="text-muted">
                                                            {product.sizes.length} sizes • {product.totalOrders} orders
                                                        </small>
                                                        {product.hasModified && (
                                                            <Badge bg="dark" className="small">
                                                                Modified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold fs-5">{product.totalQty}</div>
                                                    <small className="text-muted">units</small>
                                                </div>
                                            </div>

                                            {/* Sizes Table */}
                                            <div
                                                className="mb-3 ms-4 ps-3"
                                                style={{ borderLeft: '2px solid #e9ecef' }}
                                            >
                                                {product.sizes.map((sizeEntry) => (
                                                    <div
                                                        key={sizeEntry.size}
                                                        className="d-flex align-items-center gap-2 py-2"
                                                        style={{ borderBottom: '1px solid #f8f9fa' }}
                                                    >
                                                        <Badge bg="dark" style={{ minWidth: '42px' }}>
                                                            {sizeEntry.size}
                                                        </Badge>
                                                        <span className="fw-semibold small">
                                                            × {sizeEntry.totalQty}
                                                        </span>
                                                        <small className="text-muted ms-auto">
                                                            {sizeEntry.orderDetails.length} orders
                                                        </small>
                                                        <div className="d-flex gap-1">
                                                            {/* Show unique statuses for this size */}
                                                            {[
                                                                ...new Set(
                                                                    sizeEntry.orderDetails.map((o) => o.status)
                                                                )
                                                            ].map((status) => (
                                                                <Badge
                                                                    key={status}
                                                                    bg={
                                                                        status === 'Confirmed'
                                                                            ? 'info'
                                                                            : status === 'Processing'
                                                                            ? 'primary'
                                                                            : 'warning'
                                                                    }
                                                                    text={
                                                                        status === 'Out For Delivery'
                                                                            ? 'dark'
                                                                            : 'white'
                                                                    }
                                                                    className="small"
                                                                >
                                                                    {status}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Order Breakdown Toggle */}
                                                <div
                                                    className="py-2 small text-muted d-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedShipItem(isExpanded ? null : index);
                                                    }}
                                                >
                                                    <i
                                                        className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} me-1`}
                                                    ></i>
                                                    Order Breakdown
                                                </div>

                                                {/* Expanded Order Details */}
                                                {isExpanded && (
                                                    <div className="pb-2">
                                                        {product.sizes.map((sizeEntry) => (
                                                            <div key={sizeEntry.size} className="mb-2">
                                                                <div className="small fw-semibold text-muted mb-1">
                                                                    Size {sizeEntry.size}
                                                                </div>
                                                                <div className="d-flex flex-column gap-1">
                                                                    {sizeEntry.orderDetails.map((order, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="p-2 bg-light rounded d-flex justify-content-between align-items-center"
                                                                            style={{
                                                                                border: order.isModified
                                                                                    ? '1px solid #6c757d'
                                                                                    : '1px solid transparent',
                                                                                fontSize: '0.8rem'
                                                                            }}
                                                                        >
                                                                            <div>
                                                                                <span className="fw-semibold">
                                                                                    {order.orderId}
                                                                                </span>
                                                                                <Badge
                                                                                    bg={
                                                                                        order.status === 'Confirmed'
                                                                                            ? 'info'
                                                                                            : order.status ===
                                                                                              'Processing'
                                                                                            ? 'primary'
                                                                                            : 'warning'
                                                                                    }
                                                                                    text={
                                                                                        order.status ===
                                                                                        'Out For Delivery'
                                                                                            ? 'dark'
                                                                                            : 'white'
                                                                                    }
                                                                                    className="small ms-2"
                                                                                >
                                                                                    {order.status}
                                                                                </Badge>
                                                                                {order.isModified && (
                                                                                    <Badge
                                                                                        bg="dark"
                                                                                        className="small ms-1"
                                                                                    >
                                                                                        Modified
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <span className="fw-bold">
                                                                                × {order.qty}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </ListGroup.Item>
                                    );
                                })}
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
