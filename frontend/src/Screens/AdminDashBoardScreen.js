import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { getAdminDashboard } from '../actions/dashboardActions';
import { logout } from '../actions/userActions';

const STATUS_COLORS = {
    Received: '#f6c23e',
    Confirmed: '#4e73df',
    Processing: '#36b9cc',
    Delivered: '#1cc88a',
    Canceled: '#e74a3b',
};

const STATUS_BADGE = {
    Received: 'warning',
    Confirmed: 'primary',
    Processing: 'info',
    'Out For Delivery': 'secondary',
    Delivered: 'success',
    Canceled: 'danger',
};

const formatCurrency = (val) => `₹ ${(val || 0).toLocaleString('en-IN')}`;

const formatCompact = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    });
};

const formatChartDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
    });
};

const parseOrderStatus = (orderStatus) => {
    if (!orderStatus) return 'Received';
    return orderStatus.split(':')[0].trim();
};

// Change indicator component
const ChangeIndicator = ({ value }) => {
    if (value === undefined || value === null) return null;
    const isPositive = value > 0;
    const isZero = value === 0;
    return (
        <small
            className="fw-normal"
            style={{ color: isZero ? '#858796' : isPositive ? '#1cc88a' : '#e74a3b', fontSize: '0.75rem' }}
        >
            {isZero ? '—' : isPositive ? `↑ ${value}%` : `↓ ${Math.abs(value)}%`}
            <span className="text-muted ms-1">vs prior</span>
        </small>
    );
};

