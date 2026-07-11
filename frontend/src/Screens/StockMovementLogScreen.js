import React, { useEffect, useState } from 'react';
import { Row, Col, Form, Badge, Table, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import Paginate from '../components/Paginate';
import { getStockMovements } from '../actions/stockActions';
import { logout } from '../actions/userActions';

const MOVEMENT_TYPE_COLORS = {
    PURCHASE: 'success',
    SALE: 'primary',
    SALE_CANCEL: 'warning',
    RETURN: 'info',
    DAMAGE: 'danger',
    CORRECTION: 'secondary',
    OPENING_STOCK: 'dark',
    QUOTATION_RESERVE: 'primary',
    QUOTATION_RELEASE: 'info',
};

const MOVEMENT_TYPES = [
    'PURCHASE', 'SALE', 'SALE_CANCEL', 'RETURN',
    'DAMAGE', 'CORRECTION', 'OPENING_STOCK',
    'QUOTATION_RESERVE', 'QUOTATION_RELEASE',
];

const StockMovementLogScreen = ({ history, match }) => {
    const dispatch = useDispatch();

    const pageNumber = match.params.pageNumber || 1;
    const [movementType, setMovementType] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const stockMovements = useSelector((state) => state.stockMovements);
    const { loading, error, movements, page, pages } = stockMovements;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        } else if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        }
    }, [history, userInfo, dispatch]);

    // Debounce search input by 400ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(getStockMovements(pageNumber, debouncedSearch, movementType, startDate, endDate));
        }
    }, [dispatch, userInfo, pageNumber, movementType, startDate, endDate, debouncedSearch]);

    return (
        <AdminPageLayout>
            <Meta title="Stock Movements - AllSchoolUniform" />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Stock Movement Log</h4>
                <Link to="/admin/stock" className="btn btn-outline-dark">
                    <i className="fas fa-arrow-left me-1"></i> Back to Stock
                </Link>
            </div>

            {/* Filters */}
            <Row className="mb-3 g-2">
                <Col md={3}>
                    <Form.Control
                        type="text"
                        placeholder="Search product..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Col>
                <Col md={3}>
                    <Form.Select
                        value={movementType}
                        onChange={(e) => setMovementType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {MOVEMENT_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
                <Col md={2}>
                    <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start date"
                    />
                </Col>
                <Col md={2}>
                    <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="End date"
                    />
                </Col>
                <Col md={2}>
                    <Button
                        variant="outline-secondary"
                        onClick={() => {
                            setSearch('');
                            setMovementType('');
                            setStartDate('');
                            setEndDate('');
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
            ) : (
                <>
                    <Table bordered hover responsive size="sm">
                        <thead className="table-light">
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Size</th>
                                <th>Type</th>
                                <th className="text-end">Qty Change</th>
                                <th className="text-end">Before</th>
                                <th className="text-end">After</th>
                                <th>By</th>
                                <th>Reason / Ref</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements && movements.length > 0 ? (
                                movements.map((m) => (
                                    <tr key={m._id}>
                                        <td className="text-nowrap">
                                            {new Date(m.createdAt).toLocaleDateString('en-IN')}{' '}
                                            <small className="text-muted">
                                                {new Date(m.createdAt).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </small>
                                        </td>
                                        <td>
                                            <Link to={`/admin/stock/product/${m.product}`}>
                                                {m.productName}
                                            </Link>
                                        </td>
                                        <td>{m.SKU}</td>
                                        <td>{m.size}</td>
                                        <td>
                                            <Badge bg={MOVEMENT_TYPE_COLORS[m.type] || 'secondary'}>
                                                {m.type.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td
                                            className={`text-end fw-bold ${
                                                m.quantityChange > 0 ? 'text-success' : 'text-danger'
                                            }`}
                                        >
                                            {m.quantityChange > 0 ? '+' : ''}
                                            {m.quantityChange}
                                        </td>
                                        <td className="text-end">{m.previousStock}</td>
                                        <td className="text-end">{m.newStock}</td>
                                        <td>{m.performedByName}</td>
                                        <td>
                                            {m.reason || '-'}
                                            {m.orderId && (
                                                <span className="ms-1">
                                                    <Link to={`/admin/order/${m.order}/edit`}>
                                                        <small>Order</small>
                                                    </Link>
                                                </span>
                                            )}
                                            {m.quotationNumber && (
                                                <span className="ms-1">
                                                    <Link to={`/admin/billing/quotation/${m.quotation}/view`}>
                                                        <small>{m.quotationNumber}</small>
                                                    </Link>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="text-center text-muted py-3">
                                        No movements found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>

                    {pages > 1 && (
                        <Paginate pages={pages} page={page} url="/admin/stock/movements" />
                    )}
                </>
            )}
        </AdminPageLayout>
    );
};

export default StockMovementLogScreen;
