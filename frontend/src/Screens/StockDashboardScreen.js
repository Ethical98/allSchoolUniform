import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, ProgressBar, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { getStockDashboard } from '../actions/stockActions';
import { logout } from '../actions/userActions';

const MOVEMENT_BADGE = {
    PURCHASE: 'success',
    SALE: 'primary',
    RETURN: 'warning',
    DAMAGE: 'danger',
    CORRECTION: 'secondary',
    TRANSFER: 'info',
    OPENING_STOCK: 'dark',
    SALE_CANCEL: 'warning',
};

const StockDashboardScreen = ({ history }) => {
    const dispatch = useDispatch();
    const [season, setSeason] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const stockDashboard = useSelector((state) => state.stockDashboard);
    const { loading, error, dashboard } = stockDashboard;

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
            dispatch(getStockDashboard(season));
        }
    }, [dispatch, userInfo, season]);

    const summary = dashboard?.summary || {};
    const valuation = dashboard?.valuation || {};
    const activeAlerts = dashboard?.activeAlerts || 0;
    const recentMovements = dashboard?.recentMovements || [];
    const lowStockItems = dashboard?.lowStockItems || [];

    const formatCurrency = (val) => `₹ ${(val || 0).toLocaleString('en-IN')}`;

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const seasonQuery = season ? `&season=${season}` : '';
    const statCards = [
        {
            label: 'Total SKUs',
            value: summary.totalVariants || 0,
            icon: 'fas fa-boxes',
            color: '#4e73df',
            link: `/admin/stock/overview?${seasonQuery}`,
        },
        {
            label: 'In Stock',
            value: summary.inStock || 0,
            icon: 'fas fa-check-circle',
            color: '#1cc88a',
            link: `/admin/stock/overview?stockStatus=in${seasonQuery}`,
        },
        {
            label: 'Low Stock',
            value: summary.lowStock || 0,
            icon: 'fas fa-exclamation-triangle',
            color: '#f6c23e',
            link: `/admin/stock/overview?stockStatus=low${seasonQuery}`,
        },
        {
            label: 'Out of Stock',
            value: summary.outOfStock || 0,
            icon: 'fas fa-times-circle',
            color: '#e74a3b',
            link: `/admin/stock/overview?stockStatus=out${seasonQuery}`,
        },
    ];

    const totalVariants = (summary.inStock || 0) + (summary.lowStock || 0) + (summary.outOfStock || 0);
    const healthPercent = totalVariants > 0
        ? Math.round(((summary.inStock || 0) / totalVariants) * 100)
        : 0;

    return (
        <AdminPageLayout>
            <Meta title="Stock Dashboard - Allschooluniform" />
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>STOCK DASHBOARD</h1>
                <div className="d-flex align-items-center gap-2">
                    <Form.Select
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                        style={{ width: '180px' }}
                    >
                        <option value="">All Seasons</option>
                        <option value="Summer">Summer</option>
                        <option value="Winter">Winter</option>
                    </Form.Select>
                    <LinkContainer to="/admin/stock/overview">
                        <Button variant="outline-primary">
                            <i className="fas fa-list me-1"></i> Stock Overview
                        </Button>
                    </LinkContainer>
                    <LinkContainer to="/admin/stock/adjust">
                        <Button variant="primary">
                            <i className="fas fa-plus me-1"></i> Adjust Stock
                        </Button>
                    </LinkContainer>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <>
                    {/* Stat Cards */}
                    <Row className="mb-4 g-3">
                        {statCards.map((card) => (
                            <Col key={card.label} xl={3} md={6} sm={6}>
                                <Card
                                    className="h-100 shadow-sm"
                                    style={{
                                        borderLeft: `4px solid ${card.color}`,
                                        cursor: 'pointer',
                                        transition: 'transform 0.15s',
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${card.label}: ${card.value}`}
                                    onClick={() => history.push(card.link)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); history.push(card.link); } }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                                >
                                    <Card.Body className="d-flex align-items-center py-3">
                                        <div className="flex-grow-1">
                                            <div className="text-uppercase text-muted small fw-bold mb-1">
                                                {card.label}
                                            </div>
                                            <div className="h4 mb-0 fw-bold" style={{ color: card.color }}>
                                                {card.value}
                                            </div>
                                        </div>
                                        <div>
                                            <i
                                                className={card.icon}
                                                style={{ fontSize: '2rem', color: card.color, opacity: 0.3 }}
                                            ></i>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Stock Health Bar */}
                    <Card className="shadow-sm mb-4">
                        <Card.Body className="py-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold">Stock Health</span>
                                <span className="text-muted small">
                                    {summary.inStock || 0} healthy / {totalVariants} total variants
                                </span>
                            </div>
                            <ProgressBar style={{ height: '12px' }}>
                                <ProgressBar
                                    variant="success"
                                    now={totalVariants > 0 ? ((summary.inStock || 0) / totalVariants) * 100 : 0}
                                    key={1}
                                />
                                <ProgressBar
                                    variant="warning"
                                    now={totalVariants > 0 ? ((summary.lowStock || 0) / totalVariants) * 100 : 0}
                                    key={2}
                                />
                                <ProgressBar
                                    variant="danger"
                                    now={totalVariants > 0 ? ((summary.outOfStock || 0) / totalVariants) * 100 : 0}
                                    key={3}
                                />
                            </ProgressBar>
                            <div className="d-flex gap-3 mt-2">
                                <small><span style={{ color: '#1cc88a' }}>●</span> In Stock</small>
                                <small><span style={{ color: '#f6c23e' }}>●</span> Low Stock</small>
                                <small><span style={{ color: '#e74a3b' }}>●</span> Out of Stock</small>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Valuation + Low Stock Alerts */}
                    <Row className="mb-4 g-3">
                        <Col lg={5}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0 fw-bold">
                                            <i className="fas fa-chart-pie me-2 text-primary"></i>
                                            Inventory Valuation
                                        </h5>
                                        <LinkContainer to="/admin/stock/valuation">
                                            <Button variant="outline-secondary" size="sm">
                                                Full Report
                                            </Button>
                                        </LinkContainer>
                                    </div>

                                    <div className="text-center py-3" style={{ background: '#f8f9fc', borderRadius: '8px' }}>
                                        <div className="text-muted small text-uppercase">Total Units in Stock</div>
                                        <div className="h2 fw-bold text-primary mb-0">
                                            {(valuation.totalItems || 0).toLocaleString('en-IN')}
                                        </div>
                                    </div>

                                    <Row className="mt-3 text-center g-2">
                                        <Col xs={4}>
                                            <div className="py-2" style={{ background: '#f8f9fc', borderRadius: '6px' }}>
                                                <div className="text-muted small">Retail Value</div>
                                                <div className="fw-bold" style={{ color: '#4e73df' }}>
                                                    {formatCurrency(valuation.totalValue)}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={4}>
                                            <div className="py-2" style={{ background: '#f8f9fc', borderRadius: '6px' }}>
                                                <div className="text-muted small">Cost Value</div>
                                                <div className="fw-bold" style={{ color: '#858796' }}>
                                                    {formatCurrency(valuation.costValue)}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={4}>
                                            <div className="py-2" style={{ background: '#d4edda', borderRadius: '6px' }}>
                                                <div className="text-muted small">Profit</div>
                                                <div className="fw-bold" style={{ color: '#1cc88a' }}>
                                                    {formatCurrency(valuation.potentialProfit)}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>

                                    {activeAlerts > 0 && (
                                        <div
                                            className="mt-3 p-2 d-flex align-items-center justify-content-between"
                                            style={{ background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}
                                        >
                                            <span>
                                                <i className="fas fa-bell text-warning me-2"></i>
                                                <strong>{activeAlerts}</strong> active stock alerts
                                            </span>
                                            <LinkContainer to="/admin/stock/overview?stockStatus=low">
                                                <Button variant="warning" size="sm">View</Button>
                                            </LinkContainer>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={7}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0 fw-bold">
                                            <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                                            Low Stock Items
                                        </h5>
                                        <Badge
                                            bg={lowStockItems.length > 0 ? 'danger' : 'success'}
                                            style={{ fontSize: '14px' }}
                                        >
                                            {lowStockItems.length}
                                        </Badge>
                                    </div>

                                    {lowStockItems.length > 0 ? (
                                        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                            <Table hover size="sm" className="mb-0">
                                                <thead style={{ position: 'sticky', top: 0, background: '#fff' }}>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Size</th>
                                                        <th>Stock</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {lowStockItems.map((item) => (
                                                        <tr key={`${item.productId}-${item.size}`}>
                                                            <td>
                                                                <Link
                                                                    to={`/admin/stock/product/${item.productId}`}
                                                                    style={{ textDecoration: 'none' }}
                                                                >
                                                                    <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                                                    <small className="text-muted">{item.SKU}</small>
                                                                </Link>
                                                            </td>
                                                            <td className="align-middle">
                                                                <Badge bg="light" text="dark" style={{ fontSize: '12px' }}>
                                                                    {item.size}
                                                                </Badge>
                                                            </td>
                                                            <td className="align-middle">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <Badge bg={item.currentStock <= 0 ? 'danger' : 'warning'} text={item.currentStock <= 0 ? 'light' : 'dark'}>
                                                                        {item.currentStock}
                                                                    </Badge>
                                                                    <small className="text-muted">/ {item.alertThreshold}</small>
                                                                </div>
                                                            </td>
                                                            <td className="align-middle text-end">
                                                                <LinkContainer to={`/admin/stock/adjust/${item.productId}`}>
                                                                    <Button variant="outline-primary" size="sm">
                                                                        <i className="fas fa-plus-minus"></i>
                                                                    </Button>
                                                                </LinkContainer>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            <i className="fas fa-check-circle fa-3x mb-3" style={{ color: '#1cc88a' }}></i>
                                            <p className="mb-0">All stock levels are healthy</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Movements */}
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-exchange-alt me-2 text-info"></i>
                                    Recent Stock Movements
                                </h5>
                                <LinkContainer to="/admin/stock/movements">
                                    <Button variant="outline-secondary" size="sm">
                                        View All <i className="fas fa-arrow-right ms-1"></i>
                                    </Button>
                                </LinkContainer>
                            </div>

                            {recentMovements.length > 0 ? (
                                <Table hover size="sm" className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Product</th>
                                            <th>Size</th>
                                            <th>Type</th>
                                            <th className="text-center">Change</th>
                                            <th className="text-center">New Stock</th>
                                            <th>By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentMovements.map((movement) => (
                                            <tr key={movement._id}>
                                                <td>
                                                    <small>{formatDate(movement.createdAt)}</small>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 500 }}>{movement.productName}</span>
                                                </td>
                                                <td>
                                                    <Badge bg="light" text="dark" style={{ fontSize: '11px' }}>
                                                        {movement.size}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={MOVEMENT_BADGE[movement.type] || 'secondary'}>
                                                        {movement.type?.replace(/_/g, ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <span
                                                        className="fw-bold"
                                                        style={{
                                                            color: movement.quantityChange > 0 ? '#1cc88a' : '#e74a3b',
                                                        }}
                                                    >
                                                        {movement.quantityChange > 0 ? '+' : ''}
                                                        {movement.quantityChange}
                                                    </span>
                                                </td>
                                                <td className="text-center fw-bold">{movement.newStock}</td>
                                                <td>
                                                    <small className="text-muted">{movement.performedByName}</small>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <i className="fas fa-inbox fa-2x mb-2"></i>
                                    <p className="mb-0">No recent movements</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </>
            )}
        </AdminPageLayout>
    );
};

export default StockDashboardScreen;
