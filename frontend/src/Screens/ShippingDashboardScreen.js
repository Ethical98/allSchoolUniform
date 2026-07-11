import React, { useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { getShippingDashboard } from '../actions/shippingActions';
import { logout } from '../actions/userActions';

const ShippingDashboardScreen = ({ history }) => {
    const dispatch = useDispatch();

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const shippingDashboard = useSelector((state) => state.shippingDashboard);
    const { loading, error, dashboard } = shippingDashboard;

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
            dispatch(getShippingDashboard());
        }
    }, [dispatch, userInfo]);

    const summary = dashboard?.summary || {};
    const activeShipments = dashboard?.activeShipments || [];
    const ndrAlerts = dashboard?.ndrAlerts || [];
    const stuckList = dashboard?.stuckList || [];

    const summaryCards = [
        { label: 'Total Shipped', value: summary.totalShipped || 0, bg: 'primary', icon: 'fas fa-shipping-fast' },
        { label: 'In Transit', value: summary.inTransit || 0, bg: 'info', icon: 'fas fa-truck' },
        { label: 'Delivered', value: summary.delivered || 0, bg: 'success', icon: 'fas fa-check-circle' },
        { label: 'NDR Active', value: summary.ndrActive || 0, bg: 'danger', icon: 'fas fa-exclamation-triangle' },
        { label: 'RTO', value: summary.rtoCount || 0, bg: 'warning', icon: 'fas fa-undo' },
        { label: 'Stuck (48h+)', value: summary.stuckShipments || 0, bg: 'dark', icon: 'fas fa-clock' },
    ];

    return (
        <AdminPageLayout>
            <Meta title="Shipping Dashboard" />
            <h2>Shipping Dashboard</h2>
            <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => dispatch(getShippingDashboard())}>
                <i className="fas fa-sync-alt me-1" /> Refresh
            </Button>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <>
                    {/* Summary cards */}
                    <Row className="mb-4">
                        {summaryCards.map((card) => (
                            <Col key={card.label} md={2} sm={4} xs={6} className="mb-3">
                                <Card bg={card.bg} text="white" className="text-center h-100">
                                    <Card.Body className="py-3">
                                        <i className={`${card.icon} fa-2x mb-2`} />
                                        <h3 className="mb-0">{card.value}</h3>
                                        <small>{card.label}</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* NDR Alerts */}
                    {ndrAlerts.length > 0 && (
                        <Card className="mb-4 border-danger">
                            <Card.Header className="bg-danger text-white">
                                <i className="fas fa-exclamation-triangle me-2" />
                                NDR Alerts — Action Required ({ndrAlerts.length})
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>AWB</th>
                                            <th>Courier</th>
                                            <th>NDR Reason</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ndrAlerts.map((o) => (
                                            <tr key={o._id}>
                                                <td>{o.orderId}</td>
                                                <td>{o.name}</td>
                                                <td><Badge bg="info">{o.shipping?.awbCode}</Badge></td>
                                                <td>{o.shipping?.courierName}</td>
                                                <td>
                                                    <Badge bg="danger">{o.shipping?.ndr?.lastNdrReason || 'N/A'}</Badge>
                                                </td>
                                                <td>
                                                    <LinkContainer to={`/admin/order/${o._id}/edit`}>
                                                        <Button size="sm" variant="outline-primary">View</Button>
                                                    </LinkContainer>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Stuck Shipments */}
                    {stuckList.length > 0 && (
                        <Card className="mb-4 border-warning">
                            <Card.Header className="bg-warning text-dark">
                                <i className="fas fa-clock me-2" />
                                Stuck Shipments — No Update in 48+ Hours ({stuckList.length})
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>AWB</th>
                                            <th>Courier</th>
                                            <th>Status</th>
                                            <th>Last Sync</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stuckList.map((o) => (
                                            <tr key={o._id}>
                                                <td>{o.orderId}</td>
                                                <td>{o.name}</td>
                                                <td><Badge bg="info">{o.shipping?.awbCode}</Badge></td>
                                                <td>{o.shipping?.courierName}</td>
                                                <td><Badge bg="secondary">{o.shipping?.status}</Badge></td>
                                                <td>
                                                    {o.shipping?.syncedAt
                                                        ? new Date(o.shipping.syncedAt).toLocaleString('en-IN')
                                                        : 'Never'}
                                                </td>
                                                <td>
                                                    <LinkContainer to={`/admin/order/${o._id}/edit`}>
                                                        <Button size="sm" variant="outline-primary">View</Button>
                                                    </LinkContainer>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Active Shipments */}
                    <Card>
                        <Card.Header>
                            <i className="fas fa-truck me-2" />
                            Active Shipments ({activeShipments.length})
                        </Card.Header>
                        <Card.Body className="p-0">
                            {activeShipments.length === 0 ? (
                                <p className="p-3 mb-0 text-muted">No active shipments</p>
                            ) : (
                                <Table responsive hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>AWB</th>
                                            <th>Courier</th>
                                            <th>Status</th>
                                            <th>EDD</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeShipments.map((o) => (
                                            <tr key={o._id}>
                                                <td>{o.orderId}</td>
                                                <td>{o.name}</td>
                                                <td><Badge bg="info">{o.shipping?.awbCode || 'Pending'}</Badge></td>
                                                <td>{o.shipping?.courierName || '-'}</td>
                                                <td>
                                                    <Badge bg={
                                                        o.shipping?.ndr?.isNDR ? 'danger' :
                                                        o.shipping?.isRTO ? 'warning' : 'primary'
                                                    }>
                                                        {o.shipping?.ndr?.isNDR ? 'NDR' :
                                                         o.shipping?.isRTO ? 'RTO' :
                                                         o.shipping?.status || 'Shipped'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {o.shipping?.estimatedDeliveryDate
                                                        ? new Date(o.shipping.estimatedDeliveryDate).toLocaleDateString('en-IN')
                                                        : '-'}
                                                </td>
                                                <td>
                                                    <LinkContainer to={`/admin/order/${o._id}/edit`}>
                                                        <Button size="sm" variant="outline-primary">View</Button>
                                                    </LinkContainer>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </>
            )}
        </AdminPageLayout>
    );
};

export default ShippingDashboardScreen;