const AdminDashBoardScreen = ({ history }) => {
    const dispatch = useDispatch();
    const [period, setPeriod] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const adminDashboard = useSelector((state) => state.adminDashboard);
    const { loading, error, dashboard } = adminDashboard;

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
            if (period === 'custom' && (!startDate || !endDate)) return;
            dispatch(getAdminDashboard(period, startDate, endDate));
        }
    }, [dispatch, userInfo, period, startDate, endDate]);

    const kpis = dashboard?.kpis || {};
    const comparison = dashboard?.comparison || {};
    const revenueTrend = dashboard?.revenueTrend || [];
    const userTrend = dashboard?.userTrend || [];
    const orderStatusDistribution = dashboard?.orderStatusDistribution || [];
    const topProducts = dashboard?.topProducts || [];
    const recentOrders = dashboard?.recentOrders || [];
    const stockSummary = dashboard?.stockSummary || {};

    const statCards = [
        {
            label: 'Total Orders',
            value: kpis.totalOrders || 0,
            icon: 'fas fa-shopping-cart',
            color: '#4e73df',
            change: comparison.ordersChange,
            link: '/admin/orderlist',
        },
        {
            label: 'Revenue',
            value: formatCurrency(kpis.totalRevenue),
            icon: 'fas fa-rupee-sign',
            color: '#1cc88a',
            change: comparison.revenueChange,
        },
        {
            label: 'Avg Order Value',
            value: formatCurrency(kpis.avgOrderValue),
            icon: 'fas fa-chart-line',
            color: '#36b9cc',
            change: comparison.aovChange,
        },
        {
            label: 'New Users',
            value: kpis.newUsers || 0,
            icon: 'fas fa-user-plus',
            color: '#6f42c1',
            change: comparison.newUsersChange,
            link: '/admin/userlist',
        },
        {
            label: 'Pending Orders',
            value: kpis.pendingOrders || 0,
            icon: 'fas fa-clock',
            color: '#f6c23e',
            link: '/admin/orderlist?status=Received',
        },
        {
            label: 'Unpaid Orders',
            value: kpis.unpaidOrders || 0,
            icon: 'fas fa-exclamation-circle',
            color: '#e74a3b',
        },
        {
            label: 'Low Stock Items',
            value: stockSummary.lowStockCount || 0,
            icon: 'fas fa-boxes',
            color: '#858796',
            link: '/admin/stock',
        },
        {
            label: 'Active Carts',
            value: kpis.activeCarts || 0,
            icon: 'fas fa-shopping-basket',
            color: '#fd7e14',
        },
    ];

    const periodLabel = {
        today: 'Today',
        week: 'Last 7 Days',
        month: 'This Month',
        '3months': 'Last 3 Months',
        year: 'This Year',
        custom: 'Custom Range',
    };

    const getPresetDateRange = (p) => {
        const now = new Date();
        const fmt = (d) =>
            d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        switch (p) {
            case 'today':
                return fmt(now);
            case 'week': {
                const s = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return `${fmt(s)} – ${fmt(now)}`;
            }
            case 'month': {
                const s = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return `${fmt(s)} – ${fmt(now)}`;
            }
            case '3months': {
                const s = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                return `${fmt(s)} – ${fmt(now)}`;
            }
            case 'year': {
                const s = new Date(now.getFullYear(), 0, 1);
                return `${fmt(s)} – ${fmt(now)}`;
            }
            default:
                return null;
        }
    };

    return (
        <AdminPageLayout>
            <Meta title="Dashboard - Allschooluniform" />

            {/* Header Row */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                <h1 className="mb-0">DASHBOARD</h1>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Form.Select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        style={{ width: '170px' }}
                    >
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">This Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="year">This Year</option>
                        <option value="custom">Custom Range</option>
                    </Form.Select>
                    {period !== 'custom' && getPresetDateRange(period) && (
                        <span
                            style={{
                                fontSize: '0.78rem',
                                color: '#4e73df',
                                background: '#eef2ff',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <i className="fas fa-calendar-alt me-1"></i>
                            {getPresetDateRange(period)}
                        </span>
                    )}
                    {period === 'custom' && (
                        <>
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ width: '150px' }}
                            />
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ width: '150px' }}
                            />
                        </>
                    )}
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => dispatch(getAdminDashboard(period, startDate, endDate))}
                        title="Refresh"
                    >
                        <i className="fas fa-sync-alt"></i>
                    </Button>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <>
                    {/* KPI Cards */}
                    <Row className="mb-4 g-3">
                        {statCards.map((card) => (
                            <Col key={card.label} xl={3} md={6} sm={6}>
                                <Card
                                    className="h-100 shadow-sm"
                                    style={{
                                        borderLeft: `4px solid ${card.color}`,
                                        cursor: card.link ? 'pointer' : 'default',
                                        transition: 'transform 0.15s',
                                    }}
                                    role={card.link ? 'button' : undefined}
                                    tabIndex={card.link ? 0 : undefined}
                                    aria-label={`${card.label}: ${card.value}`}
                                    onClick={() => card.link && history.push(card.link)}
                                    onKeyDown={(e) => {
                                        if (card.link && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            history.push(card.link);
                                        }
                                    }}
                                    onMouseEnter={(e) => {
                                        if (card.link) e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                >
                                    <Card.Body className="d-flex align-items-center py-3">
                                        <div className="flex-grow-1">
                                            <div className="text-uppercase text-muted small fw-bold mb-1">
                                                {card.label}
                                            </div>
                                            <div className="h4 mb-0 fw-bold" style={{ color: card.color }}>
                                                {card.value}
                                            </div>
                                            {card.change !== undefined && <ChangeIndicator value={card.change} />}
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

                    {/* Charts Row 1: Revenue Trend + Order Status */}
                    <Row className="mb-4 g-3">
                        <Col lg={8}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <Card.Title className="fw-bold mb-3">
                                        <i className="fas fa-chart-line me-2 text-primary"></i>
                                        Revenue Trend
                                        <small className="text-muted fw-normal ms-2">({periodLabel[period]})</small>
                                    </Card.Title>
                                    {revenueTrend.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={revenueTrend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis
                                                    dataKey="date"
                                                    tickFormatter={formatChartDate}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis
                                                    tickFormatter={formatCompact}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <Tooltip
                                                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                                                    labelFormatter={(label) => formatChartDate(label)}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stroke="#4e73df"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={{ r: 5 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            No revenue data for this period
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <Card.Title className="fw-bold mb-3">
                                        <i className="fas fa-chart-pie me-2 text-info"></i>
                                        Order Status
                                    </Card.Title>
                                    {orderStatusDistribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={orderStatusDistribution}
                                                    dataKey="count"
                                                    nameKey="status"
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={55}
                                                    outerRadius={85}
                                                    paddingAngle={3}
                                                >
                                                    {orderStatusDistribution.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color || STATUS_COLORS[entry.status] || '#858796'}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name) => [value, name]}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                    iconSize={10}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            No orders for this period
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Charts Row 2: New Users Trend + Top Products */}
                    <Row className="mb-4 g-3">
                        <Col lg={5}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <Card.Title className="fw-bold mb-3">
                                        <i className="fas fa-user-plus me-2" style={{ color: '#6f42c1' }}></i>
                                        New User Registrations
                                    </Card.Title>
                                    {userTrend.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <AreaChart data={userTrend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis
                                                    dataKey="date"
                                                    tickFormatter={formatChartDate}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis
                                                    allowDecimals={false}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <Tooltip
                                                    formatter={(value) => [value, 'New Users']}
                                                    labelFormatter={(label) => formatChartDate(label)}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="newUsers"
                                                    stroke="#6f42c1"
                                                    fill="#6f42c1"
                                                    fillOpacity={0.15}
                                                    strokeWidth={2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            No new users for this period
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={7}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <Card.Title className="fw-bold mb-3">
                                        <i className="fas fa-trophy me-2 text-success"></i>
                                        Top Products by Revenue
                                    </Card.Title>
                                    {topProducts.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis
                                                    type="number"
                                                    tickFormatter={formatCompact}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    width={130}
                                                    tick={{ fontSize: 11 }}
                                                />
                                                <Tooltip
                                                    formatter={(value, name) => {
                                                        if (name === 'totalRevenue') return [formatCurrency(value), 'Revenue'];
                                                        return [value, name];
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="totalRevenue"
                                                    fill="#1cc88a"
                                                    radius={[0, 4, 4, 0]}
                                                    barSize={20}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            No product data for this period
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Tables Row: Recent Orders + Stock Alerts */}
                    <Row className="mb-4 g-3">
                        <Col lg={7}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Card.Title className="fw-bold mb-0">
                                            <i className="fas fa-box-open me-2 text-primary"></i>
                                            Recent Orders
                                        </Card.Title>
                                        <LinkContainer to="/admin/orderlist">
                                            <Button variant="outline-primary" size="sm">
                                                View All
                                            </Button>
                                        </LinkContainer>
                                    </div>
                                    {recentOrders.length > 0 ? (
                                        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                            <Table hover size="sm" responsive className="mb-0">
                                                <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                    <tr>
                                                        <th>Order ID</th>
                                                        <th>Customer</th>
                                                        <th>Amount</th>
                                                        <th>Status</th>
                                                        <th>Payment</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentOrders.map((order) => {
                                                        const status = parseOrderStatus(order.orderStatus);
                                                        return (
                                                            <tr
                                                                key={order._id}
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => history.push(`/admin/order/${order._id}/edit`)}
                                                            >
                                                                <td className="text-nowrap">
                                                                    <small className="fw-bold">{order.orderId}</small>
                                                                </td>
                                                                <td>{order.name}</td>
                                                                <td className="text-nowrap">
                                                                    {formatCurrency(order.totalPrice)}
                                                                </td>
                                                                <td>
                                                                    <Badge bg={STATUS_BADGE[status] || 'secondary'}>
                                                                        {status}
                                                                    </Badge>
                                                                </td>
                                                                <td>
                                                                    <Badge bg={order.isPaid ? 'success' : 'danger'}>
                                                                        {order.isPaid ? 'Paid' : 'Unpaid'}
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-nowrap">
                                                                    <small>{formatDate(order.createdAt)}</small>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-4">No recent orders</div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={5}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Card.Title className="fw-bold mb-0">
                                            <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                                            Low Stock Alerts
                                        </Card.Title>
                                        <LinkContainer to="/admin/stock">
                                            <Button variant="outline-warning" size="sm">
                                                View All
                                            </Button>
                                        </LinkContainer>
                                    </div>
                                    {stockSummary.lowStockItems && stockSummary.lowStockItems.length > 0 ? (
                                        <Table hover size="sm" className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Size</th>
                                                    <th>Stock</th>
                                                    <th>Threshold</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stockSummary.lowStockItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <small className="fw-bold">{item.productName}</small>
                                                        </td>
                                                        <td>{item.size}</td>
                                                        <td>
                                                            <span
                                                                className="fw-bold"
                                                                style={{
                                                                    color: item.currentStock === 0 ? '#e74a3b' : '#f6c23e',
                                                                }}
                                                            >
                                                                {item.currentStock}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">{item.alertThreshold}</small>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-4">
                                            <i
                                                className="fas fa-check-circle"
                                                style={{ fontSize: '2.5rem', color: '#1cc88a' }}
                                            ></i>
                                            <p className="text-muted mt-2 mb-0">All stock levels healthy</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Quick Actions */}
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title className="fw-bold mb-3">
                                <i className="fas fa-bolt me-2 text-warning"></i>
                                Quick Actions
                            </Card.Title>
                            <div className="d-flex flex-wrap gap-2">
                                <LinkContainer to="/admin/stock/adjust">
                                    <Button variant="outline-primary">
                                        <i className="fas fa-sliders-h me-1"></i> Adjust Stock
                                    </Button>
                                </LinkContainer>
                                <LinkContainer to="/admin/billing/quotation/create">
                                    <Button variant="outline-primary">
                                        <i className="fas fa-file-invoice me-1"></i> Create Quotation
                                    </Button>
                                </LinkContainer>
                                <LinkContainer to="/admin/orderlist">
                                    <Button variant="outline-primary">
                                        <i className="fas fa-list me-1"></i> All Orders
                                    </Button>
                                </LinkContainer>
                                <LinkContainer to="/admin/stock/overview">
                                    <Button variant="outline-primary">
                                        <i className="fas fa-warehouse me-1"></i> Stock Overview
                                    </Button>
                                </LinkContainer>
                                <LinkContainer to="/admin/billing/reports">
                                    <Button variant="outline-primary">
                                        <i className="fas fa-chart-bar me-1"></i> Billing Reports
                                    </Button>
                                </LinkContainer>
                            </div>
                        </Card.Body>
                    </Card>
                </>
            )}
        </AdminPageLayout>
    );
};

export default AdminDashBoardScreen;
