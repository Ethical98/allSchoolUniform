import React, { useEffect, useState } from 'react';
import { Row, Col, Table, Badge, Button, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { getProductStock, acknowledgeStockAlert } from '../actions/stockActions';
import { STOCK_ALERT_ACKNOWLEDGE_RESET, STOCK_PRODUCT_DETAILS_RESET } from '../constants/stockConstants';
import { logout } from '../actions/userActions';

const StockProductDetailScreen = ({ match, history }) => {
    const productId = match.params.id;

    const dispatch = useDispatch();

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const stockProductDetails = useSelector((state) => state.stockProductDetails);
    const { loading, error, product, movements, alerts } = stockProductDetails;

    const stockAlertAcknowledge = useSelector((state) => state.stockAlertAcknowledge);
    const { success: acknowledgeSuccess } = stockAlertAcknowledge;

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
            dispatch(getProductStock(productId));
        }
    }, [dispatch, userInfo, productId]);

    useEffect(() => {
        if (acknowledgeSuccess) {
            dispatch({ type: STOCK_ALERT_ACKNOWLEDGE_RESET });
            dispatch(getProductStock(productId));
        }
    }, [acknowledgeSuccess, dispatch, productId]);

    // Cleanup stale Redux state on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: STOCK_PRODUCT_DETAILS_RESET });
        };
    }, [dispatch]);

    const [movementsPage, setMovementsPage] = useState(1);
    const MOVEMENTS_PER_PAGE = 10;

    const handleAcknowledge = (alertId) => {
        dispatch(acknowledgeStockAlert(alertId));
    };

    return (
        <AdminPageLayout>
            <Meta title={`Stock - ${product?.name || 'Product'} - Allschooluniform`} />
            <Link to="/admin/stock/overview" className="btn btn-light my-3">
                Go Back
            </Link>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : product && product._id ? (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h1>{product.name}</h1>
                            <p className="text-muted">
                                SKU: {product.SKU} | Type: {product.type}
                            </p>
                        </div>
                        <LinkContainer to={`/admin/stock/adjust/${product._id}`}>
                            <Button variant="primary">
                                <i className="fas fa-edit"></i> Adjust Stock
                            </Button>
                        </LinkContainer>
                    </div>

                    {/* Size Variants Table */}
                    <Card className="mb-4 p-3">
                        <Card.Title>Size Variants</Card.Title>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Size</th>
                                    <th>Current Stock</th>
                                    <th>Alert Qty</th>
                                    <th>Price</th>
                                    <th>Cost Price</th>
                                    <th>Last Restocked</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {product.size &&
                                    product.size.map((s) => (
                                        <tr key={s._id || s.size}>
                                            <td>{s.size}</td>
                                            <td>
                                                <strong>{s.countInStock}</strong>
                                            </td>
                                            <td>{s.alertOnQty || '-'}</td>
                                            <td>{`₹ ${s.price}`}</td>
                                            <td>{s.costPrice ? `₹ ${s.costPrice}` : '-'}</td>
                                            <td>
                                                {s.lastRestockedAt
                                                    ? new Date(s.lastRestockedAt).toLocaleDateString('en-IN')
                                                    : '-'}
                                            </td>
                                            <td>
                                                {s.outOfStock || s.countInStock <= 0 ? (
                                                    <Badge bg="danger">Out of Stock</Badge>
                                                ) : s.alertOnQty && s.countInStock <= s.alertOnQty ? (
                                                    <Badge bg="warning" text="dark">Low Stock</Badge>
                                                ) : (
                                                    <Badge bg="success">In Stock</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>
                    </Card>

                    <Row>
                        {/* Active Alerts */}
                        <Col md={4}>
                            <Card className="mb-4 p-3">
                                <Card.Title>
                                    Active Alerts{' '}
                                    <Badge bg="danger">{alerts ? alerts.filter((a) => a.status === 'ACTIVE').length : 0}</Badge>
                                </Card.Title>
                                {alerts && alerts.filter((a) => a.status === 'ACTIVE').length > 0 ? (
                                    <Table size="sm" bordered>
                                        <thead>
                                            <tr>
                                                <th>Size</th>
                                                <th>Stock</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {alerts
                                                .filter((a) => a.status === 'ACTIVE')
                                                .map((alert) => (
                                                    <tr key={alert._id}>
                                                        <td>{alert.size}</td>
                                                        <td>
                                                            <Badge bg="danger">{alert.currentStock}</Badge>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-warning"
                                                                onClick={() => handleAcknowledge(alert._id)}
                                                            >
                                                                Acknowledge
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p className="text-muted">No active alerts</p>
                                )}
                            </Card>
                        </Col>

                        {/* Recent Movements */}
                        <Col md={8}>
                            <Card className="mb-4 p-3">
                                <Card.Title>Recent Stock Movements</Card.Title>
                                {movements && movements.length > 0 ? (
                                    <>
                                    <Table striped bordered hover size="sm">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Size</th>
                                                <th>Type</th>
                                                <th>Change</th>
                                                <th>Previous</th>
                                                <th>New</th>
                                                <th>By</th>
                                                <th>Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movements.slice(0, movementsPage * MOVEMENTS_PER_PAGE).map((m) => (
                                                <tr key={m._id}>
                                                    <td>{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                                                    <td>{m.size}</td>
                                                    <td>
                                                        <Badge bg={m.quantityChange > 0 ? 'success' : 'danger'}>
                                                            {m.type}
                                                        </Badge>
                                                    </td>
                                                    <td style={{ color: m.quantityChange > 0 ? 'green' : 'red' }}>
                                                        {m.quantityChange > 0 ? '+' : ''}
                                                        {m.quantityChange}
                                                    </td>
                                                    <td>{m.previousStock}</td>
                                                    <td>{m.newStock}</td>
                                                    <td>{m.performedByName}</td>
                                                    <td>{m.reason || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                    {movements.length > movementsPage * MOVEMENTS_PER_PAGE && (
                                        <div className="text-center">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setMovementsPage(movementsPage + 1)}
                                            >
                                                Show More ({movements.length - movementsPage * MOVEMENTS_PER_PAGE} remaining)
                                            </Button>
                                        </div>
                                    )}
                                    </>
                                ) : (
                                    <p className="text-muted">No movements recorded</p>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </>
            ) : (
                <Message variant="info">Product not found</Message>
            )}
        </AdminPageLayout>
    );
};

export default StockProductDetailScreen;
