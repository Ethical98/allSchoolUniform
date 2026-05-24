import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Form, InputGroup, Button } from 'react-bootstrap';
import MaterialTable from 'material-table';
import Message from '../components/Message';
import Loader from '../components/Loader';
import AdminPageLayout from '../components/AdminPageLayout';
import Paginate from '../components/Paginate';
import ReturnStatusBadge from '../components/ReturnStatusBadge';
import { listReturns, getReturnsDashboard } from '../actions/returnActions';
import { logout } from '../actions/userActions';

const STATUSES = [
    '', 'INITIATED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKUP_FAILED',
    'IN_TRANSIT', 'RECEIVED', 'QC_IN_PROGRESS', 'QC_COMPLETED',
    'REFUND_INITIATED', 'EXCHANGE_SHIPPED', 'REPLACEMENT_SHIPPED',
    'COMPLETED', 'REJECTED', 'CANCELLED',
];

const TYPES = ['', 'RETURN', 'EXCHANGE', 'REPLACEMENT'];

const ReturnListScreen = ({ history, location }) => {
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [type, setType] = useState('');

    const urlSearchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const pageNumber = params.page ? params.page : 1;

    const dispatch = useDispatch();

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const returnList = useSelector((state) => state.returnList);
    const { loading, error, returns, pages, page } = returnList;

    const returnDashboard = useSelector((state) => state.returnDashboard);
    const {
        loading: dashLoading,
        error: dashError,
        stats: dashboard,
    } = returnDashboard;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(getReturnsDashboard());
        } else {
            dispatch(logout());
            history.push('/login');
        }
        // eslint-disable-next-line
    }, [dispatch, userInfo]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listReturns(pageNumber, keyword, status, type));
        }
    }, [dispatch, userInfo, pageNumber, keyword, status, type]);

    const searchHandler = (e) => {
        e.preventDefault();
        dispatch(listReturns(1, keyword, status, type));
    };

    const columns = [
        {
            title: '#',
            field: 'tableData.id',
            render: (rowData) => rowData.tableData.id + 1,
        },
        {
            title: 'Return ID',
            field: 'returnId',
        },
        {
            title: 'Order ID',
            field: 'orderId',
        },
        {
            title: 'Customer',
            field: 'customerName',
            render: (item) => item.customerName || '-',
        },
        {
            title: 'Type',
            field: 'type',
        },
        {
            title: 'Status',
            field: 'status',
            render: (item) => <ReturnStatusBadge status={item.status} />,
        },
        {
            title: 'Reason',
            field: 'reason',
            render: (item) => item.reason ? item.reason.substring(0, 30) : '-',
        },
        {
            title: 'Amount',
            field: 'refundAmount',
            render: (item) =>
                item.refundAmount != null ? `₹ ${item.refundAmount}` : '-',
        },
        {
            title: 'Created',
            field: 'createdAt',
            render: (row) => row.createdAt?.substring(0, 10),
        },
    ];

    const DashCard = ({ title, value, variant }) => (
        <Col md={2} sm={4} xs={6} className="mb-3">
            <Card border={variant || 'primary'} className="text-center">
                <Card.Body>
                    <Card.Title style={{ fontSize: '1.5rem' }}>
                        {dashLoading ? '...' : value != null ? value : 0}
                    </Card.Title>
                    <Card.Text style={{ fontSize: '0.8rem' }}>{title}</Card.Text>
                </Card.Body>
            </Card>
        </Col>
    );

    const Table = useMemo(
        () => (
            <MaterialTable
                title="Returns / Exchanges"
                columns={columns}
                data={returns || []}
                options={{
                    rowStyle: { color: 'black' },
                    paging: false,
                    search: false,
                    actionsColumnIndex: -1,
                }}
                onRowClick={(e, rowData) => {
                    window.open(`/admin/returns/${rowData._id}`, '_blank');
                }}
            />
        ),
        // eslint-disable-next-line
        [returns]
    );

    return (
        <AdminPageLayout>
            <h2>Returns & Exchanges</h2>

            {/* Dashboard Stats */}
            {dashError && <Message variant="danger">{dashError}</Message>}
            <Row className="mb-3">
                <DashCard
                    title="Total"
                    value={dashboard?.total}
                    variant="dark"
                />
                <DashCard
                    title="Pending Approval"
                    value={dashboard?.pendingApproval}
                    variant="info"
                />
                <DashCard
                    title="Pending QC"
                    value={dashboard?.pendingQC}
                    variant="warning"
                />
                <DashCard
                    title="Pending Refund"
                    value={dashboard?.pendingRefund}
                    variant="success"
                />
                <DashCard
                    title="Exchanges"
                    value={dashboard?.exchanges}
                    variant="primary"
                />
            </Row>

            {/* Filters */}
            <Row className="mb-3">
                <Col md={3}>
                    <Form onSubmit={searchHandler}>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder="Search by ID, name..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                            <Button type="submit" variant="outline-secondary">
                                <i className="fas fa-search" />
                            </Button>
                        </InputGroup>
                    </Form>
                </Col>
                <Col md={3}>
                    <Form.Control
                        as="select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s ? s.replace(/_/g, ' ') : 'All Statuses'}
                            </option>
                        ))}
                    </Form.Control>
                </Col>
                <Col md={3}>
                    <Form.Control
                        as="select"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        {TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t || 'All Types'}
                            </option>
                        ))}
                    </Form.Control>
                </Col>
            </Row>

            {/* Table */}
            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <>
                    {Table}
                    <Paginate pages={pages} page={page} isAdmin={true} url="/admin/returns" />
                </>
            )}
        </AdminPageLayout>
    );
};

export default ReturnListScreen;
