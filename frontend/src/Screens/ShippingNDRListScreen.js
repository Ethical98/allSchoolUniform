import React, { useEffect, useState } from 'react';
import { Table, Badge, Button, Form, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import Paginate from '../components/Paginate';
import { getNdrList } from '../actions/shippingActions';
import { logout } from '../actions/userActions';

const ShippingNDRListScreen = ({ history, location }) => {
    const dispatch = useDispatch();
    const [courierFilter, setCourierFilter] = useState('');

    const urlSearchParams = new URLSearchParams(location.search);
    const pageNumber = urlSearchParams.get('page') || 1;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const shippingNdrList = useSelector((state) => state.shippingNdrList);
    const { loading, error, orders, page, pages, total } = shippingNdrList;

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
            dispatch(getNdrList(pageNumber, courierFilter));
        }
    }, [dispatch, userInfo, pageNumber, courierFilter]);

    return (
        <AdminPageLayout>
            <Meta title="NDR Management" />
            <h2>
                <i className="fas fa-exclamation-triangle text-danger me-2" />
                NDR Management
                {total > 0 && <Badge bg="danger" className="ms-2">{total}</Badge>}
            </h2>

            <Row className="mb-3">
                <Col md={4}>
                    <Form.Group>
                        <Form.Control
                            type="text"
                            placeholder="Filter by courier name..."
                            value={courierFilter}
                            onChange={(e) => setCourierFilter(e.target.value)}
                        />
                    </Form.Group>
                </Col>
                <Col md={2}>
                    <Button
                        variant="outline-secondary"
                        onClick={() => dispatch(getNdrList(1, courierFilter))}
                    >
                        <i className="fas fa-sync-alt me-1" /> Refresh
                    </Button>
                </Col>
            </Row>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : orders?.length === 0 ? (
                <Message variant="success">No NDR shipments found</Message>
            ) : (
                <>
                    <Table responsive hover bordered>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>AWB</th>
                                <th>Courier</th>
                                <th>NDR Reason</th>
                                <th>NDR Count</th>
                                <th>Last NDR</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders?.map((o) => (
                                <tr key={o._id}>
                                    <td>{o.orderId}</td>
                                    <td>{o.name}</td>
                                    <td>{o.phone}</td>
                                    <td><Badge bg="info">{o.shipping?.awbCode || 'N/A'}</Badge></td>
                                    <td>{o.shipping?.courierName || 'N/A'}</td>
                                    <td>
                                        <Badge bg="danger">
                                            {o.shipping?.ndr?.lastNdrReason || 'Unknown'}
                                        </Badge>
                                    </td>
                                    <td className="text-center">
                                        <Badge bg={o.shipping?.ndr?.ndrCount >= 3 ? 'danger' : 'warning'}>
                                            {o.shipping?.ndr?.ndrCount || 0}
                                        </Badge>
                                    </td>
                                    <td>
                                        {o.shipping?.ndr?.lastNdrAt
                                            ? new Date(o.shipping.ndr.lastNdrAt).toLocaleDateString('en-IN')
                                            : '-'}
                                    </td>
                                    <td>&#8377;{o.totalPrice?.toFixed(2)}</td>
                                    <td>
                                        <LinkContainer to={`/admin/order/${o._id}/edit`}>
                                            <Button size="sm" variant="outline-primary">
                                                Manage
                                            </Button>
                                        </LinkContainer>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    <Paginate pages={pages} page={page} isAdmin={true} baseUrl="/admin/shipping/ndr" />
                </>
            )}
        </AdminPageLayout>
    );
};

export default ShippingNDRListScreen;
